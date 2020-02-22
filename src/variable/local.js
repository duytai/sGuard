const assert = require('assert')
const BN = require('bn.js')
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
    if (isConst(t)) {
      baseStack.push(t)
      continue
    }
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
      /// ADD(A, B)
      /// A = ADD/MUL => mainStack
      /// B = const/MLOAD => mainStack 
      /// However B must be calculated before A
      case 'ADD': {
        const params = t.slice(2)
        mainStack.push(params[1])
        mainStack.push(params[0])
        break
      }
      default: {
        assert(false, `dont know ${t[1]}`)
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
    switch (temp.length) {
      case 0: {
        /// access to unknown memory address 
        baseStack.push(['const', new BN(0)])
        break
      }
      default: {
        /// TODO: handle more storedValues
        baseStack.push(temp[0].storedValue)
        variables.push(temp[0].storeVariable)
        break
      }
    }
  }
  const v = new Variable(`m_${sumAll(baseStack).toString(16)}`) 
  !!propStack.length && v.addN(propStack)
  variables.push(v)

  assert(variables.length > 0)
  return variables
}
module.exports = toLocalVariables
