const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, formatSymbol, findSymbol, isConst, toVisitedKey } = require('../shared')
const { toStateVariable, toLocalVariable } = require('../variable')

class RegisterAnalyzer {
  constructor({ symbol, trace, pc, ep, trackingPos }, endPoints, visited = []) {
    visited.push(toVisitedKey(pc, trackingPos, symbol))
    assign(
      this,
      { trace, pc, endPoints, ep, trackingPos, dnode: new DNode(symbol) },
    )
    this.internalAnalysis(this, visited)
    this.conditionAnalysis(this, visited)
  }

  internalAnalysis({ pc, trackingPos, ep, trace, endPoints, dnode }, visited) {
    const me = dnode.getSymbol()
    switch (me[1]) {
      case 'MLOAD': {
        const subTrace = this.trace.sub(me[4][1].toNumber())
        const loadVariable = toLocalVariable(me[2], subTrace)
        assert(loadVariable)
        dnode.setVariable(loadVariable)
        dnode.setAlias(loadVariable.toString())
        subTrace.eachLocalVariable((opts) => {
          const {
            variable: storeVariable,
            value: storedValue,
            traceIdx,
            pc,
            epIdx,
            kTrackingPos,
            vTrackingPos
          } = opts
          if (storeVariable.exactEqual(loadVariable)) {
            const subEp = ep.sub(epIdx + 1)
            if (!visited.includes(toVisitedKey(pc, vTrackingPos, storedValue))) {
              const data = { pc, symbol: storedValue, trace: subTrace, ep: subEp, trackingPos: vTrackingPos }
              const analyzer = new RegisterAnalyzer(data, endPoints, visited)
              dnode.addChild(analyzer.dnode)
            }
            if (!visited.includes(toVisitedKey(pc, kTrackingPos, storedValue))) {
              const data = { pc, symbol: storedValue, trace: subTrace, ep: subEp, trackingPos: kTrackingPos }
              const analyzer = new RegisterAnalyzer(data, endPoints, visited)
              dnode.addChild(analyzer.dnode)
            }
          }
        })
        break
      }
      case 'SLOAD': {
        //TODO
        break
      }
      default: {
        //TODO
      }
    }
  }

  conditionAnalysis({ pc, trackingPos, ep, trace, endPoints, dnode }, visited) {
    const stackAnalyzer = new StackAnalyzer()
    const condAnalyzer = new ConditionAnalyzer(endPoints, ep)
    const trackingPcs = stackAnalyzer.findTrackingPcs(trackingPos, ep)
    const conds = condAnalyzer.batchFindConds([pc, ...trackingPcs])
    conds.forEach(({ pc, cond, epIdx, trackingPos }) => {
      if (!visited.includes(toVisitedKey(pc, trackingPos, cond))) {
        const subEp = ep.sub(epIdx + 1)
        const data = { pc, symbol: cond, trace, ep: subEp, trackingPos }
        const analyzer = new RegisterAnalyzer(data, endPoints, visited)
        dnode.addChild(analyzer.dnode)
      }
    })
  }

  prettify() {
    this.trace.prettify()
    this.dnode.prettify()
  }
}

module.exports = RegisterAnalyzer
