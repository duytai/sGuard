const assert = require('assert')
const BN = require('bn.js')
const { range } = require('lodash')
const { prettify, isConst, formatSymbol } = require('../shared')
const Variable = require('./variable')

class LocalVariable extends Variable {

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
    if (isConst(t)) return [t]
    /// TODO: This is a fix for abi encode dynamic variables
    if (t[1] == 'SUB') t = t[2]
    switch (t[1]) {
      case 'ADD': {
        const [prop, base] = t.slice(2)
        const arraySize = this.findArraySize(ep)
        const values = this.convert(base, ep)
        if (isConst(prop)) return values.map(v => ['const', v[1].add(prop[1])])
        this.members.push(prop)
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
        assert(false, `Unknown ${t[1]}`)
      }
    }
  }

  eq(otherVariable) {
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
