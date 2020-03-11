const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const BN = require('bn.js')
const Analyzer = require('../analyzer')
const Oracle = require('./oracle')

class Reentrancy extends Oracle {
  startFinding() {
    const ret = []
    this.endPoints.forEach(({ ep }) => {
      let calls = []
      let hasStore = false
      for (let i = 0; i < ep.length; i++) {
        const { opcode: { name } } = ep[i]
        hasStore = hasStore || calls.length > 0 && name == 'SSTORE'
        if (name == 'CALL' && !calls.includes(i)) calls.push(i)
      }
      hasStore && calls.forEach(i => !ret.includes(ep[i].pc) && ret.push(ep[i].pc))
    })
    return ret.map(pc => Analyzer.fakeNode('CALL', pc))
  }
}

module.exports = Reentrancy 
