const assert = require('assert')
const { isEmpty, findIndex, reverse, uniq } = require('lodash')
const Variable = require('./variable')
const hash = require('object-hash')
const {
  prettify,
  isConst,
  isConstWithValue,
  logger,
  findSymbol,
  isMloadConst,
  isMstoreConst,
  isMstore40,
  isMstore20,
  isMstore0,
  isSha3Mload0,
  isSha3Mload,
  isOpcode,
  formatSymbolWithoutTraceInfo,
} = require('../shared')

const findLocalAccessPath = (symbol) => {
  const accessPaths = []
  const stackOfSymbols = [{ symbol, accessPath: [], hasMore: true }]
  while (stackOfSymbols.length > 0) {
    const { symbol, accessPath, hasMore } = stackOfSymbols.pop()
    if (isMloadConst(symbol)) {
      accessPaths.push(accessPath)
    } else {
      const [type, name, ...params] = symbol
      params.forEach((param, idx) => {
        if (['SUB', 'ADD', 'MLOAD', 'MUL'].includes(name)) {
          stackOfSymbols.push({
            symbol: param,
            accessPath: (hasMore && name != 'MLOAD') ? [...accessPath, idx] : [...accessPath],
            hasMore: hasMore && name != 'MLOAD'
          })
        }
      })
    }
  }
  if (!accessPaths.length) {
    /// No MLOAD, base address is a real value 
    const [type, name, ...params] = symbol
    assert(name == 'ADD')
    assert(isConst(params[1]))
    return [1]
  }
  /// Find longest accessPath
  accessPaths.sort((x, y) => y.length - x.length)
  return accessPaths[0]
}

const toLocalVariable = (t, trace, trackingPos) => {
  assert(t && trace && trackingPos >= 0)
  if (isConst(t)) return new Variable(`m_${t[1].toString(16)}`) 
  if (isMloadConst(t)) {
    const [loc, loadSize, loadTraceSize] = t.slice(2)
    assert(isConst(loadTraceSize))
    const subTrace = trace.sub(loadTraceSize[1].toNumber()).filter(otherT => {
      if (!isMstoreConst(otherT)) return false
      const [otherLoc] = t.slice(2)
      return otherLoc[1].toNumber() == loc[1].toNumber()
    })
    assert(subTrace.size() >= 1, `Must load from ${loc[1].toString(16)}`)
    return new Variable(`m_${loc[1].toString(16)}`)
  }
  /// Assign a complicaited data structure to another complicaited data structure 
  /// We have to search for the origin variable
  if (isOpcode(t, 'MLOAD')) {
    const [base, loadSize, loadTraceSize] = t.slice(2)
    const subTrace = trace.sub(loadTraceSize[1].toNumber())
    const loadVariable = toLocalVariable(base, subTrace, trackingPos) 
    assert(loadVariable)
    let originVariable = null
    subTrace.eachLocalVariable(({ variable: storeVariable, value: storedValue, traceIdx }) => {
      if (loadVariable.exactEqual(storeVariable)) {
        originVariable = toLocalVariable(storedValue, trace.sub(traceIdx), trackingPos)
        return true
      }
    })
    assert(originVariable)
    return originVariable
  }
  const properties = []
  const accessPath = findLocalAccessPath(t)
  let base = t
  accessPath.forEach(baseIdx => {
    const [type, name, ...operands] = base
    base = operands[baseIdx]
    if (name != 'SUB') {
      properties.push({ trackingPos, symbol: operands[1 - baseIdx] })
    }
  })
  const variable = toLocalVariable(base, trace, trackingPos)
  variable.addN(reverse(properties))
  return variable
}

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

const toStateVariable = (t, trace, trackingPos) => {
  assert(t && trace && trackingPos >= 0)
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
      const { t, vTrackingPos } = subTrace.last()
      const property = { trackingPos: vTrackingPos, symbol: t[3] }
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
      properties.push({ trackingPos, symbol: operands[1 - baseIdx]})
    }
  })
  const variable = toStateVariable(base, trace, trackingPos)
  variable.addN(reverse(properties))
  return variable
}

module.exports = {
  toLocalVariable,
  toStateVariable,
}
