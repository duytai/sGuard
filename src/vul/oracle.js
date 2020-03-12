const assert = require('assert')

class Oracle {
  constructor(endPoints) {
    assert(endPoints)
    this.endPoints = endPoints
  }

  treeSearch(stack, cond) {
    assert(stack.length > 0 && cond)
    const ret = []
    while (stack.length) {
      const dnode = stack.pop()
      const { node: { me, childs } } = dnode
      if (cond(me)) ret.push(dnode)
      childs.forEach(child => stack.push(child))
    }
    return ret
  }

  startFinding() {}
}

module.exports = Oracle
