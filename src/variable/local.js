const assert = require('assert')
const BN = require('bn.js')
const { range } = require('lodash')
const { prettify, isConst, formatSymbol } = require('../shared')
const Variable = require('./variable')

class LocalVariable extends Variable {

  fetchMload(loc, ep) {
    if (isConst(loc)) return loc
    switch (loc[1]) {
      case 'ADD': {
        assert(isConst(loc[2]))
        const ext = loc[2][1]
        loc = loc[3]
        assert(loc[1] == 'MLOAD')
        const subEp = ep.sub(loc[5][1].toNumber())
        const r = subEp.trace.memValueAt(this.fetchMload(loc[2], subEp))
        r[1] = r[1].add(ext)
        return r
      }
      case 'MUL': {
        assert(isConst(loc[2]))
        const ext = loc[2][1]
        loc = loc[3]
        assert(loc[1] == 'MLOAD')
        const subEp = ep.sub(loc[5][1].toNumber())
        const r = subEp.trace.memValueAt(this.fetchMload(loc[2], subEp))
        r[1] = r[1].mul(ext)
        return r
      }
      case 'MLOAD': {
        const subEp = ep.sub(loc[5][1].toNumber())
        return subEp.trace.memValueAt(this.fetchMload(loc[2], subEp))
      }
      default: {
        assert(false, `unknow: ${loc[1]}`)
      }
    }
  }

  findArraySize(ep) {
    const { stack } = ep.find(({ opcode: { name }}) => name == 'LT')
    const ret = stack.get(stack.size() - 2)
    if (isConst(ret)) return ret[1].toNumber()
    const value = this.fetchMload(ret, ep)
    assert(isConst(value))
    return value[1].toNumber()
  }

  convert(t, ep) {
    if (isConst(t)) return [t]
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
        assert(loadSize[1].toNumber() % 0x20 == 0)
        const subEp = ep.sub(epSize[1].toNumber())
        const values = this.convert(loc, ep)
        return values.map(v => subEp.trace.memValueAt(v))
      }
      default: {
        assert(false, `Unknown ${t[1]}`)
      }
    }
  }

  eq(otherVariable) {
    if (otherVariable.blind) return true
    for (let i = 0; i < this.locs.length; i++) {
      for (let j = 0; j < otherVariable.locs.length; j++) {
        if (!isConst(this.locs[i]) || !isConst(otherVariable.locs[j])) return false
        if (this.locs[i][1].eq(otherVariable.locs[j][1])) return true
      }
    }
    return false
  }

  toAlias() {
    const str = this.locs.map(l => formatSymbol(l)).join(',')
    return `[${str}]`
  }
}

module.exports = LocalVariable 
