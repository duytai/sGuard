const assert = require('assert')
const { isEmpty, findIndex, reverse, uniq } = require('lodash')
const Variable = require('./variable')
const hash = require('object-hash')
const {
  prettify,
  isConst,
  logger,
  findSymbol,
  isMloadConst,
  isMstore40,
  isSha3Mload0,
  isMstore0,
  isOpcode,
  formatSymbol,
} = require('../shared')

const toLocalVariable = (t, trace) => {
  assert(t && trace)
  if (isConst(t)) return new Variable(`m_${t[1].toString(16)}`) 
  if (isMloadConst(t)) {
    const [loc, loadSize, loadTraceSize] = t.slice(2)
    assert(isConst(loadTraceSize))
    const subTrace = trace
      .sub(loadTraceSize[1].toNumber())
      .filter(isMstore40)
    const storedValue = subTrace.last()[3]
    const name = hash(formatSymbol(storedValue)).slice(0, 2)
    return new Variable(`m_${name}`)
  }
  /// Assign a complicaited data structure to another complicaited data structure 
  /// We have to search for the origin variable
  if (isOpcode(t, 'MLOAD')) {
    const [base, loadSize, loadTraceSize] = t.slice(2)
    const subTrace = trace.sub(loadTraceSize[1].toNumber())
    const loadVariable = toLocalVariable(base, subTrace) 
    assert(loadVariable)
    let originVariable = null
    subTrace.eachLocalVariable((storeVariable, storedValue, traceIdx) => {
      if (loadVariable.exactEqual(storeVariable)) {
        originVariable = toLocalVariable(storedValue, trace.sub(traceIdx))
        return true
      }
    })
    assert(originVariable)
    return originVariable
  }
  const properties = []
  const stack = [t]
  while (stack.length > 0) {
    const [type, name, ...operands] = stack.pop()
    assert(name == 'ADD' || name == 'SUB', `loc is ${name}`)
    if (name == 'ADD') {
      const hasLeftMload = findSymbol(operands[0], isMloadConst).length > 0
      const hasRightMload = findSymbol(operands[1], isMloadConst).length > 0
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
      if (isOpcode(base, 'MLOAD')) {
        const variable = toLocalVariable(base, trace)
        properties.push(offset)
        variable.addN(reverse(properties))
        return variable
      }
      properties.push(offset)
      stack.push(base)
    }
    if (name == 'SUB') {
      const [ base, offset ] = operands
      properties.push(offset)
      stack.push(base)
    }
  }
}

const findStateAccessPath = (symbol) => {
  const accessPaths = []
  const stackOfSymbols = [{ symbol, accessPath: []}]
  while (stackOfSymbols.length > 0) {
    const { symbol, accessPath } = stackOfSymbols.pop()
    if (isSha3Mload0(symbol)) {
      accessPaths.push(accessPath)
    } else {
      const [type, name, ...params] = symbol
      params.forEach((param, idx) => {
        if (['SUB', 'ADD'].includes(name)) {
          stackOfSymbols.push({ symbol: param, accessPath: [...accessPath, idx]})
        }
      })
    }
  }
  /// Find shortest accessPath 
  assert(accessPaths.length == 1, `findStateAccessPath`)
  assert(accessPaths[0].length > 0, `findStateAccessPath.length`)
  return accessPaths[0]
}

const toStateVariable = (t, trace) => {
  assert(t && trace)
  if (isConst(t)) return new Variable(`s_${t[1].toString(16)}`)
  if (isSha3Mload0(t)) {
    const [mload] = t.slice(2)
    const [base, loadSize, loadTraceSize] = mload.slice(2)
    assert(isConst(loadTraceSize))
    const subTrace = trace
      .sub(loadTraceSize[1].toNumber())
      .filter(isMstore0)
    const storedValue = subTrace.last()[3]
    const name = hash(formatSymbol(storedValue)).slice(0, 2)
    return new Variable(`s_${name}`)
  }
  const properties = []
  const accessPath = findStateAccessPath(t)
  let base = t
  accessPath.forEach(baseIdx => {
    const [type, name, ...operands] = base
    base = operands[baseIdx]
    properties.push(1 - baseIdx)
  })
  const variable = toStateVariable(base, trace)
  variable.addN(reverse(properties))
  return variable
}

module.exports = {
  toLocalVariable,
  toStateVariable,
}
