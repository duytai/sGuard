const assert = require('assert')
const { isEmpty, toPairs } = require('lodash')
const hash = require('object-hash')
const { prettify } = require('../shared')
const { DNode } = require('../analyzer')

class Scanner {
  constructor(cache, srcmap) {
    this.cache = cache
    this.srcmap = srcmap
  }

  connect(directParent, endPointIdx, epIdx, value, visited) {
    if (visited.has(epIdx)) return
    visited.add(epIdx)
    const { expression, sloads, mloads, links } = value
    const { mem: { branches, mstores } } = this.cache
    const { pc } = this.cache.endPoints[endPointIdx].ep[epIdx]
    const dnode = new DNode(expression, pc)
    const branch = branches[endPointIdx]
    directParent.node.childs.push(dnode)
    links.forEach(epIdx => this.connect(dnode, endPointIdx, epIdx, branch[epIdx], visited))
    const mstore = mstores[endPointIdx]
    toPairs(mstore).forEach(([mstoreEpIdx, value]) => {
      if (mstoreEpIdx < epIdx) {
        mloads.forEach(mload => {
          if (mload.eq(value.key)) this.connect(dnode, endPointIdx, mstoreEpIdx, value, visited)
        })
      }
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
