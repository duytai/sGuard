const { toPairs } = require('lodash')
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
    tree.root.prettify(0, this.srcmap)
  }
}

module.exports = Integer
