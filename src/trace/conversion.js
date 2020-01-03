const assert = require('assert')
const { isEmpty, findIndex, reverse } = require('lodash')
const Variable = require('./variable')
const {
  prettify,
  isConst,
  logger,
  findSymbol,
  isVariable,
  isLocalVariable,
  isStateVariable,
  isMload40,
  isMstore40,
  isSha3Mload0,
  isMstore0,
} = require('../shared')

const toLocalVariable = (t, trace) => {
  if (isConst(t)) return new Variable(`m_${t[1].toString(16)}`) 
  if (isMload40(t)) {
    const [base, loadSize, loadTraceSize] = t.slice(2)
    assert(isConst(loadTraceSize))
    const subTrace = trace
      .sub(loadTraceSize[1].toNumber())
      .filter(isMstore40)
    return new Variable(`m_${subTrace.size().toString(16)}`)
  }
  const properties = []
  const stack = [t]
  while (stack.length > 0) {
    const [type, name, ...operands] = stack.pop()
    assert(name == 'ADD' || name == 'SUB', `loc is ${name}`)
    if (name == 'ADD') {
      const hasLeftMload = findSymbol(operands[0], isMload40).length > 0
      const hasRightMload = findSymbol(operands[1], isMload40).length > 0
      const constIdx = findIndex(operands, ([type]) => type == 'const')
      if (!hasLeftMload && !hasRightMload) {
        assert(false, 'Need an example')
      }
      /*
       * FIXME: both left and right contain mload then left is base
       * (However it could be right)
       * */
      const baseIdx = hasRightMload ? 1 : 0
      const base = operands[baseIdx]
      const offset = operands[1 - baseIdx]
      if (isMload40(base)) {
        const variable = toLocalVariable(base, trace)
        variable.addN(reverse([...properties, offset]))
        return variable
      } else {
        properties.push(offset)
        stack.push(base)
      }
    }
    if (name == 'SUB') {
      stack.push(operands[0])
    }
  }
}

const toStateVariable = (t, trace) => {
  if (isConst(t)) return new Variable(`s_${t[1].toString(16)}`) 
  if (isSha3Mload0(t)) {
    const [mload] = t.slice(2)
    const [type, name, base, loadSize, loadTraceSize] = mload
    assert(isConst(loadTraceSize))
    const subTrace = trace
      .sub(loadTraceSize[1].toNumber())
      .filter(isMstore0)
    return new Variable(`s_${subTrace.size().toString(16)}`)
  }
  const properties = []
  const stack = [t]
  while (stack.length > 0) {
    const [type, name, ...operands] = stack.pop()
    assert(name == 'ADD' || name == 'SUB', `loc is ${name}`)
    if (name == 'ADD') {
      const hasLeftSha3 = findSymbol(operands[0], isSha3Mload0).length > 0
      const hasRightSha3 = findSymbol(operands[1], isSha3Mload0).length > 0
      const constIdx = findIndex(operands, ([type]) => type == 'const')
      if (!hasLeftSha3 && !hasRightSha3) {
        assert(false, 'Need an example')
      }
      /*
       * FIXME: both left and right contain mload then right is base
       * (However it could be left)
       * */
      const baseIdx = hasLeftSha3 ? 0 : 1
      const base = operands[baseIdx]
      const offset = operands[1 - baseIdx]
      if (isSha3Mload0(base)) {
        const variable = toStateVariable(base, trace)
        variable.addN(reverse([...properties, offset]))
        return variable
      } else {
        properties.push(offset)
        stack.push(base)
      }
    }
    if (name == 'SUB') {
      stack.push(operands[0])
    }
  }
}

const toVariable = (t, trace) => {
  if (isLocalVariable(t)) return toLocalVariable(t[2], trace)
  if (isStateVariable(t)) return toStateVariable(t[2], trace)
  assert(false)
}

module.exports = {
  isVariable,
  toVariable,
  toLocalVariable,
}
