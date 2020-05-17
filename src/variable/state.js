const assert = require('assert')
const BN = require('bn.js')
const { prettify, isConst, formatSymbol } = require('../shared')
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
    if (isConst(t)) return [[t]]
    const [sha3, ...props] = this.reachSha3(t)
    const [loc, loadSize, traceSize, epSize] = sha3[2].slice(2)
    assert(loc[1].isZero())
    const subEp = ep.sub(epSize[1].toNumber())
    if (!props.length) props.push(['const', new BN(0)])
    if (!isConst(props[0])) this.members.push(props[0])
    if (loadSize[1].eq(new BN(0x20))) {
      const memValue = subEp.trace.memValueAt(loc)
      if (!isConst(memValue))
        return [...this.convert(memValue, subEp), props]
      return [[memValue], props]
    } 
    assert(loadSize[1].eq(new BN(0x40)))
    const memValue = subEp.trace.memValueAt(['const', new BN(0x20)])
    const prop = subEp.trace.memValueAt(['const', new BN(0)])
    if (!isConst(prop)) this.members.push(prop)
    if (!isConst(memValue))
      return [...this.convert(memValue, subEp), [prop]]
    return [[memValue], [prop]]
  }

  eq(otherVariable) {
    if (otherVariable.blind) return true
    if (this.locs.length != otherVariable.locs.length) return false
    const [[mySloc], ...locs] = this.locs
    const [[otherSloc], ...otherLocs] = otherVariable.locs 
    assert(isConst(mySloc) && isConst(otherSloc))
    if (!mySloc[1].eq(otherSloc[1])) return false
    for (let i = 0; i < locs.length; i++) {
      const [dataOffset, ...props] = locs[i]
      const [otherDataOffset, ...otherProps] = otherLocs[i]
      if (isConst(dataOffset) && isConst(otherDataOffset)) {
        if (!dataOffset[1].eq(otherDataOffset[1])) return false
      }
      if (props.length != otherProps.length) return false
      for (let j = 0; j < props.length; j++) {
        if (!isConst(props[j]) || !isConst(otherProps[j])) return false
        if (!props[j][1].eq(otherProps[j][1])) return false
      }
    }
    return true
  }
  
  toAlias() {
    const [[mySloc]] = this.locs
    return `s_${formatSymbol(mySloc)}.*`
  }
}

module.exports = StateVariable 
