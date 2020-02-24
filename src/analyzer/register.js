const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, formatSymbol, findSymbol, isConst, toVisitedKey } = require('../shared')
const { toStateVariables, toLocalVariables } = require('../variable')

class Register {
  constructor(symbol, ep, endPoints) {
    assign(this, { dnode: new DNode(symbol), ep, endPoints })
    this.internalAnalysis(symbol)
  }

  internalAnalysis(symbol) {
    switch (symbol[1]) {
      case 'MLOAD': {
        const epSize = symbol[5][1].toNumber()
        const ep = this.ep.sub(epSize)
        const loadVariables = toLocalVariables(symbol[2], ep)
        assert(loadVariables.length > 0)
        break
      }
      case 'SLOAD': {
        const epSize = symbol[5][1].toNumber()
        const ep = this.ep.sub(epSize)
        const loadVariables = toStateVariables(symbol[2], ep)
        assert(loadVariable.length > 0)
        break
      }
      default: {
        const symbols = findSymbol(symbol, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
      }
    }
  }

  prettify() {
    this.dnode.prettify()
  }
}

module.exports = Register 
