const assert = require('assert')
const { findIndex } = require('lodash')
const Variable = require('./variable')
const {
  prettify,
  isConst,
  isConstWithValue,
  logger,
} = require('../shared')

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
  if (isConst(t)) return new Variable(`m_${t[1].toString(16)}`) 
  if (isMload40(t)) {
    const [base, loadSize, traceSize] = t.slice(2)
    assert(isConst(traceSize))
    const subTrace = trace
      .subTrace(traceSize[1].toNumber())
      .filter(isMstore40)
    return new Variable(`m_${subTrace.size()}`)
  }
  const properties = []
  const stack = [t]
  while (stack.length > 0) {
    const loc = stack.pop()
    switch (loc[1]) {
      case 'ADD': {
        const operands = loc.slice(2)
        const mloadIdx = findIndex(operands, isMload40)
        if (mloadIdx >= 0) {
          const base = operands[mloadIdx]
          const offset = operands[1 - mloadIdx]
          const variable = toLocalVariable(base, trace)
          variable.addN([...properties, offset])
          return variable
        }
        // const constIdx = findIndex(operands, ([type]) => type == 'const')
        // const addIndex = findIndex(operands, ([type, name]) => name == 'ADD')
        // const subIndex = findIndex(operands, ([type, name]) => name == 'SUB')
        // if (mloadIdx >= 0) {
          // const base = operands[mloadIdx]
          // const offset = operands[1 - mloadIdx]
          // const members = reverse([...properties, offset])
          // return new Variable(members, this.toVariable(base))
        // }
        // if (constIdx == 1) {
          // const [offset, base] = operands
          // const root = `m_${base[1].toString(16)}`
          // const members = reverse([...properties, offset])
          // return new Variable([root, ...members])
        // }
        // assert(addIndex != -1 || subIndex != -1)
        // if (addIndex != -1) {
          // const base = operands[addIndex]
          // const offset = operands[1 - addIndex]
          // properties.push(offset)
          // stack.push(base)
        // }
        // if (subIndex != -1) {
          // const base = operands[subIndex]
          // const offset = operands[1 - subIndex]
          // properties.push(offset)
          // stack.push(base)
        // }
        break
      }
      case 'SUB': {
        break
      }
      default: {
        assert(false, `loc is ${loc[1]}`)
      }
    }
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
