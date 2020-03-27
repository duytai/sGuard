const assert = require('assert')
const hash = require('object-hash')
const { prettify, findSymbol, formatSymbol } = require('../shared')
const { LocalVariable, StateVariable } = require('../variable')
const LocalAssignment = require('./assignment')

class Cache {
  constructor(condition, endPoints) {
    this.condition = condition
    this.endPoints = endPoints
    this.preprocess()
  }

  locateControlLinks(epIndexes, subEp) {
    assert(epIndexes.length >= 0 && subEp)
    const links = new Set()
    epIndexes.forEach(epIndex => {
      let dependOn = null 
      for (let i = epIndex; i >= 0; i--) {
        const { opcode: { name }, pc } = subEp.get(i)
        dependOn = dependOn ? dependOn : this.condition.fullControls[pc]
        /// Convert from pc to epIdx
        if (dependOn && dependOn.includes(pc)) {
          links.add(i)
        }
      }
    })
    return [...links] 
  }

  processExpression(symbol, trackingPos, endPoint, epIdx) {
    const ret = []
    const workStack = [symbol]
    while (workStack.length) {
      const symbol = workStack.pop()
      switch (symbol[1]) {
        case 'MLOAD': {
          const subEpSize = symbol[5][1].toNumber()
          const subEp = endPoint.sub(subEpSize)
          const variable = new LocalVariable(symbol[2], subEp)
          ret.push({ type: 'MLOAD', variable })
          break
        }
        case 'SLOAD': {
          const subEpSize = symbol[4][1].toNumber()
          const subEp = endPoint.sub(subEpSize)
          const variable = new StateVariable(symbol[2], subEp)
          ret.push({ type: 'SLOAD', variable })
          break
        }
        default: {
          const symbols = findSymbol(symbol, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
          symbols.forEach(symbol => workStack.push(symbol))
          break
        }
      }
    }
    const subEp = endPoint.sub(epIdx + 1)
    const assignment = new LocalAssignment(subEp, trackingPos)
    const links = this.locateControlLinks(assignment.epIndexes, subEp)
    if (links.length) ret.push({ type: 'LINK', links })
    return ret
  }

  preprocess() {
    this.mem = {
      branches: [],
      mstores: [],
      sstores: [],
    }

    this.endPoints.forEach((endPoint) => {
      const branch = {}
      const mstore = {}
      const sstore = {}
      const { ep, trace } = endPoint
      trace.ts.forEach(({ t, epIdx, kTrackingPos, vTrackingPos }) => {
        const [_, name, loc, value] = t
        switch (name) {
          case 'MSTORE': {
            // const mkeys = this.processExpression(loc, kTrackingPos, endPoint, epIdx)
            // const mvalues = this.processExpression(value, vTrackingPos, endPoint, epIdx)
            // if (mkeys.length > 0) {
              // console.log(mkeys)
              // console.log(mvalues)
            // }
            break
          }
          case 'SSTORE': {
            break
          }
        }
      })

      ep.forEach(({ t, opcode: { name }, pc, stack }, epIdx) => {
        switch (name) {
          case 'JUMPI': {
            const trackingPos = stack.size() - 2
            const symbol = stack.get(trackingPos)
            branch[epIdx] = this.processExpression(symbol, trackingPos, endPoint, epIdx)
            break
          }
        }
      })

      this.mem.branches.push(branch)
      this.mem.mstores.push(mstore)
      this.mem.sstores.push(sstore)
    })
    console.log(this.mem)
  }
}

module.exports = Cache 
