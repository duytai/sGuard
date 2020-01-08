const assert = require('assert')
const { intersection, uniqBy } = require('lodash')
const DNode = require('./dnode')
const { prettify, formatSymbol } = require('../shared')

class Analyzer {
  constructor(data, endPoints) {
    const { symbol, trace, pc } = data
    this.symbol = symbol 
    this.trace = trace
    this.endPoints = endPoints
    this.run(this.findConds(pc))
  }

  /// Find jumpi nodes where our `pc` depends on
  /// and collect conditions at that jumpi
  findConds(pc) {
    const executionPaths = this.endPoints.map(({ ep, trace }) => ep.ep)
    const pcIncludingExecutionPaths = executionPaths.filter(p => p.find(pp => pp.pc == pc))
    const pcExcludingExecutionPaths = executionPaths.filter(p => !p.find(pp => pp.pc == pc))
    const pathToBranchKeys = (p) => {
      const keys = []
      for (let i = 0; i < p.length - 1; i ++) {
        const current = p[i]
        const next = p[i + 1]
        if (current.opcode.name == 'JUMPI') {
          keys.push({ from: current.pc, to: next.pc })
        }
      }
      return keys 
    }
    const dJumpis = []
    const pcIncludingJumpis = pcIncludingExecutionPaths
      .reduce((r, p) => [...r, ...pathToBranchKeys(p)], [])
    const pcExcludingJumpis = pcExcludingExecutionPaths
      .reduce((r, p) => [...r, ...pathToBranchKeys(p)], [])
    pcIncludingJumpis.forEach(ikey => {
      pcExcludingJumpis.forEach(ekey => {
        if (ikey.from == ekey.from && ikey.to != ekey.to) {
          if (!dJumpis.includes(ikey.from)) {
            dJumpis.push(ikey.from)
          }
        }
      })
    })
    const conds = []
    executionPaths.forEach(ep => {
      ep.forEach(({ pc, opcode: { name }, stack }) => {
        if (dJumpis.includes(pc)) {
          const [label, cond] = stack.clone().popN(2)
          conds.push({ pc, cond })
        }
      })
    })
    return uniqBy(conds, ({ cond }) => formatSymbol(cond))
  }

  run(conds) {
    /// Internal analysis 
    this.dnode = new DNode(this.symbol, this.trace)
    const sloads = this.dnode.findSloads()
    /// Cross function analysis
    this.endPoints.forEach(({ trace }) => {
      sloads.forEach(sload => {
        const { variable: loadVariable, childs } = sload.node
        trace.eachStateVariable((storeVariable, storedValue, traceIdx, pc) => {
          const subTrace = trace.sub(traceIdx)
          /// sload corresponds to other sstores in other function
          if (storeVariable.partialEqual(loadVariable)) {
            /// dont need to get symbolMembers of loadVariable
            storeVariable.getSymbolMembers().forEach(m => {
              const dnode = new DNode(m, subTrace)
              childs.push(dnode)
            })
            /// since sstore here, we need to analyze sstore dependency 
            const data = { pc, symbol: storedValue, trace }
            const analyzer = new Analyzer(data, this.endPoints)
            childs.push(analyzer.dnode);
          }
        })
      })
    })
    /// Condition analysis
    conds.forEach(({ pc, cond }) => {
      const data = { pc, symbol: cond, trace: this.trace }
      const analyzer = new Analyzer(data, this.endPoints)
      const childs = this.dnode.node.childs
      childs.push(analyzer.dnode)
    })
  }

  prettify() {
    this.trace.prettify()
    this.dnode.prettify()
  }
}
module.exports = Analyzer
