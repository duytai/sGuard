const assert = require('assert')
const { formatSymbol } = require('../shared')
const Oracle = require('./oracle')

class Block extends Oracle {
  startFinding() {
    const ret = []
    const stack = [this.dnode]
    while (stack.length) {
      const dnode = stack.pop()
      const { node: { me, childs } } = dnode
      const txt = formatSymbol(me)
      if (txt.includes('NUMBER') || txt.includes('TIMESTAMP')) ret.push(dnode)
      childs.forEach(child => stack.push(child))
    }
    return ret
  }
}

module.exports = Block
