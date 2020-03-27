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

  processLinks(subEp, trackingPos) {
    const assignment = new LocalAssignment(subEp, trackingPos)
    const links = new Set()
    assignment.epIndexes.forEach(epIndex => {
      let dependOn = null 
      for (let i = epIndex; i >= 0; i--) {
        const { opcode: { name }, pc } = subEp.get(i)
        dependOn = dependOn ? dependOn : this.condition.fullControls[pc]
        if (dependOn && dependOn.includes(pc)) {
          links.add(i)
        }
      }
    })
    return [...links] 
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
      trace.ts.forEach(({ t, epIdx }) => {
        const [_, name, loc] = t
        switch (name) {
          case 'MSTORE': {
            const subEp = endPoint.sub(epIdx + 1)
            const variable = new LocalVariable(loc, subEp)
            mstore[epIdx] = [{ type: 'MSTORE', variable }]
            break
          }
          case 'SSTORE': {
            const subEp = endPoint.sub(epIdx + 1)
            const variable = new StateVariable(loc, subEp)
            sstore[epIdx] = [{ type: 'SSTORE', variable }]
            break
          }
        }
      })

      ep.forEach(({ t, opcode: { name }, pc, stack }, epIdx) => {
        switch (name) {
          case 'JUMPI': {
            const trackingPos = stack.size() - 2
            const condStack = [stack.get(trackingPos)]
            branch[epIdx] = []
            while (condStack.length) {
              const symbol = condStack.pop()
              switch (symbol[1]) {
                case 'MLOAD': {
                  const subEpSize = symbol[5][1].toNumber()
                  const subEp = endPoint.sub(subEpSize)
                  const variable = new LocalVariable(symbol[2], subEp)
                  branch[epIdx].push({
                    type: 'MLOAD',
                    variable,
                  })
                  break
                }
                case 'SLOAD': {
                  const subEpSize = symbol[4][1].toNumber()
                  const subEp = endPoint.sub(subEpSize)
                  const variable = new StateVariable(symbol[2], subEp)
                  branch[epIdx].push({
                    type: 'SLOAD',
                    variable,
                  })
                  break
                }
                default: {
                  const symbols = findSymbol(symbol, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
                  symbols.forEach(symbol => condStack.push(symbol))
                  break
                }
              }
            }
            const subEp = endPoint.sub(epIdx + 1)
            const links = this.processLinks(subEp, trackingPos)
            branch[epIdx].push({ type: 'LINK', links })
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
