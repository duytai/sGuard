const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, formatSymbol, findSymbol, isConst, toVisitedKey } = require('../shared')
const { toStateVariables, toLocalVariables } = require('../variable')

class RegisterAnalyzer {
  constructor({ symbol, trace, ep, trackingPos }, endPoints, visited = []) {
    const { pc } = ep.last()
    visited.push(toVisitedKey(pc, trackingPos, symbol))
    assign(
      this,
      { trace, endPoints, ep, trackingPos, dnode: new DNode(symbol), symbol },
    )
    this.internalAnalysis(this, visited)
  }

  internalAnalysis({ trackingPos, ep, trace, endPoints, dnode, symbol }, visited) {
    switch (symbol[1]) {
      case 'MLOAD': {
        const subTrace = this.trace.sub(symbol[4][1].toNumber())
        const loadVariables = toLocalVariables(symbol[2], subTrace)
        assert(loadVariables.length > 0)
        break
      }
      case 'SLOAD': {
        const subTrace = this.trace.sub(symbol[3][1].toNumber())
        const loadVariables = toStateVariables(symbol[2], subTrace, trackingPos, ep.size() - 1)
        assert(loadVariable.length > 0)
        break
      }
      default: {
        const symbols = findSymbol(symbol, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
      }
    }
  }

  prettify() {
    this.trace.prettify()
    this.dnode.prettify()
  }
}

module.exports = RegisterAnalyzer
