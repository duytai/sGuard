const assert = require('assert')
const hash = require('object-hash')
const { prettify, findSymbol, formatSymbol } = require('../shared')
const { LocalVariable, StateVariable, BlindVariable } = require('../variable')
const LocalAssignment = require('./assignment')

class Cache {
  constructor(condition, endPoints, srcmap) {
    this.condition = condition
    this.endPoints = endPoints
    this.srcmap = srcmap
    this.stats = {
      failed: {
        sloads: 0,
        mloads: 0,
        mstores: 0,
        sstores: 0,
      },
      success: {
        sloads: 0,
        mloads: 0,
        mstores: 0,
        sstores: 0,
      },
    }
    this.build()
  }

  controlLinks(epIndexes, subEp) {
    assert(epIndexes.length >= 0 && subEp)
    const links = new Set()
    epIndexes.forEach(epIndex => {
      const marker = { found: false, fullControl: [] }
      for (let i = epIndex; i >= 0; i--) {
        const { opcode: { name }, pc } = subEp.get(i)
        if (!marker.found) {
          marker.fullControl = this.condition.fullControls[pc] || []
          marker.found = marker.fullControl.length > 0
        }
        if (marker.fullControl.includes(pc)) {
          if (name == 'JUMPI') {
            links.add(i)
          } else {
            marker.fullControl = marker.fullControl.filter(x => pc!= x)
            assert(this.condition.fullControls[pc])
            marker.fullControl = [
              ...new Set([
                ...marker.fullControl,
                ...this.condition.fullControls[pc]
              ])
            ]
          }
        }
      }
    })
    return [...links] 
  }

  analyzeExp(symbol, trackingPos, endPoint, epIdx) {
    const workStack = [symbol]
    let mloads = []
    let sloads = []
    let links = []
    while (workStack.length) {
      const symbol = workStack.pop()
      switch (symbol[1]) {
        case 'MLOAD': {
          const subEpSize = symbol[5][1].toNumber()
          const subEp = endPoint.sub(subEpSize)
          try {
            const variable = new LocalVariable(symbol[2], subEp)
            mloads.push(variable)
            /// MLOAD Loc 
            const trackingPos = subEp.stack.size() - 1
            const epIdx = subEpSize - 1
            const t = this.analyzeExp(symbol[2], trackingPos, endPoint, epIdx)
            mloads = [...mloads, ...t.mloads]
            sloads = [...sloads, ...t.sloads]
            links = [...links, ...t.links]
            this.stats.success.mloads ++;
          } catch (e) {
            // console.log(e)
            const variable = new BlindVariable()
            mloads.push(variable)
            /// MLOAD Loc 
            const trackingPos = subEp.stack.size() - 1
            const epIdx = subEpSize - 1
            const t = this.analyzeExp(symbol[2], trackingPos, endPoint, epIdx)
            mloads = [...mloads, ...t.mloads]
            sloads = [...sloads, ...t.sloads]
            links = [...links, ...t.links]
            this.stats.failed.mloads ++
          }
          break
        }
        case 'SLOAD': {
          try {
            const subEpSize = symbol[4][1].toNumber()
            const subEp = endPoint.sub(subEpSize)
            const variable = new StateVariable(symbol[2], subEp)
            sloads.push(variable)
            /// SLOAD Loc
            const trackingPos = subEp.stack.size() - 1
            const epIdx = subEpSize - 1
            const t = this.analyzeExp(symbol[2], trackingPos, endPoint, epIdx)
            mloads = [...mloads, ...t.mloads]
            sloads = [...sloads, ...t.sloads]
            links = [...links, ...t.links]
            this.stats.success.sloads ++;
          } catch (e) {
            // console.log(e)
            const subEpSize = symbol[4][1].toNumber()
            const subEp = endPoint.sub(subEpSize)
            const variable = new BlindVariable()
            sloads.push(variable)
            /// SLOAD Loc
            const trackingPos = subEp.stack.size() - 1
            const epIdx = subEpSize - 1
            const t = this.analyzeExp(symbol[2], trackingPos, endPoint, epIdx)
            mloads = [...mloads, ...t.mloads]
            sloads = [...sloads, ...t.sloads]
            links = [...links, ...t.links]
            this.stats.failed.sloads ++;
          }
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
    links = new Set([...links, ...this.controlLinks(epIndexes, subEp)])
    return { mloads, sloads , links: [...links] }
  }

  build() {
    this.mem = { branches: [], mstores: [], sstores: [], calls: [], ends: [] }
    this.endPoints.forEach((endPoint, idx) => {
      process.send({
        dep: {
          paths: this.endPoints.length,
          cpath: idx + 1,
          failed: this.stats.failed,
          success: this.stats.success,
        }
      })
      const branch = {}
      const mstore = {}
      const sstore = {}
      const call = {}
      const end = {}
      const { ep, trace } = endPoint
      trace.ts.forEach(({ t, epIdx, kTrackingPos, vTrackingPos }) => {
        const entries = {
          'MSTORE': [LocalVariable, mstore],
          'SSTORE': [StateVariable, sstore],
        }
        const [_, name, loc, value] = t
        if (entries[name]) {
          try {
            const [ Variable, store ] = entries[name]
            const storedKey = this.analyzeExp(loc, kTrackingPos, endPoint, epIdx)
            const storedValue = this.analyzeExp(value, vTrackingPos, endPoint, epIdx)
            const sloads = [...storedKey.sloads, ...storedValue.sloads]
            const mloads = [...storedKey.mloads, ...storedValue.mloads]
            const links = [...new Set([...storedKey.links, ...storedValue.links])]
            const subEp = endPoint.sub(epIdx + 1)
            const variable = new Variable(loc, subEp)
            const expression = ['symbol', name, loc, value]
            store[epIdx] = { key: variable, sloads, mloads, links, expression }
            if (name == 'MSTORE') {
              this.stats.success.mstores ++
            } else {
              this.stats.success.sstores ++
            }
          } catch (e) {
            // console.log(e)
            const [ Variable, store ] = entries[name]
            const storedKey = this.analyzeExp(loc, kTrackingPos, endPoint, epIdx)
            const storedValue = this.analyzeExp(value, vTrackingPos, endPoint, epIdx)
            const sloads = [...storedKey.sloads, ...storedValue.sloads]
            const mloads = [...storedKey.mloads, ...storedValue.mloads]
            const links = [...new Set([...storedKey.links, ...storedValue.links])]
            const subEp = endPoint.sub(epIdx + 1)
            const variable = new BlindVariable(loc, subEp)
            const expression = ['symbol', name, loc, value]
            store[epIdx] = { key: variable, sloads, mloads, links, expression }
            if (name == 'MSTORE') {
              this.stats.success.mstores ++
            } else {
              this.stats.success.sstores ++
            }
            if (name == 'MSTORE') {
              this.stats.failed.mstores ++
            } else {
              this.stats.failed.sstores ++
            }
          }
        }
      })

      ep.forEach(({ t, opcode: { name }, pc, stack }, epIdx) => {
        switch (name) {
          case 'JUMPI': {
            const trackingPos = stack.size() - 2
            const symbol = stack.get(trackingPos)
            const { mloads, sloads, links } = this.analyzeExp(symbol, trackingPos, endPoint, epIdx)
            branch[epIdx] = { mloads, sloads, links, expression: symbol }
            break
          }
          case 'DELEGATECALL':
          case 'CALLCODE':
          case 'CREATE':
          case 'CREATE2':
          case 'SELFDESTRUCT':
          case 'CALL': {
            const sloads = []
            const mloads = []
            const links = []
            let numEntries = 0
            if (['DELEGATECALL'].includes(name)) numEntries = 6
            if (['CALL', 'CALLCODE'].includes(name)) numEntries = 7
            if (['CREATE'].includes(name)) numEntries = 3
            if (['CREATE2'].includes(name)) numEntries = 4
            if (['SELFDESTRUCT'].includes(name)) numEntries = 1
            assert(numEntries != 0)
            let entries = Array(numEntries).fill(0)
            entries = entries
              .map((_, idx) => stack.size() - (idx + 1))
              .map(trackingPos => ({ trackingPos, symbol: stack.get(trackingPos)}))
            const operands = []
            entries.forEach(({ trackingPos, symbol }) => {
              const t = this.analyzeExp(symbol, trackingPos, endPoint, epIdx)
              t.sloads.forEach(sload => sloads.push(sload))
              t.mloads.forEach(mload => mloads.push(mload))
              t.links.forEach(link => links.push(link))
              operands.push(symbol)
            })
            const expression = ['symbol', name, ...operands]
            call[epIdx] = { sloads, mloads, links: [...new Set(links)], expression }
            process.send({ dep: { external: true } })
            break
          }
        }
        if (epIdx == ep.length - 1) {
          const links = this.controlLinks([epIdx], endPoint)
          const expression = ['symbol', 'END']
          end[epIdx] = { sloads: [], mloads: [], links, expression }
        }
      })

      this.mem.branches.push(branch)
      this.mem.mstores.push(mstore)
      this.mem.sstores.push(sstore)
      this.mem.ends.push(end)
      this.mem.calls.push(call)
    })
  }
}

module.exports = Cache 
