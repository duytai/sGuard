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
      const storeValue = trace[3]
      const root = `s_${storeValue[1].toString(16)}`
      return new Variable([root])
    }
    const properties = []
    const stack = [loc]
    while (stack.length > 0) {
      const loc = stack.pop()
      assert(loc[1] == 'ADD')
      const operands = loc.slice(2)
      const shaIdx = findIndex(operands, ([type, name]) => name == 'SHA3')
      const constIdx = findIndex(operands, ([type]) => type == 'const')
      if (constIdx == 1) {
        const [offset, base] = operands
        const root = `s_${base[1].toString(16)}`
        const members = reverse([...properties, offset]).map(prop => {
          if (isConst(prop)) return prop[1].toString(16)
          return '*'
        })
        return new Variable([root, ...members])
      }
      if (shaIdx >= 0) {
        const base = operands[shaIdx]
        const offset = operands[1 - shaIdx]
        const root = this.toVariable(base, traces)
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

module.exports = Storage
