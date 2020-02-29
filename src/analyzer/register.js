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
        dnode.node.variable = localVariable
        dnode.node.alias = localVariable.toAlias()
        subEp.eachLocalVariable(({ variable: otherVariable, subEp, storedValue }) => {
          if (localVariable.eq(otherVariable)) {
            const subRegister = new Register(storedValue, subEp, this.endPoints)
            dnode.addChild(subRegister.dnode)
          }
        })
        localVariable.members.forEach(member => {
          const subRegister = new Register(member, subEp, this.endPoints)
          dnode.addChild(subRegister.dnode)
        })
        break
      }
      case 'SLOAD': {
        const subEpSize = symbol[4][1].toNumber()
        const subEp = this.ep.sub(subEpSize)
        const stateVariable = new StateVariable(symbol[2], subEp)
        dnode.node.variable = stateVariable
        dnode.node.alias = stateVariable.toAlias()
        subEp.eachStateVariable(({ variable: otherVariable, subEp, storedValue }) => {
          if (stateVariable.eq(otherVariable)) {
            const subRegister = new Register(storedValue, subEp, this.endPoints)
            dnode.addChild(subRegister.dnode)
          }
        })
        stateVariable.members.forEach(member => {
          const subRegister = new Register(member, subEp, this.endPoints)
          dnode.addChild(subRegister.dnode)
        })
        break
      }
      default: {
        const symbols = findSymbol(symbol, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
        symbols.forEach(symbol => {
          const subNode = new DNode(symbol)
          this.internalAnalysis(symbol, subNode)
          dnode.addChild(subNode)
        })
      }
    }
  }

  prettify() {
    this.dnode.prettify()
  }
}

module.exports = Register 
