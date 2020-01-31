const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, formatSymbol, findSymbol } = require('../shared')
const { toStateVariable, toLocalVariable } = require('../variable')

class RegisterAnalayzer {
  constructor({ symbol, trace, pc, ep, trackingPos }, endPoints, visited = []) {
    assign(this, { symbol, trace, pc, endPoints, ep, trackingPos })
    visited.push(this.toVisitedKey(pc, trackingPos, symbol))
    this.condAnalyzer = new ConditionAnalyzer(endPoints, ep)
    this.stackAnalyzer = new StackAnalyzer()
    this.dnode = new DNode(symbol)
    this.innerAnalysis(visited)
    this.conditionAnalysis(visited)
    this.crossfunctionAnalysis(visited)
  }

  toVisitedKey(pc, trackingPos, symbol) {
    return `${pc}:${trackingPos}:${formatSymbol(symbol)}`
  }

  expandLocalVariable(loadVariable, subTrace) {
    const node = this.dnode.node;
    node.alias = loadVariable.toString() 
    node.variable = loadVariable
    subTrace.eachLocalVariable(({ variable: storeVariable, value: storedValue, traceIdx, pc, epIdx, kTrackingPos, vTrackingPos }) => {
      /// If it is exactEqual, return true to break forEach loop 
      if (storeVariable.exactEqual(loadVariable)) {
        const dnode = new DNode(storedValue, subTrace)
        node.childs.push(dnode)
        return true
      }
      if (storeVariable.partialEqual(loadVariable)) {
        const members = [
          ...loadVariable.getSymbolMembers(),
          ...storeVariable.getSymbolMembers(),
          storedValue,
        ]
        members.forEach(m => {
          const dnode = new DNode(m, subTrace)
          node.childs.push(dnode)
        })
      }
    })
  }

  expandStateVariable(loadVariable, subTrace) {
    const node = this.dnode.node
    node.alias = loadVariable.toString() 
    node.variable = loadVariable
    subTrace.eachStateVariable(({ variable: storeVariable, value: storedValue}) => {
      /// If it is exactEqual, return true to break forEach loop 
      if (storeVariable.exactEqual(loadVariable)) {
        const dnode = new DNode(storedValue, subTrace)
        node.childs.push(dnode)
        return true
      }
      if (storeVariable.partialEqual(loadVariable)) {
        const members = [
          ...loadVariable.getSymbolMembers(),
          ...storeVariable.getSymbolMembers(),
          storedValue,
        ]
        members.forEach(m => {
          const dnode = new DNode(m, subTrace)
          node.childs.push(dnode)
        })
      }
    })
  }

  innerAnalysis(visited) {
    const { me, childs } = this.dnode.node
    assert(!childs.length)
    switch (me[1]) {
      case 'MLOAD': {
        const subTrace = this.trace.sub(me[4][1].toNumber())
        const loadVariable = toLocalVariable(me[2], subTrace)
        assert(loadVariable)
        this.expandLocalVariable(loadVariable, subTrace)
        break
      }
      case 'SLOAD': {
        const subTrace = this.trace.sub(me[3][1].toNumber())
        const loadVariable = toStateVariable(me[2], subTrace) 
        this.expandStateVariable(loadVariable, subTrace)
        break
      }
      default: {
        const symbols = findSymbol(me, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
        symbols.forEach(symbol => {
          const traceSize = symbol[1] == 'SLOAD' ? symbol[3] : symbol[4]
          assert(isConst(traceSize))
          const dnode = new DNode(symbol, this.trace.sub(traceSize[1].toNumber()));
          childs.push(dnode)
        })
      }
    }
  }


  crossfunctionAnalysis(visited) {
    const sloads = this.dnode.findSloads()
    this.endPoints.forEach(({ trace, ep }) => {
      sloads.forEach(sload => {
        const loadVariable = sload.getVariable()
        trace.eachStateVariable(({ variable: storeVariable, value: storedValue, traceIdx, pc, epIdx, kTrackingPos, vTrackingPos }) => {
          /// If it is exactEqual, return true to break forEach loop 
          if (storeVariable.exactEqual(loadVariable)) {
            if (!visited.includes(this.toVisitedKey(pc, vTrackingPos, storedValue))) {
              /// since sstore here, we need to analyze sstore dependency
              const subEp = ep.sub(epIdx + 1)
              const data = { pc, symbol: storedValue, trace, ep: subEp, trackingPos: vTrackingPos }
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
              if (!visited.includes(this.toVisitedKey(pc, kTrackingPos, m))) {
                const subEp = ep.sub(epIdx + 1)
                const data = { pc, symbol: m, trace: subTrace, ep: subEp, trackingPos: kTrackingPos }
                const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
                sload.addChild(analyzer.dnode)
              }
            })
            if (!visited.includes(this.toVisitedKey(pc, vTrackingPos, storedValue))) {
              /// since sstore here, we need to analyze sstore dependency
              const subEp = ep.sub(epIdx + 1)
              const data = { pc, symbol: storedValue, trace, ep: subEp, trackingPos: vTrackingPos }
              const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
              sload.addChild(analyzer.dnode)
            }
          }
        })
      })
    })
  }

  conditionAnalysis(visited) {
    const trackingPcs = this.stackAnalyzer.findTrackingPcs(this.trackingPos, this.ep)
    const conds = this.condAnalyzer.batchFindConds([this.pc, ...trackingPcs])
    conds.forEach(({ pc, cond, epIdx, trackingPos }) => {
      if (!visited.includes(this.toVisitedKey(pc, trackingPos, cond))) {
        const subEp = this.ep.sub(epIdx + 1)
        const data = { pc, symbol: cond, trace: this.trace, ep: subEp, trackingPos }
        const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
        this.dnode.addChild(analyzer.dnode)
      }
    })
  }

  prettify() {
    this.trace.prettify()
    this.dnode.prettify()
  }
}

module.exports = RegisterAnalayzer
