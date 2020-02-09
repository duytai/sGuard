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
  const stackOfSymbols = [{ symbol, accessPath: [], hasMore: true }]
  while (stackOfSymbols.length > 0) {
    const { symbol, accessPath, hasMore } = stackOfSymbols.pop()
    if (isMload(symbol)) {
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

const toLocalVariable = (t, trace, trackingPos, epIdx) => {
  const item = { t, trace, trackingPos, epIdx }
  const stackOfSymbols = [item]
  const stackOfVariables = []
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
      const subTrace = trace.sub(loadTraceSize[1].toNumber())
      stackOfSymbols.push({ t: loc, trace, trackingPos, epIdx })
      stackOfVariables.push({
        type: 'MLOAD',
        value: { t: loc, trace, trackingPos, epIdx }
      })
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
  // const secondMloadIdx = stackOfVariables
    // .map(({ type }, idx) => type == 'MLOAD' ? idx : -1)
    // .filter(idx => idx >= 0)[1] ||
  // const firstSegment = stackOfVariables.slice(0, secondMloadIdx)
  // const secondSegment = stackOfVariables.slice(secondMloadIdx)
  // console.log(firstSegment)
  // console.log(secondSegment)
  // const mloadCounter = stackOfVariables.filter(({ type }) => type == 'MLOAD').length
  // switch (mloadCounter) {
    // case 0: {
      // assert(stackOfVariables[0].type == 'VAR')
      // const { value: v } = stackOfVariables.shift()
      // assert(stackOfVariables.length <= 1)
      // if (stackOfVariables.length) {
        // const { value: properties } = stackOfVariables.shift()
        // v.addN(properties)
      // }
      // return v
    // }
    // case 1: {
      // assert(stackOfVariables[0].type == 'VAR')
      // const { value: v } = stackOfVariables.shift()
      // assert(stackOfVariables[0].type == 'MLOAD')
      // stackOfVariables.shift()
      // assert(stackOfVariables.length <= 1)
      // if (stackOfVariables.length) {
        // const { value: properties } = stackOfVariables.shift()
        // v.addN(properties)
      // }
      // return v
    // }
    // default: {
      // console.log(`mloadCounter: ${mloadCounter}`)
      // console.log(stackOfVariables)
      // assert(false)
      // break
    // }
  // }
  /// Find second position of mload
  // let mloadCounter = 0
  // for (let i = 0; i < stackOfVariables.length; i++) {
    // const { type } = stackOfVariables[i]
    // if (type == 'MLOAD') mloadCounter ++
    // if (mloadCounter == 2) {
      // break
    // }
  // }

}
module.exports = toLocalVariable
