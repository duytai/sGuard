const assert = require('assert')
const { intersection, uniqBy, assign } = require('lodash')
const DNode = require('./dnode')
const { prettify, formatSymbol } = require('../shared')

class RegisterAnalayzer {
  constructor({ symbol, trace, pc, ep }, endPoints, visited = []) {
    assign(this, { symbol, trace, pc, endPoints, ep })
    visited.push(pc)
    trace.prettify()
    this.dnode = new DNode(symbol, trace)
    this.conditionAnalysis(visited)
    this.crossfunctionAnalysis(visited)
  }

  crossfunctionAnalysis(visited) {
    const sloads = this.dnode.findSloads()
    this.endPoints.forEach(({ trace, ep }) => {
      sloads.forEach(sload => {
        const loadVariable = sload.getVariable()
        trace.eachStateVariable((storeVariable, storedValue, traceIdx, pc) => {
          /// If it is exactEqual, return true to break forEach loop 
          if (storeVariable.exactEqual(loadVariable)) {
            if (!visited.includes(pc)) {
              /// since sstore here, we need to analyze sstore dependency
              const data = { pc, symbol: storedValue, trace, ep }
              const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
              sload.addChild(analyzer.dnode)
            }
            return true
          }
          const subTrace = trace.sub(traceIdx)
          /// sload corresponds to other sstores in other function
          if (storeVariable.partialEqual(loadVariable)) {
            /// dont need to get symbolMembers of loadVariable
            storeVariable.getSymbolMembers().forEach(m => {
              const dnode = new DNode(m, subTrace)
              sload.addChild(dnode)
            })
            if (!visited.includes(pc)) {
              /// since sstore here, we need to analyze sstore dependency
              const data = { pc, symbol: storedValue, trace, ep }
              const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
              sload.addChild(analyzer.dnode)
            }
          }
        })
      })
    })
  }

  conditionAnalysis(visited) {
    const conds = this.findConds()
    conds.forEach(({ pc, cond }) => {
      if (!visited.includes(pc)) {
        const data = { pc, symbol: cond, trace: this.trace, ep: this.ep }
        const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
        this.dnode.addChild(analyzer.dnode)
      }
    })
  }

  /// Find jumpi nodes where our `pc` depends on
  /// and collect conditions at that jumpi
  findConds() {
    const executionPaths = this.endPoints.map(({ ep, trace }) => ep.ep)
    const pcIncludingExecutionPaths = executionPaths.filter(p => p.find(pp => pp.pc == this.pc))
    const pcExcludingExecutionPaths = executionPaths.filter(p => !p.find(pp => pp.pc == this.pc))
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
    this.ep.ep.forEach(({ pc, opcode: { name }, stack }) => {
      if (dJumpis.includes(pc)) {
        const cond = stack.get(stack.size() - 2)
        conds.push({ pc, cond })
      }
    })
    return uniqBy(conds, ({ cond }) => formatSymbol(cond))
  }

  prettify() {
    this.trace.prettify()
    this.dnode.prettify()
  }
}

module.exports = RegisterAnalayzer
