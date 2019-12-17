const BN = require('bn.js')
const assert = require('assert')
const { reverse, findIndex } = require('lodash')
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
      const stackLen = ['const', new BN(idx + 1)]
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
    switch (name) {
      case 'ADD': {
        const shaIdx = findIndex(params, param => param[1] == 'SHA3')
        if (shaIdx != -1) {
          const offset = params[1 - shaIdx]
          const validTraces = this.traces.slice(0, stackLen[1].toNumber())
          const base = reverse(validTraces).find(trace => trace[1] == 'MSTORE')
          assert(base)
          return { base, offset }
        }
        assert(params[0][0] == 'const')
        assert(params[1][1] == 'ADD')
        console.log('>>> BASE')
        return { base: symbol, offset: zero }
      }
      case 'SHA3': {
        const validTraces = this.traces.slice(0, stackLen[1].toNumber())
        const base = reverse(validTraces).find(trace => trace[1] == 'MSTORE')
        assert(base)
        return { base, offset: zero }
      }
    }
  }
}

module.exports = Storage
