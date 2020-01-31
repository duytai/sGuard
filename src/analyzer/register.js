const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, formatSymbol } = require('../shared')

class RegisterAnalayzer {
  constructor({ symbol, trace, pc, ep, trackingPos }, endPoints, visited = []) {
    assign(this, { symbol, trace, pc, endPoints, ep, trackingPos })
    visited.push(this.toVisitedKey(pc, trackingPos, symbol))
    this.condAnalyzer = new ConditionAnalyzer(endPoints, ep)
    this.stackAnalyzer = new StackAnalyzer()
    this.dnode = new DNode(symbol, trace)
    this.conditionAnalysis(visited)
    this.crossfunctionAnalysis(visited)
  }

  toVisitedKey(pc, trackingPos, symbol) {
    return `${pc}:${trackingPos}:${formatSymbol(symbol)}`
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
