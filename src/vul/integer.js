const { toPairs } = require('lodash')
const { prettify, formatSymbol } = require('../shared')
const Tree = require('./tree')

class Integer {
  constructor(cache, srcmap) {
    this.cache = cache
    this.srcmap = srcmap
  }

  scan() {
    const { calls } = this.cache.mem
    const tree = new Tree(this.cache)
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        tree.build(endPointIdx, epIdx, value)
      })
    })
    const stack = [tree.root]
    while (stack.length > 0) {
      const it = stack.pop()
      const { node: { me, childs, pc } } = it
      const txt = formatSymbol(me)
      const found = !!['ADD', 'SUB', 'MUL', 'POW'].find(x => txt.includes(x))
      if (found) {
        prettify([me])
        console.log(this.srcmap.toSrc(pc).txt.split('\n')[0])
      }
      childs.forEach(child => stack.push(child))
    }
    // tree.root.prettify(0, this.srcmap)
  }
}

module.exports = Integer
