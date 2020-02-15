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
  const bases = []
  const mainStack = [t]
  while (mainStack.length > 0) {
    const t = mainStack.pop()
    const [name, ...params] = t.slice(1)
    switch (name) {
      case 'MLOAD': {
        assert(false, 'Should handle MLOAD here')
      }
      case 'MUL': {
        const v = new Variable(`m_${sumAll(bases).toString(16)}`)
        const prop = { symbol: t, trackingPos, epIdx }
        v.addN([prop])
        variables.push(v)
        break
      }
      case 'ADD': {
        const constIndex = findIndex(params, (param) => isConst(param))
        assert(constIndex != -1)
        const t = params[1 - constIndex] 
        bases.push(params[constIndex])
        mainStack.push(t)
        break
      }
      default: {
        assert(false, `dont know ${name}`)
      }
    }
  }
  assert(variables.length > 0)
  /// TODO: return all variables, not the first member
  return variables
}
module.exports = toLocalVariables
