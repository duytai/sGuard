const assert = require('assert')
const DNode = require('./dnode')
const Condition = require('./condition') 
const StackVar = require('./stackvar')
const { prettify, findSymbol, formatSymbol } = require('../shared')
const { StateVariable, LocalVariable } = require('../variable')

class Register {
  constructor(symbol, ep, endPoints, visited = []) {
    visited.push(this.toVisitedKey(ep.last().pc, symbol))
    this.dnode = new DNode(symbol)
    this.ep = ep
    this.endPoints = endPoints
    this.internalAnalysis(symbol, this.dnode, visited)
    this.conditionAnalysis(symbol, this.dnode, visited)
    this.crossfunctionAnalysis(symbol, this.dnode, visited)
  }

  toVisitedKey(pc, cond) {
    assert(pc && cond)
    return `${pc}:${formatSymbol(cond)}`
  }

  internalAnalysis(symbol, dnode, visited) {
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
            if (!visited.includes(this.toVisitedKey(subEp.last().pc, storedValue))) {
              const subRegister = new Register(storedValue, subEp, this.endPoints, visited)
              dnode.addChild(subRegister.dnode)
            }
            otherVariable.members.forEach(member => {
              if (!visited.includes(this.toVisitedKey(subEp.last().pc, member))) {
                const subRegister = new Register(member, subEp, this.endPoints, visited)
                dnode.addChild(subRegister.dnode)
              }
            })
          }
        })
        localVariable.members.forEach(member => {
          if (!visited.includes(this.toVisitedKey(subEp.last().pc, member))) {
            const subRegister = new Register(member, subEp, this.endPoints, visited)
            dnode.addChild(subRegister.dnode)
          }
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
            if (!visited.includes(this.toVisitedKey(subEp.last().pc, storedValue))) {
              const subRegister = new Register(storedValue, subEp, this.endPoints, visited)
              dnode.addChild(subRegister.dnode)
            }
            otherVariable.members.forEach(member => {
              if (!visited.includes(this.toVisitedKey(subEp.last().pc, member))) {
                const subRegister = new Register(member, subEp, this.endPoints, visited)
                dnode.addChild(subRegister.dnode)
              }
            })
          }
        })
        stateVariable.members.forEach(member => {
          if (!visited.includes(this.toVisitedKey(subEp.last().pc, member))) {
            const subRegister = new Register(member, subEp, this.endPoints, visited)
            dnode.addChild(subRegister.dnode)
          }
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

  conditionAnalysis(_, dnode, visited) {
    const { pc } = this.ep.last()
    const condition = new Condition(this.ep, this.endPoints)
    const conds = condition.findConds(pc) 
    conds.forEach(({ pc, cond, epIdx, trackingPos }) => {
      const subEp = this.ep.sub(epIdx + 1)
      assert(subEp.last().pc == pc)
      if (!visited.includes(this.toVisitedKey(subEp.last().pc, cond))) {
        const subRegister = new Register(cond, subEp, this.endPoints, visited)
        dnode.addChild(subRegister.dnode)
      }
    })
  }

  crossfunctionAnalysis(_, dnode, visited) {
    const sloads = dnode.findSloads()
    sloads.forEach(sload => {
      const { variable: stateVariable } = sload.node
      this.endPoints.forEach(ep => {
        ep.eachStateVariable(({ variable: otherVariable, subEp, storedValue }) => {
          if (stateVariable.eq(otherVariable)) {
            if (!visited.includes(this.toVisitedKey(subEp.last().pc, storedValue))) {
              const subRegister = new Register(storedValue, subEp, this.endPoints, visited)
              dnode.addChild(subRegister.dnode)
            }
            otherVariable.members.forEach(member => {
              if (!visited.includes(this.toVisitedKey(subEp.last().pc, member))) {
                const subRegister = new Register(member, subEp, this.endPoints, visited)
                dnode.addChild(subRegister.dnode)
              }
            })
          }
        })
      })
    })
  }

  prettify() {
    this.dnode.prettify()
  }
}

module.exports = Register 
