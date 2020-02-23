const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, formatSymbol, findSymbol, isConst, toVisitedKey } = require('../shared')
const { toStateVariables, toLocalVariables } = require('../variable')

class RegisterAnalyzer {
  constructor(symbol, ep, endPoints) {
    assign(this, { dnode: new DNode(symbol), ep, endPoints })
    this.internalAnalysis(symbol, ep)
  }

  internalAnalysis(symbol) {
    switch (symbol[1]) {
      case 'MLOAD': {
        const subTrace = this.ep.trace.sub(symbol[4][1].toNumber())
        const loadVariables = toLocalVariables(symbol[2], subTrace)
        assert(loadVariables.length > 0)
        break
      }
      case 'SLOAD': {
        const subTrace = this.ep.trace.sub(symbol[3][1].toNumber())
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
    this.ep.trace.prettify()
    this.dnode.prettify()
  }
}

module.exports = RegisterAnalyzer
