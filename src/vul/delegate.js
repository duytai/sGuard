const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const BN = require('bn.js')
const Analyzer = require('../analyzer')
const Oracle = require('./oracle')

class Delegate extends Oracle {
  startFinding() {
    const ret = []
    const pcs = new Set()
    this.endPoints.forEach(({ ep }) => {
      const founds = ep.filter(({ opcode: { name } }) => name == 'DELEGATECALL')
      founds.forEach(f => {
        if (!pcs.has(f.pc)) {
          ret.push(Analyzer.fakeNode('DELEGATECALL', f.pc))
          pcs.add(f.pc)
        }
      })
    })
    return ret
  }
}

module.exports = Delegate 
