const assert = require('assert')
const BN = require('bn.js')
const { prettify, isConst } = require('../shared')
const Variable = require('./variable')

/// t = sha3(t0) + ax + b
/// a: size of type - b: prop

class StateVariable extends Variable {
  reachSha3(t) {
    if (isConst(t)) return []
    if (t[1] == 'SHA3') return [t]
    const [_, name, left, right] = t
    assert(name == 'ADD')
    if (isConst(left) || left[1] == 'MUL')
      return [...this.reachSha3(right), left]
    return [...this.reachSha3(left), right]
  }

  convert(t, ep) {
    if (isConst(t)) return [t]
    const [sha3, ...props] = this.reachSha3(t)
    const [loc, loadSize, traceSize, epSize] = sha3[2].slice(2)
    assert(loc[1].isZero())
    const subEp = ep.sub(epSize[1].toNumber())
    if (loadSize[1].eq(new BN(0x20))) {
      const memValue = subEp.trace.memValueAt(loc)
      if (!isConst(memValue))
        return [...this.convert(memValue, subEp), props]
      return [[memValue], props]
    } 
    assert(loadSize[1].eq(new BN(0x40)))
    const memValue = subEp.trace.memValueAt(['const', new BN(0x20)])
    const prop = subEp.trace.memValueAt(['const', new BN(0)])
    if (!isConst(memValue))
      return [...this.convert(memValue, subEp), [prop]]
    return [[memValue], [prop]]
  }
}

module.exports = StateVariable 
