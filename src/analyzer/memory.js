const assert = require('assert')
const BN = require('bn.js')
const { formatSymbol, isConst } = require('../shared')

class Memory {
  constructor(symbol, traces) {
    const [type, name, offset] = symbol
    assert(name == 'MLOAD')
    this.memloc = this.extractMemloc(offset)
    this.traces = traces
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
   * Find memory locations where the value of this.memloc is stored
   * + Bases must be the same
   * + If the offset is const then offsets must be the same. Otherwise, return all matches
   * */
  match() {
    const memstores = this.traces.filter(trace => {
      const [type, name, ...params] = trace
      if (name != 'MSTORE') return false
      const [offset, value, stackLen] = params
      const memloc = this.extractMemloc(offset)
      if (!this.equal(memloc.base, this.memloc.base)) return false
      if (isConst(this.memloc.offset)) return this.equal(this.memloc.offset, memloc.offset)
      return true
    })
    return memstores.map(mstore => {
      const [type, name, offset, value] = mstore
      return value
    })
  }
  /*
   * Extract base and offset of a typical memory location
   * */
  extractMemloc(symbol) {
    const zero = ['const', new BN(0)]
    const [type, name, ...params] = symbol
    if (type == 'const') return { base: symbol, offset: zero }
    assert(type == 'symbol')
    const [offset, base] = name == 'ADD' ? params : [zero, symbol]
    assert(base[1] == 'MLOAD')
    return { base, offset }
  }
}

module.exports = Memory 
