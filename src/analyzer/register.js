const assert = require('assert')
const DNode = require('./dnode')
const ConditionAnalyzer = require('./condition') 
const StackAnalyzer = require('./stack')
const { prettify, findSymbol } = require('../shared')
const { StateVariable, LocalVariable } = require('../variable')

class Register {
  constructor(symbol, ep, endPoints) {
    this.dnode = new DNode(symbol)
    this.ep = ep
    this.endPoints = endPoints
    this.internalAnalysis(symbol, this.dnode)
  }

  internalAnalysis(symbol, dnode) {
    assert(symbol && dnode)
    switch (symbol[1]) {
      case 'MLOAD': {
        const epSize = symbol[5][1].toNumber()
        const ep = this.ep.sub(epSize)
        const localVariable = new LocalVariable(symbol[2], ep)
        dnode.addChild(new DNode(symbol))
        break
      }
      case 'SLOAD': {
        const epSize = symbol[4][1].toNumber()
        const ep = this.ep.sub(epSize)
        const stateVariable = new StateVariable(symbol[2], ep)
        dnode.addChild(new DNode(symbol))
        break
      }
      default: {
        const symbols = findSymbol(symbol, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
        symbols.forEach(symbol => this.internalAnalysis(symbol, dnode))
      }
    }
  }

  prettify() {
    this.dnode.prettify()
  }
}

module.exports = Register 
