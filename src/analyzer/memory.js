const assert = require('assert')
const BN = require('bn.js')
const { findIndex, reverse } = require('lodash')
const { prettify, isConst, isConstWithValue } = require('../shared')
const Variable = require('./variable')
/*
 * Normal memory location:
 *  - const
 *  - ADD
 * Load parameters
 *  - SUB
 * */

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
      switch (loc[1]) {
        case 'ADD': {
          const operands = loc.slice(2)
          const constIdx = findIndex(operands, ([type]) => type == 'const')
          const mloadIdx = findIndex(operands, ([type, name]) => name == 'MLOAD')
          const addIndex = findIndex(operands, ([type, name]) => name == 'ADD')
          const subIndex = findIndex(operands, ([type, name]) => name == 'SUB')
          if (mloadIdx >= 0) {
            const base = operands[mloadIdx]
            const offset = operands[1 - mloadIdx]
            const members = reverse([...properties, offset])
            return new Variable(members, this.toVariable(base))
          } 
          if (constIdx == 1) {
            const [offset, base] = operands
            const root = `m_${base[1].toString(16)}`
            const members = reverse([...properties, offset])
            return new Variable([root, ...members])
          }
          assert(addIndex != -1 || subIndex != -1)
          if (addIndex != -1) {
            const base = operands[addIndex]
            const offset = operands[1 - addIndex]
            properties.push(offset)
            stack.push(base)
          }
          if (subIndex != -1) {
            const base = operands[subIndex]
            const offset = operands[1 - subIndex]
            properties.push(offset)
            stack.push(base)
          }
          break
        }
        case 'SUB': {
          const operands = loc.slice(2)
          const addIndex = findIndex(operands, ([type, name]) => name == 'ADD')
          assert(addIndex != -1)
          const base = operands[addIndex]
          stack.push(base)
          break
        }
        default: {
          assert(false, `loc is ${loc[1]}`)
        }
      }
    }
  }
}

module.exports = Memory
