const assert = require('assert')
const BN = require('bn.js')
const { findIndex, reverse } = require('lodash')
const { prettify, isConst, isConstWithValue } = require('../shared')
const Variable = require('./variable')

const Memory = {
  toVariable(loc) {
    if (isConst(loc))
      return new Variable([`m_${loc[1].toString(16)}`])
    if (loc[1] == 'MLOAD') {
      const [base, loadSize, traceSize] = loc.slice(2)
      if (isConstWithValue(base, 0x40))
        return this.toVariable(traceSize)
      return this.toVariable(base)
    }
    const properties = []
    const stack = [loc]
    while (stack.length > 0) {
      const loc = stack.pop()
      assert(loc[1] == 'ADD')
      const operands = loc.slice(2)
      const constIdx = findIndex(operands, ([type]) => type == 'const')
      const mloadIdx = findIndex(operands, ([type, name]) => name == 'MLOAD')
      if (constIdx == 1) {
        const [offset, base] = operands
        const root = `m_${base[1].toString(16)}`
        const members = reverse([...properties, offset]).map(prop => {
          if (isConst(prop)) return prop[1].toString(16)
          return '*'
        })
        return new Variable([root, ...members])
      }
      if (mloadIdx >= 0) {
        const base = operands[mloadIdx]
        const offset = operands[1 - mloadIdx]
        const variable = this.toVariable(base)
        const root = variable.toString() 
        const members = reverse([...properties, offset]).map(prop => {
          if (isConst(prop)) return prop[1].toString(16)
          return '*'
        })
        return new Variable([root, ...members])
      } else {
        assert(constIdx != -1)
        const base = operands[1 - constIdx]
        const offset = operands[constIdx]
        properties.push(offset)
        stack.push(base)
      }
    }
  }
}

module.exports = Memory
