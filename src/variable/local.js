const assert = require('assert')
const { reverse, findIndex } = require('lodash')
const Variable = require('./variable')
const {
  prettify,
  isConst,
  isConstWithValue,
  isMload,
} = require('../shared')

const sumAll = (constSymbols) => constSymbols.reduce((r, n) => r + n[1].toNumber(), 0) 

const toLocalVariables = (t, trace, trackingPos, epIdx) => {
  if (isConst(t)) return [new Variable(`m_${t[1].toString(16)}`)]

  const variables = []
  const baseStack = []
  const mainStack = [t]
  const markerStack = []
  const propStack = []

  while (mainStack.length > 0) {
    const t = mainStack.pop()
    switch (t[1]) {
      case 'MLOAD': {
        const [loc, loadSize, loadTraceSize] = t.slice(2)
        markerStack.push({
          baseIdx: baseStack.length,
          propIdx: propStack.length,
          loadTraceSize,
        })
        if (isConst(t[2])) {
          baseStack.push(t[2])
        } else {
          mainStack.push(t[2])
        }
        break
      }
      case 'MUL': {
        propStack.push({ symbol: t, trackingPos, epIdx })
        break
      }
      case 'ADD': {
        const params = t.slice(2)
        const constIndex = findIndex(params, (param) => isConst(param))
        assert(constIndex != -1)
        baseStack.push(params[constIndex])
        mainStack.push(params[1 - constIndex])
        break
      }
      default: {
        assert(false, `dont know ${name}`)
      }
    }
  }
  while (markerStack.length > 0) {
    const { baseIdx, propIdx, loadTraceSize } = markerStack.pop()
    const bases = baseStack.splice(baseIdx) 
    const props = propStack.splice(propIdx) 
    /// Find values of MLOAD(bases)
    const loadVariable = new Variable(`m_${sumAll(bases).toString(16)}`)
    const subTrace = trace.sub(loadTraceSize[1].toNumber())
    const temp = []
    subTrace.eachLocalVariable((opts) => {
      const { variable: storeVariable, value: storedValue } = opts
      if (storeVariable.exactEqual(loadVariable) || storeVariable.partialEqual(loadVariable)) {
        temp.push({ storedValue, storeVariable })
      }
    })
    assert(temp.length > 0)
    /// TODO: handle more storedValues
    baseStack.push(temp[0].storedValue)
    variables.push(temp[0].storeVariable)
  }
  const v = new Variable(`m_${sumAll(baseStack).toString(16)}`) 
  !!propStack.length && v.addN(propStack)
  variables.push(v)

  assert(variables.length > 0)
  return variables
}
module.exports = toLocalVariables
