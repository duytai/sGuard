const assert = require('assert')
const DNode = require('./dnode')
const Condition = require('./condition') 
const StackVar = require('./stackvar')
const { prettify, findSymbol, formatSymbol } = require('../shared')
const { StateVariable, LocalVariable } = require('../variable')

class Register {
  constructor(symbol, trackingPos, ep, endPoints, visited = []) {
    visited.push(this.toVisitedKey(trackingPos, ep.last().pc, symbol))
    this.trackingPos = trackingPos
    this.dnode = new DNode(symbol)
    this.ep = ep
    this.endPoints = endPoints
    this.internalAnalysis(symbol, this.dnode, visited)
    this.conditionAnalysis(symbol, this.dnode, visited)
    this.crossfunctionAnalysis(symbol, this.dnode, visited)
  }

  toVisitedKey(trackingPos, pc, cond) {
    assert(pc && cond)
    return `${trackingPos}:${pc}:${formatSymbol(cond)}`
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
        subEp.eachLocalVariable(({ variable: otherVariable, subEp, storedValue, vTrackingPos }) => {
          if (localVariable.eq(otherVariable)) {
            if (!visited.includes(this.toVisitedKey(vTrackingPos, subEp.last().pc, storedValue))) {
              const subRegister = new Register(storedValue, vTrackingPos, subEp, this.endPoints, visited)
              dnode.addChild(subRegister.dnode)
            }
            otherVariable.members.forEach(member => {
              if (!visited.includes(this.toVisitedKey(0, subEp.last().pc, member))) {
                const subRegister = new Register(member, 0, subEp, this.endPoints, visited)
                dnode.addChild(subRegister.dnode)
              }
            })
          }
        })
        localVariable.members.forEach(member => {
          if (!visited.includes(this.toVisitedKey(this.trackingPos, subEp.last().pc, member))) {
            const subRegister = new Register(member, this.trackingPos, subEp, this.endPoints, visited)
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
            if (!visited.includes(this.toVisitedKey(0, subEp.last().pc, storedValue))) {
              const subRegister = new Register(storedValue, 0, subEp, this.endPoints, visited)
              dnode.addChild(subRegister.dnode)
            }
            otherVariable.members.forEach(member => {
              if (!visited.includes(this.toVisitedKey(0, subEp.last().pc, member))) {
                const subRegister = new Register(member, 0, subEp, this.endPoints, visited)
                dnode.addChild(subRegister.dnode)
              }
            })
          }
        })
        stateVariable.members.forEach(member => {
          if (!visited.includes(this.toVisitedKey(0, subEp.last().pc, member))) {
            const subRegister = new Register(member, 0, subEp, this.endPoints, visited)
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
    const pcs = [this.ep.last().pc]
    const condition = new Condition(this.ep, this.endPoints)
    if (this.trackingPos != 0) {
      const stackVar = new StackVar(this.ep)
      const ancestors = stackVar.myAncestors(this.trackingPos)
      ancestors.forEach(ancestor => pcs.push(ancestor))
    }
    const conds = condition.batchFindConds(pcs) 
    conds.forEach(({ pc, cond, epIdx, trackingPos }) => {
      const subEp = this.ep.sub(epIdx + 1)
      assert(subEp.last().pc == pc)
      if (!visited.includes(this.toVisitedKey(0, subEp.last().pc, cond))) {
        const subRegister = new Register(cond, 0, subEp, this.endPoints, visited)
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
            if (!visited.includes(this.toVisitedKey(0, subEp.last().pc, storedValue))) {
              const subRegister = new Register(storedValue, 0, subEp, this.endPoints, visited)
              dnode.addChild(subRegister.dnode)
            }
            otherVariable.members.forEach(member => {
              if (!visited.includes(this.toVisitedKey(0, subEp.last().pc, member))) {
                const subRegister = new Register(member, 0, subEp, this.endPoints, visited)
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
