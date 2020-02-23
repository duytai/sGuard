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

const toLocalVariables = (t, trace) => {
  if (isConst(t)) return [new Variable(`m_${t[1].toString(16)}`)]

  const mainStack = [t]
  const pointerStack = []
  const propStack = []
  const markerStack = []

  while (mainStack.length > 0) {
    const t = mainStack.pop()
    if (isConst(t)) {
      pointerStack.push(t)
      continue
    }
    switch(t[1]) {
      case 'MLOAD': {
        const [loc, loadSize, loadTraceSize] = t.slice(2)
        markerStack.push({
          baseIdx: pointerStack.length,
          propIdx: propStack.length,
          loadTraceSize,
        })
        mainStack.push(loc)
        break
      }
      case 'MUL': {
        propStack.push(t)
        break
      }
      case 'ADD': {
        const operands = t.slice(2)
        mainStack.push(operands[0])
        mainStack.push(operands[1])
        break
      }
      default: {
        assert(false, `dont know ${t[1]}`)
      }
    }
  }

  while (markerStack.length > 0) {
    const { baseIdx, propIdx, loadTraceSize } = markerStack.pop() 
    const pointers = pointerStack.splice(baseIdx)
    const props = propStack.splice(propIdx)
    assert(pointers.length == 1)
    const pointer = pointers[0]
    const subTrace = trace.sub(loadTraceSize[1].toNumber())
    const storedValue = subTrace.memValueAt(pointer)
    assert(storedValue)
    /// Have to find boundary of props
    console.log('--BOUNDARY--')
    prettify(props)
    // assert(false)
  }

  return []
}

module.exports = toLocalVariables
