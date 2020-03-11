const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const BN = require('bn.js')
const Analyzer = require('../analyzer')
const Oracle = require('./oracle')

class Gasless extends Oracle {
  startFinding() {
    const ret = []
    const pcs = new Set()
    this.endPoints.forEach(({ ep }) => {
      const f = ep.find(({ opcode: { name }, stack }) => {
        if (name != 'CALL') return false
        const gas = stack.last()
        switch (gas[0]) {
          case 'const': {
            return gas[1].eq(new BN(0x8fc))
          }
          case 'symbol': {
            const [_, name, left, right] = gas
            if (name != 'MUL') return false
            if (right[0] != 'const') return false
            return right[1].eq(new BN(0x8fc))
          }
        }
      })
      if (f && !pcs.has(f.pc)) {
        ret.push(Analyzer.fakeNode('CALL', f.pc))
        pcs.add(f.pc)
      }
    })
    return ret
  }
}

module.exports = Gasless 
