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

class LocalVariableConversion {
  constructor(t, ep) {
    this.variables = this.convert(t, ep)
  }

  getVariables() {
    return this.variables
  }

  findArraySize(ep) {
    const { stack } = ep.find(({ opcode: { name }}) => name == 'JUMPI')
    const cond = stack.get(stack.size() - 2)
    const [_, name, left, right] = cond
    assert(name == 'LT')
    assert(isConst(right))
    return right[1].toNumber()
  }

  convert(t, ep) {
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
          const [loc, loadSize, _, epSize] = t.slice(2)
          markerStack.push({
            pointerIdx: pointerStack.length,
            propIdx: propStack.length,
            epSize,
          })
          mainStack.push(loc)
          break
        }
        case 'ADD': {
          const operands = t.slice(2)
          assert(operands[0][1] == 'MUL')
          propStack.push(operands[0])
          mainStack.push(operands[1])
          break
        }
        default: {
          assert(false, `dont know ${t[1]}`)
        }
      }
    }

    while (markerStack.length > 0) {
      const { pointerIdx, propIdx, epSize } = markerStack.pop() 
      const [pointer] = pointerStack.splice(pointerIdx)
      const [prop] = propStack.splice(propIdx)
      const subEp = ep.sub(epSize[1].toNumber())
      assert(pointer && prop)
      const storedValue = subEp.trace.memValueAt(pointer)
      /// Find array size to detect possible overlap with previous data segment 
      const arraySize = this.findArraySize(subEp)
      console.log(`s: ${arraySize}`)
      assert(false)
    }
    return []
  }
}

module.exports = LocalVariableConversion 
