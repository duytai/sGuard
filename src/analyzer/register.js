const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, formatSymbol, findSymbol, isConst, toVisitedKey } = require('../shared')
const { StateVariable, LocalVariable } = require('../variable')

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
        const localVariable = new LocalVariable(symbol[2], ep)
        break
      }
      case 'SLOAD': {
        const epSize = symbol[5][1].toNumber()
        const ep = this.ep.sub(epSize)
        const stateVariable = new StateVariable(symbol[2], ep)
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
