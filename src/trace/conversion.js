const assert = require('assert')
const Variable = require('./variable')
const { prettify, isConst, isConstWithValue } = require('../shared')

const isVariable = (t) => {
  if (isConst(t)) return false
  const [type, name, loc] = t
  if (name != 'MSTORE' && name != 'SSTORE') return false
  if (isConst(loc)) return loc[1].toNumber() >= 0x80
  return true
}

const isStateVariable = (t) => {
  if (!isVariable(t)) return false
  return t[1] == 'SSTORE'
} 

const isLocalVariable = (t) => {
  if (!isVariable(t)) return false
  return t[1] == 'MSTORE'
} 

const isMload40 = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MLOAD') return false
  return isConstWithValue(t[2], 0x40)
}

const isMstore40 = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MSTORE') return false
  return isConstWithValue(t[2], 0x40)
}

const toLocalVariable = (t, trace) => {
  if (isConst(t)) return new Variable(`m_${t[1].toNumber()}`) 
  if (isMload40(t)) {
    const [base, loadSize, traceSize] = t.slice(2)
    assert(isConst(traceSize))
    const subTrace = trace
      .subTrace(traceSize[1].toNumber())
      .filter(isMstore40)
    return new Variable(`m_${subTrace.size()}`)
  }
}

const toStateVariable = (t) => {
}

const toVariable = (t, trace) => {
  assert(isVariable(t))
  if (isLocalVariable(t)) {
    return toLocalVariable(t[2], trace)
  }
}

module.exports = {
  isVariable,
  toVariable,
}
