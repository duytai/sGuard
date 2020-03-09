const assert = require('assert')
const Oracle = require('./oracle')
const { findSymbol, prettify } = require('../shared')

class Int extends Oracle {
  startFinding() {
    const ret = []
    const stack = [this.dnode]
    const sos = ['ADD', 'SUB', 'MUL', 'POW']
    while (stack.length) {
      const dnode = stack.pop()
      const { node: { me, childs } } = dnode
      const symbols = findSymbol(me, ([type, name]) => sos.includes(name))
      if (symbols.length > 0) ret.push(dnode)
      childs.forEach(child => stack.push(child))
    }
    return ret
  }
}

module.exports = Int
