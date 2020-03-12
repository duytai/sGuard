const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const BN = require('bn.js')
const Analyzer = require('../analyzer')
const Oracle = require('./oracle')

class Gasless extends Oracle {
  startFinding() {
    return []
    const ret = []
    this.endPoints.forEach(({ ep }) => {
      const founds = ep.filter(({ opcode: { name }, stack }) => {
        if (name != 'CALL') return false
          const gas = stack.last()
          switch (gas[0]) {
          case 'const': {
            return gas[1].eq(new BN(0x8fc)) || gas[1].isZero()
          }
          case 'symbol': {
            const [_, name, left, right] = gas
            if (name != 'MUL') return false
            if (right[0] != 'const') return false
            return right[1].eq(new BN(0x8fc))
          }
        }
      })
      founds.forEach(f => {
        if (!ret.find(({ pc }) => pc == f.pc)) {
          ret.push({ dnode: Analyzer.fakeNode('CALL', f.pc), pc: f.pc })
        }
      })
    })
    return ret.map(({ dnode }) => dnode)
  }
}

module.exports = Gasless 
