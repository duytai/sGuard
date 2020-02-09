const assert = require('assert')
const { reverse } = require('lodash')
const Variable = require('./variable')
const hash = require('object-hash')
const {
  prettify,
  isConst,
  isConstWithValue,
  isMstore20,
  isMstore0,
  isSha3Mload0,
  isSha3Mload,
  formatSymbolWithoutTraceInfo,
} = require('../shared')

const findStateAccessPath = (symbol) => {
  const accessPaths = []
  const stackOfSymbols = [{ symbol, accessPath: []}]
  while (stackOfSymbols.length > 0) {
    const { symbol, accessPath } = stackOfSymbols.pop()
    if (isSha3Mload(symbol)) {
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
  /// Find longest accessPath 
  if (!accessPaths.length) {
    prettify([symbol])
    assert(false)
  }
  accessPaths.sort((x, y) => y.length - x.length)
  return accessPaths[0]
}

const toStateVariable = (t, trace, trackingPos, epIdx) => {
  assert(t && trace && trackingPos >= 0 && epIdx >= 0)
  if (isConst(t)) return new Variable(`s_${t[1].toString(16)}`)
  if (isSha3Mload0(t)) {
    const [mload] = t.slice(2)
    const [base, loadSize, loadTraceSize] = mload.slice(2)
    assert(isConst(loadTraceSize))
    assert(isConst(loadSize))
    if (isConstWithValue(loadSize, 0x40)) {
      /// Mapping type
      /// 0x20 is base
      let subTrace = trace
        .sub(loadTraceSize[1].toNumber())
        .filter(isMstore20)
      const storedValue = subTrace.last().t[3]
      const name = hash(formatSymbolWithoutTraceInfo(storedValue)).slice(0, 2)
      const variable = new Variable(`s_${name}`)
      /// 0x00 is member
      subTrace = trace
        .sub(loadTraceSize[1].toNumber())
        .filter(isMstore0)
      const { t, vTrackingPos, epIdx } = subTrace.last()
      const property = { trackingPos: vTrackingPos, symbol: t[3], epIdx }
      variable.addN([property])
      return variable
    } else {
      /// Other types including array
      const subTrace = trace
        .sub(loadTraceSize[1].toNumber())
        .filter(isMstore0)
      const storedValue = subTrace.last().t[3]
      const name = hash(formatSymbolWithoutTraceInfo(storedValue)).slice(0, 2)
      return new Variable(`s_${name}`)
    }
  }
  if (isSha3Mload(t)) {
    const [mload] = t.slice(2)
    const name = hash(formatSymbolWithoutTraceInfo(mload)).slice(0, 2)
    return new Variable(`s_${name}`)
  }
  const properties = []
  const accessPath = findStateAccessPath(t)
  let base = t
  accessPath.forEach(baseIdx => {
    const [type, name, ...operands] = base
    base = operands[baseIdx]
    if (name != 'SUB') {
      properties.push({ trackingPos, symbol: operands[1 - baseIdx], epIdx })
    }
  })
  const variable = toStateVariable(base, trace, trackingPos, epIdx)
  variable.addN(reverse(properties))
  return variable
}

module.exports = toStateVariable
