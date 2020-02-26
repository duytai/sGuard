const assert = require('assert')
const BN = require('bn.js')
const { reverse, findIndex, range } = require('lodash')
const { prettify, isConst } = require('../shared')

class LocalVariable {
  constructor(t, ep) {
    const locs = this.convert(t, ep)
    // prettify(locs)
  }

  findArraySize(ep) {
    const { stack } = ep.find(({ opcode: { name }}) => name == 'LT')
    const ret = stack.get(stack.size() - 2)
    if (isConst(ret)) return ret[1].toNumber()
    assert(ret[1] == 'MLOAD')
    const value = ep.trace.memValueAt(ret[2])
    assert(isConst(value))
    return value[1].toNumber()
  }

  convert(t, ep) {
    if (t[0] == 'const') return [t]
    switch (t[1]) {
      case 'ADD': {
        const [prop, base] = t.slice(2)
        const arraySize = this.findArraySize(ep)
        const values = this.convert(base, ep)
        if (isConst(prop)) return values.map(v => ['const', v[1].add(prop[1])])
        return values.reduce((agg, next) => {
          next = range(0, arraySize).map(n => ['const', next[1].add(new BN(n * 0x20))])
          return [...agg, ...next]
        }, [])
      }
      case 'MLOAD': {
        const [loc, loadSize, traceSize, epSize] = t.slice(2)
        const subEp = ep.sub(epSize[1].toNumber())
        const values = this.convert(loc, ep)
        return values.map(v => subEp.trace.memValueAt(v))
      }
      default: {
        assert(`Unknown ${t[1]}`)
      }
    }
  }
}

module.exports = LocalVariable 
