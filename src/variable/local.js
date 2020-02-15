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
  const markerStack = [{ baseIdx: 0, propIdx: 0 }]
  const propStack = []

  while (mainStack.length > 0) {
    const t = mainStack.pop()
    const [name, ...params] = t.slice(1)
    switch (name) {
      case 'MLOAD': {
        assert(false, 'Should handle MLOAD here')
      }
      case 'MUL': {
        propStack.push({ symbol: t, trackingPos, epIdx })
        break
      }
      case 'ADD': {
        const constIndex = findIndex(params, (param) => isConst(param))
        assert(constIndex != -1)
        const t = params[1 - constIndex] 
        baseStack.push(params[constIndex])
        mainStack.push(t)
        break
      }
      default: {
        assert(false, `dont know ${name}`)
      }
    }
  }

  while (markerStack.length > 0) {
    const { baseIdx, propIdx } = markerStack.pop()
    const bases = baseStack.splice(baseIdx)
    const props = propStack.splice(propIdx)
    const v = new Variable(`m_${sumAll(bases).toString(16)}`) 
    v.addN(props)
    variables.push(v)
  }

  assert(variables.length > 0)
  return variables
}
module.exports = toLocalVariables
