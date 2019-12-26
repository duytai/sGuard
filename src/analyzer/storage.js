const BN = require('bn.js')
const assert = require('assert')
const chalk = require('chalk')
const { reverse, findIndex } = require('lodash')
const Variable = require('./variable')
const { isConst, isConstWithValue, prettify } = require('../shared')

const Storage = {
  toVariable(loc, traces) {
    if (isConst(loc))
      return new Variable([`s_${loc[1].toString(16)}`])
    if (loc[1] == 'SHA3') {
      const [mload] = loc.slice(2)
      const [type, name, base, loadSize, traceSize] = mload
      assert(name, 'MLOAD')
      assert(isConstWithValue(base, 0x00))
      const trace = traces[traceSize[1].toNumber() - 1]
      return this.toVariable(trace[3], traces) 
    }
    const properties = []
    const stack = [loc]
    while (stack.length > 0) {
      const loc = stack.pop()
      assert(loc[1] == 'ADD', `loc is ${loc[1]}`)
      const operands = loc.slice(2)
      const shaIdx = findIndex(operands, ([type, name]) => name == 'SHA3')
      const constIdx = findIndex(operands, ([type]) => type == 'const')
      if (shaIdx >= 0) {
        const base = operands[shaIdx]
        const offset = operands[1 - shaIdx]
        const members = reverse([...properties, offset])
        return new Variable([root, ...members], this.toVariable(base, traces))
      }
      if (constIdx == 1) {
        const [offset, base] = operands
        const root = `s_${base[1].toString(16)}`
        const members = reverse([...properties, offset])
        return new Variable([root, ...members])
      }
      assert(constIdx != -1)
      const base = operands[1 - constIdx]
      const offset = operands[constIdx]
      properties.push(offset)
      stack.push(base)
    }
  }
}

module.exports = Storage
