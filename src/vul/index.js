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

  toKey(endPointIdx, epIdx) {
    assert(endPointIdx >= 0 && epIdx >= 0)
    return has([endPointIdx, epIdx].join(':')).slice(4)
  }

  connect(directParent, endPointIdx, epIdx, { expression, sloads, mloads, links }, visited = new Set()) {
    const { mem: { branches } } = this.cache
    const { pc } = this.cache.endPoints[endPointIdx].ep[epIdx]
    const dnode = new DNode(expression, pc)
    const branch = branches[endPointIdx]
    directParent.node.childs.push(dnode)
    links.forEach(epIdx => {
      this.connect(dnode, endPointIdx, epIdx, branch[epIdx])
    })
  }

  start() {
    const { calls } = this.cache.mem
    const root = new DNode(['symbol', 'root'], 0)
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        this.connect(root, endPointIdx, epIdx, value)
      })
    })
    root.prettify(0, this.srcmap)
  }
} 

module.exports = { Scanner }
