const assert = require('assert')
const { toPairs } = require('lodash')
const { DNode } = require('../analyzer')

class Tree {

  constructor(cache) {
    this.root = new DNode(['symbol', 'root'], 0)
    this.visited = new Set()
    this.cache = cache
  }

  toKey(endPointIdx, epIdx) {
    assert(endPointIdx >= 0 && epIdx >= 0)
    return [endPointIdx, epIdx].join(':')
  }

  build(endPointIdx, epIdx, value) {
    this.connect(this.root, endPointIdx, epIdx, value)
  }

  connect(directParent, endPointIdx, epIdx, value) {
    const key = this.toKey(endPointIdx, epIdx)
    if (this.visited.has(key)) return
    this.visited.add(key)
    const { expression, sloads, mloads, links } = value
    const { mem: { branches, mstores, sstores } } = this.cache
    const { pc } = this.cache.endPoints[endPointIdx].ep[epIdx]
    const dnode = new DNode(expression, pc)
    const branch = branches[endPointIdx]
    directParent.node.childs.push(dnode)
    links.forEach(epIdx => {
      this.connect(dnode, endPointIdx, epIdx, branch[epIdx])
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
            this.connect(dnode, endPointIdx, mstoreEpIdx, value)
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
            this.connect(dnode, endPointIdx, sstoreEpIdx, value)
          }
        })
      })
    })
  }
}

module.exports = Tree
