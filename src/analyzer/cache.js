const assert = require('assert')
const hash = require('object-hash')
const { prettify, findSymbol, formatSymbol } = require('../shared')
const { LocalVariable, StateVariable } = require('../variable')
const LocalAssignment = require('./assignment')

class Cache {
  constructor(condition, endPoints) {
    this.condition = condition
    this.endPoints = endPoints
    this.build()
  }

  controlLinks(epIndexes, subEp) {
    assert(epIndexes.length >= 0 && subEp)
    const links = new Set()
    epIndexes.forEach(epIndex => {
      let dependOn = null 
      for (let i = epIndex; i >= 0; i--) {
        const { opcode: { name }, pc } = subEp.get(i)
        dependOn = dependOn ? dependOn : this.condition.fullControls[pc]
        if (dependOn && dependOn.includes(pc)) links.add(i)
      }
    })
    return [...links] 
  }

  analyzeExp(symbol, trackingPos, endPoint, epIdx) {
    const variables = []
    const workStack = [symbol]
    while (workStack.length) {
      const symbol = workStack.pop()
      switch (symbol[1]) {
        case 'MLOAD': {
          const subEpSize = symbol[5][1].toNumber()
          const subEp = endPoint.sub(subEpSize)
          const variable = new LocalVariable(symbol[2], subEp)
          variables.push({ type: 'MLOAD', variable })
          break
        }
        case 'SLOAD': {
          const subEpSize = symbol[4][1].toNumber()
          const subEp = endPoint.sub(subEpSize)
          const variable = new StateVariable(symbol[2], subEp)
          variables.push({ type: 'SLOAD', variable })
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
    const epIndexes = [...assignment.epIndexes, epIdx]
    const links = this.controlLinks(epIndexes, subEp)
    return { variables, links }
  }

  build() {
    this.mem = { branches: [], mstores: [], sstores: [], calls: [] }
    this.endPoints.forEach((endPoint) => {
      const branch = {}
      const mstore = {}
      const sstore = {}
      const call = {}
      const { ep, trace } = endPoint
      trace.ts.forEach(({ t, epIdx, kTrackingPos, vTrackingPos }) => {
        const entries = {
          'MSTORE': [LocalVariable, mstore],
          'SSTORE': [StateVariable, sstore],
        }
        const [_, name, loc, value] = t
        if (entries[name]) {
          const [ Variable, store ] = entries[name]
          const { variables: kVariables, links: kLinks } = this.analyzeExp(loc, kTrackingPos, endPoint, epIdx)
          const { variables: vVariables, links: vLinks } = this.analyzeExp(value, vTrackingPos, endPoint, epIdx)
          const variables = [...kVariables, vVariables]
          const links = [...new Set([...kLinks, ...vLinks])]
          const subEp = endPoint.sub(epIdx + 1)
          const variable = new Variable(loc, subEp)
          store[epIdx] = {
            variable,
            values: [...variables, ...links],
          }
        }
      })

      ep.forEach(({ t, opcode: { name }, pc, stack }, epIdx) => {
        switch (name) {
          case 'JUMPI': {
            const trackingPos = stack.size() - 2
            const symbol = stack.get(trackingPos)
            const { variables, links } = this.analyzeExp(symbol, trackingPos, endPoint, epIdx)
            branch[epIdx] = [...variables, ...links]
            break
          }
          case 'CALL': {
            const entries = [
              { trackingPos: stack.size() - 1, symbol: stack.get(stack.size() - 1) },
              { trackingPos: stack.size() - 2, symbol: stack.get(stack.size() - 2) },
              { trackingPos: stack.size() - 3, symbol: stack.get(stack.size() - 3) }
            ]
            let variables = [] 
            let links = []
            entries.forEach(({ trackingPos, symbol }) => {
              const { variables: eVariables, links: eLinks } = this.analyzeExp(symbol, trackingPos, endPoint, epIdx)
              variables = [...variables, ...eVariables]
              links = [...links, ...eLinks]
            })
            call[epIdx] = [...variables, ...links]
            break
          }
        }
      })

      this.mem.branches.push(branch)
      this.mem.mstores.push(mstore)
      this.mem.sstores.push(sstore)
      this.mem.calls.push(call)
    })
    console.log(this.mem)
  }
}

module.exports = Cache 
