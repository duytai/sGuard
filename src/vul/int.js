const assert = require('assert')
const Oracle = require('./oracle')
const { findSymbol, prettify, formatSymbolWithoutEpSize } = require('../shared')

class Int extends Oracle {
  startFinding() {
    const ret = []
    const stack = [this.dnode]
    const sos = ['ADD', 'SUB', 'MUL', 'POW']
    const comps = ['GT', 'LT', 'SGT', 'SLT']
    while (stack.length) {
      const dnode = stack.pop()
      const { node: { me, childs } } = dnode
      const symbols = findSymbol(me, ([type, name]) => sos.includes(name))
      symbols.forEach(([_, name, ...operands]) => {
        const [left, right] = operands.map(o => formatSymbolWithoutEpSize(o))
        /// Find comparison in direct childs
        const found = !!childs.find(({ node: { me } }) => {
          const symbols = findSymbol(me, ([type, name]) => comps.includes(name))
          return !!symbols.find(([_, name, ...operands])=> {
            const [otherLeft, otherRight] = operands.map(o => formatSymbolWithoutEpSize(o))
            return (left == otherLeft && right == otherRight) || (left == otherRight && right == otherLeft)
          })
        })
        if (!found) ret.push(dnode)
      })
      childs.forEach(child => stack.push(child))
    }
    return ret
  }
}

module.exports = Int
