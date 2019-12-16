const BN = require('bn.js')
const assert = require('assert')
const { prettify, formatSymbol, isConst } = require('../shared')

class Storage {
  constructor(symbol, traces) {
    const [type, name, offset, stackLen] = symbol
    assert(name == 'SLOAD')
    this.traces = traces
    this.storageloc = this.extractStorageloc(offset, stackLen)
  }

  prettify({ base, offset }) {
    console.log(`base:offset = ${formatSymbol(base)}:${formatSymbol(offset)}`)
  }

  /*
   * Simply compare 2 symbols by converting them to string
   * */
  equal(sym1, sym2) {
    return formatSymbol(sym1) == formatSymbol(sym2)
  }

  /*
   * Find storage locations where the value of this.storageloc is stored
   * + Bases must be the same
   * + If the offset is const then offsets must be the same. Otherwise, return all matches
   * */
  matches() {
    const storagestores = this.traces.filter((trace, idx) => {
      const [type, name, ...params] = trace
      if (name != 'SSTORE') return false
      const [offset, value] = params
      const stackLen = ['const', new BN(idx)]
      const storageloc = this.extractStorageloc(offset, stackLen)
      return this.equal(storageloc.base, this.storageloc.base)
    })
    return storagestores.map(sstore => {
      const [type, name, offset, value] = sstore
      return value
    })
  }
  /*
   * Extract base and offset of a typical storage location
   * */
  extractStorageloc(symbol, stackLen) {
    const zero = ['const', new BN(0)]
    const [type, name, ...params] = symbol
    if (type == 'const') return { base: symbol, offset: zero }
    assert(type == 'symbol')
    const offset = name == 'ADD' ? params[1] : zero
    const base = this.traces[stackLen[1].toNumber() - 1]
    assert(base[1] == 'MSTORE')
    return { base, offset }
  }
}

module.exports = Storage
