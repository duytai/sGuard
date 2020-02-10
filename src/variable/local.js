const assert = require('assert')
const { reverse } = require('lodash')
const Variable = require('./variable')
const {
  prettify,
  isConst,
  isMload,
} = require('../shared')

const findLocalAccessPath = (symbol) => {
  const accessPaths = []
  const stackOfSymbols = [{ symbol, accessPath: [] }]
  while (stackOfSymbols.length > 0) {
    const { symbol, accessPath, hasMore } = stackOfSymbols.pop()
    if (isMload(symbol)) {
      accessPaths.push(accessPath)
    } else {
      const [type, name, ...params] = symbol
      params.forEach((param, idx) => {
        if (['SUB', 'ADD', 'MUL'].includes(name)) {
          stackOfSymbols.push({
            symbol: param,
            accessPath: [...accessPath, idx],
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

const splitVariable = (t, trace, trackingPos, epIdx) => {
  const item = { t, trace, trackingPos, epIdx }
  const stackOfSymbols = [item]
  const stackOfVariables = []
  const mloadIndexes = []
  while (stackOfSymbols.length > 0) {
    const { t, trace, trackingPos, epIdx } = stackOfSymbols.pop()
    assert(t && trace && trackingPos >= 0 && epIdx >= 0)
    if (isConst(t)) {
      const variable = new Variable(`m_${t[1].toString(16)}`)
      stackOfVariables.push({
        type: 'VAR',
        value: variable,
      })
      continue
    }
    if (isMload(t)) {
      const [loc, loadSize, loadTraceSize] = t.slice(2)
      assert(isConst(loadTraceSize))
      stackOfSymbols.push({ t: loc, trace, trackingPos, epIdx })
      stackOfVariables.push({
        type: 'MLOAD',
        value: { t, trace, trackingPos, epIdx }
      })
      mloadIndexes.push(stackOfVariables.length - 1)
      continue
    }
    const properties = []
    const accessPath = findLocalAccessPath(t)
    let base = t
    accessPath.forEach(baseIdx => {
      const [type, name, ...operands] = base
      base = operands[baseIdx]
      if (name != 'SUB') {
        properties.push({ trackingPos, symbol: operands[1 - baseIdx], epIdx })
      }
    })
    stackOfSymbols.push({ t: base, trace, trackingPos, epIdx })
    stackOfVariables.push({
      type: 'PROP',
      value: reverse(properties),
    })
  }
  stackOfVariables.reverse()
  let mloadCounter = 0
  for (let i = 0; i < stackOfVariables.length; i++) {
    const { type } = stackOfVariables[i]
    if (type == 'MLOAD') mloadCounter ++
    if (mloadCounter == 2) {
      return [
        stackOfVariables.slice(0, i),
        stackOfVariables.slice(i),
      ]
    }
  }
  return [
    stackOfVariables,
    [],
  ]
}

const toLocalVariable = (t, trace, trackingPos, epIdx) => {
  const [stackOfVariables, others] = splitVariable(t, trace, trackingPos, epIdx) 
  let v = null
  while (stackOfVariables.length > 0) {
    const { value, type } = stackOfVariables.shift()
    if (type == 'VAR') {
      v = value
      continue
    }
    if (type == 'PROP') {
      v.addN(value)
      continue
    }
  }
  // if (others.length > 0) {
    // const [{ type, value: { t, trace, trackingPos, epIdx }}] = others
    // const [loc, loadSize, loadTraceSize] = t.slice(2)
    // const subTrace = trace.sub(loadTraceSize[1].toNumber())
    // subTrace.eachLocalVariable(({ variable: storeVariable, value: storedValue, traceIdx }) => {
    // })
  // }
  return v
}
module.exports = toLocalVariable
