const { isEmpty, toPairs } = require('lodash')
const { prettify } = require('../shared')
const { DNode } = require('../analyzer')

class Scanner {
  constructor(cache, srcmap) {
    this.cache = cache
    this.srcmap = srcmap
  }

  connect(directParent, { symbol, sloads, mloads, links, pc }) {
    const dnode = new DNode(symbol, pc)
    directParent.node.childs.push(dnode)
  }

  start() {
    const { mem: { calls }, endPoints } = this.cache
    const root = new DNode(['symbol', 'root'], 0)
    calls.forEach((call, endPointIdx) => {
      // toPairs(call).forEach(([epIdx, value]) => {
        // const { sloads, mloads, links } = value
        // const { pc, stack } = endPoints[endPointIdx].ep[epIdx]
        // const stackSize = stack.size()
        // const symbol = [
          // 'symbol',
          // 'MERGE',
          // stack.get(stackSize - 1),
          // stack.get(stackSize - 2),
          // stack.get(stackSize - 3)
        // ]
        // this.connect(root, { symbol, sloads, mloads, links, pc })
      // })
    })
    root.prettify(0, this.srcmap)
  }
} 

module.exports = { Scanner }
