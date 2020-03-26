const assert = require('assert')
const hash = require('object-hash')
const { prettify, findSymbol } = require('../shared')
const { LocalVariable, StateVariable } = require('../variable')
const LocalAssignment = require('./assignment')

class Cache {
  constructor(condition, endPoints) {
    this.condition = condition
    this.endPoints = endPoints
    this.processBranches()
  }

  toKey(endPointIdx, epIdx) {
    assert(endPointIdx >= 0 && epIdx >= 0)
    return hash([endPointIdx, epIdx].join(':')).slice(0, 4)
  }

  processBranches() {
    this.memCache = {}
    this.endPoints.forEach((endPoint, endPointIdx) => {
      endPoint.ep.forEach(({ opcode: { name }, stack }, epIdx) => {
        if (name == 'JUMPI') {
          const key = this.toKey(endPointIdx, epIdx)
          const trackingPos = stack.size() - 2
          const condStack = [stack.get(trackingPos)]
          this.memCache[key] = []
          while (condStack.length) {
            const symbol = condStack.pop()
            switch (symbol[1]) {
              case 'MLOAD': {
                const subEpSize = symbol[5][1].toNumber()
                const subEp = endPoint.sub(subEpSize)
                const localVariable = new LocalVariable(symbol[2], subEp)
                this.memCache[key].push({
                  type: 'LOCAL',
                  variable: localVariable,
                  subEp,
                })
                break
              }
              case 'SLOAD': {
                const subEpSize = symbol[4][1].toNumber()
                const subEp = endPoint.sub(subEpSize)
                const stateVariable = new StateVariable(symbol[2], subEp)
                this.memCache[key].push({
                  type: 'STATE',
                  variable: stateVariable,
                  subEp,
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
          const assignment = new LocalAssignment(subEp, trackingPos)
          const links = new Set()
          assignment.epIndexes.forEach(epIndex => {
            let dependOn = null 
            for (let i = epIndex; i >= 0; i--) {
              const { opcode: { name }, pc } = subEp.get(i)
              dependOn = dependOn ? dependOn : this.condition.fullControls[pc]
              if (dependOn && dependOn.includes(pc)) {
                const link = this.toKey(endPointIdx, i)
                links.add(link)
              }
            }
          })
          this.memCache[key].push({
            type: 'LINK',
            links: [...links],
          })
        }
      })
    })
  }
}

module.exports = Cache 
