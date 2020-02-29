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
        const subEpSize = symbol[5][1].toNumber()
        const subEp = this.ep.sub(subEpSize)
        const localVariable = new LocalVariable(symbol[2], subEp)
        // const subRegister = new Register(symbol, subEp, this.endPoints)
        // dnode.addChild(subRegister.dnode)
        break
      }
      case 'SLOAD': {
        const subEpSize = symbol[4][1].toNumber()
        const subEp = this.ep.sub(subEpSize)
        const stateVariable = new StateVariable(symbol[2], subEp)
        subEp.eachStateVariable(({ variable: otherVariable, subEp, storedValue }) => {
          if (stateVariable.eq(otherVariable)) {
            prettify([storedValue])
            console.log('--')
          }
        })
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
