const assert = require('assert')
const { isEmpty, toPairs } = require('lodash')
const { prettify } = require('../shared')
const { DNode } = require('../analyzer')

class Scanner {
  constructor(cache, srcmap) {
    this.cache = cache
    this.srcmap = srcmap
  }

  toKey(endPointIdx, epIdx) {
    assert(endPointIdx >= 0 && epIdx >= 0)
    return [endPointIdx, epIdx].join(':')
  }

  connect(directParent, endPointIdx, epIdx, value, visited) {
    const key = this.toKey(endPointIdx, epIdx)
    if (visited.has(key)) return
    visited.add(key)
    const { expression, sloads, mloads, links } = value
    const { mem: { branches, mstores, sstores } } = this.cache
    const { pc } = this.cache.endPoints[endPointIdx].ep[epIdx]
    const dnode = new DNode(expression, pc)
    const branch = branches[endPointIdx]
    directParent.node.childs.push(dnode)
    links.forEach(epIdx => {
      this.connect(dnode, endPointIdx, epIdx, branch[epIdx], visited)
    })
    const mstore = mstores[endPointIdx]
    const mloadStack = [...mloads]
    while (mloadStack.length) {
      const mload = mloadStack.pop()
      const pairs = toPairs(mstore).reverse()
      for (let i = 0; i < pairs.length; i++) {
        const [mstoreEpIdx, value] = pairs[i]
        if (parseInt(mstoreEpIdx) < parseInt(epIdx)) {
          if (mload.eq(value.key)) {
            this.connect(dnode, endPointIdx, mstoreEpIdx, value, visited)
            if (
              mload.locs.length == 1
              && value.key.locs.length == 1
            ) break
          }
        }
      }
    }
    sstores.forEach((sstore, endPointIdx) => {
      toPairs(sstore).forEach(([sstoreEpIdx, value]) => {
        sloads.forEach(sload => {
          if (sload.eq(value.key)) {
            this.connect(dnode, endPointIdx, sstoreEpIdx, value, visited)
          }
        })
      })
    })
  }

  start() {
    const { calls } = this.cache.mem
    const root = new DNode(['symbol', 'root'], 0)
    const visited = new Set()
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        this.connect(root, endPointIdx, epIdx, value, visited)
      })
    })
    root.prettify(0, this.srcmap)
  }
} 

module.exports = { Scanner }
