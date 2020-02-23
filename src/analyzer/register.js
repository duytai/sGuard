const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, formatSymbol, findSymbol, isConst, toVisitedKey } = require('../shared')
const { toStateVariable, toLocalVariables } = require('../variable')

class RegisterAnalyzer {
  constructor({ symbol, trace, ep, trackingPos }, endPoints, visited = []) {
    const { pc } = ep.last()
    visited.push(toVisitedKey(pc, trackingPos, symbol))
    assign(
      this,
      { trace, endPoints, ep, trackingPos, dnode: new DNode(symbol), symbol },
    )
    this.internalAnalysis(this, visited)
    this.conditionAnalysis(this, visited)
    this.crossfunctionAnalysis(this, visited)
  }

  expand(loadVariable, { loadEp, storedEp, subTrace, endPoints, dnode }, opts, visited) {
    const {
      variable: storeVariable,
      value: storedValue,
      loc: storedLoc,
      traceIdx,
      pc,
      epIdx,
      kTrackingPos,
      vTrackingPos
    } = opts
    /// Expand member of loadVariable
    const loadMembers = loadVariable.getMembers()
    loadMembers.forEach(({ trackingPos, epIdx, symbol }) => {
      const subEp = loadEp.sub(epIdx + 1)
      const data = { symbol, trace: subTrace, ep: subEp, trackingPos }
      const analyzer = new RegisterAnalyzer(data, endPoints, visited)
      dnode.addChild(analyzer.dnode)
    })
    /// m[x] = y
    /// vTrackingPos is y, kTrackingPos is x
    if (storeVariable.exactEqual(loadVariable) || storeVariable.partialEqual(loadVariable)) {
      const sEp = storedEp.sub(epIdx + 1)
      const sTrace = subTrace.sub(traceIdx + 1)
      assert(pc == sEp.last().pc)
      if (!visited.includes(toVisitedKey(pc, vTrackingPos, storedValue))) {
        const data = { symbol: storedValue, trace: sTrace, ep: sEp, trackingPos: vTrackingPos }
        const analyzer = new RegisterAnalyzer(data, endPoints, visited)
        dnode.addChild(analyzer.dnode)
      }
      if (!visited.includes(toVisitedKey(pc, kTrackingPos, storedLoc))) {
        const data = { symbol: storedLoc, trace: sTrace, ep: sEp, trackingPos: kTrackingPos }
        const analyzer = new RegisterAnalyzer(data, endPoints, visited)
        dnode.addChild(analyzer.dnode)
      }
      /// Expand member of storeVariable 
      const storeMembers = storeVariable.getMembers()
      storeMembers.forEach(({ trackingPos, epIdx, symbol }) => {
        const subEp = storedEp.sub(epIdx + 1)
        const data = { symbol, trace: subTrace, ep: subEp, trackingPos }
        const analyzer = new RegisterAnalyzer(data, endPoints, visited)
        dnode.addChild(analyzer.dnode)
      })
    }
  }

  internalAnalysis({ trackingPos, ep, trace, endPoints, dnode, symbol }, visited) {
    switch (symbol[1]) {
      case 'MLOAD': {
        const subTrace = this.trace.sub(symbol[4][1].toNumber())
        const loadVariables = toLocalVariables(symbol[2], subTrace)
        assert(loadVariables.length > 0)
        loadVariables.forEach(loadVariable => {
          dnode.setVariable(loadVariable)
          dnode.setAlias(loadVariable.toString())
          subTrace.eachLocalVariable((opts) => {
            this.expand(loadVariable, { loadEp: ep, storedEp: ep, subTrace, endPoints, dnode }, opts, visited)
          })
        })
        break
      }
      case 'SLOAD': {
        const subTrace = this.trace.sub(symbol[3][1].toNumber())
        const loadVariable = toStateVariable(symbol[2], subTrace, trackingPos, ep.size() - 1)
        assert(loadVariable)
        dnode.setVariable(loadVariable)
        dnode.setAlias(loadVariable.toString())
        subTrace.eachStateVariable((opts) => {
          this.expand(loadVariable, { loadEp: ep, storedEp: ep, subTrace, endPoints, dnode }, opts, visited)
        })
        break
      }
      default: {
        const symbols = findSymbol(symbol, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
        symbols.forEach(symbol => {
          const traceSize = symbol[1] == 'SLOAD' ? symbol[3] : symbol[4]
          assert(isConst(traceSize))
          const subTrace = this.trace.sub(traceSize[1].toNumber())
          const subDNode = new DNode(symbol)
          this.internalAnalysis({ symbol, trackingPos, ep, trace: subTrace, endPoints, dnode: subDNode }, visited)
          dnode.addChild(subDNode)
        })
      }
    }
  }

  crossfunctionAnalysis({ trackingPos, ep: loadEp, trace, endPoints, dnode, symbol }, visited) {
    const sloads = dnode.findSloads()
    endPoints.forEach(({ trace, ep: storedEp }) => {
      sloads.forEach(sload => {
        const loadVariable = sload.getVariable()
        trace.eachStateVariable((opts) => {
          this.expand(loadVariable, { loadEp, storedEp, subTrace: trace, endPoints, dnode }, opts, visited)
        })
      })
    })
  }

  conditionAnalysis({ trackingPos, ep, trace, endPoints, dnode }, visited) {
    const { pc } = ep.last()
    const stackAnalyzer = new StackAnalyzer()
    const condAnalyzer = new ConditionAnalyzer(endPoints, ep)
    const trackingPcs = stackAnalyzer.findTrackingPcs(trackingPos, ep)
    const conds = condAnalyzer.batchFindConds([pc, ...trackingPcs])
    conds.forEach(({ pc, cond, epIdx, trackingPos }) => {
      if (!visited.includes(toVisitedKey(pc, trackingPos, cond))) {
        const subEp = ep.sub(epIdx + 1)
        assert(subEp.last().pc == pc)
        const data = { symbol: cond, trace, ep: subEp, trackingPos }
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
