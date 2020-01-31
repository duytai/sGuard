const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, formatSymbol } = require('../shared')

class RegisterAnalayzer {
  constructor({ symbol, trace, pc, ep, trackingPos }, endPoints, visited = []) {
    assign(this, { symbol, trace, pc, endPoints, ep, trackingPos })
    visited.push(pc)
    this.condAnalyzer = new ConditionAnalyzer(endPoints, ep)
    this.stackAnalyzer = new StackAnalyzer()
    this.dnode = new DNode(symbol, trace)
    this.conditionAnalysis(visited)
    this.crossfunctionAnalysis(visited)
  }

  crossfunctionAnalysis(visited) {
    const sloads = this.dnode.findSloads()
    this.endPoints.forEach(({ trace, ep }) => {
      sloads.forEach(sload => {
        const loadVariable = sload.getVariable()
        trace.eachStateVariable(({ variable: storeVariable, value: storedValue, traceIdx, pc, epIdx, kTrackingPos, vTrackingPos }) => {
          /// If it is exactEqual, return true to break forEach loop 
          if (storeVariable.exactEqual(loadVariable)) {
            if (!visited.includes(pc)) {
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
              const subEp = ep.sub(epIdx + 1)
              const data = { pc, symbol: m, trace: subTrace, ep: subEp, trackingPos: kTrackingPos }
              const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
              sload.addChild(analyzer.dnode)
            })
            if (!visited.includes(pc)) {
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
    let conds = this.condAnalyzer.findConds(this.pc)
    const trackingPcs = this.stackAnalyzer.findTrackingPcs(this.trackingPos, this.ep)
    trackingPcs.forEach(trackingPc => {
      const extConds = this.condAnalyzer.findConds(trackingPc, this.ep)
      conds = [...conds, ...extConds]
    })
    conds = uniqBy(conds, ({ cond, pc }) => `${pc}:${formatSymbol(cond)}`)
    conds.forEach(({ pc, cond, epIdx, trackingPos }) => {
      if (!visited.includes(pc)) {
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
