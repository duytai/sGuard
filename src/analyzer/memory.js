const assert = require('assert')
const BN = require('bn.js')
const { findIndex, reverse } = require('lodash')
const { prettify, isConst } = require('../shared')
const Variable = require('./variable')

class Memory {
  constructor(mload) {
    assert(mload[1] == 'MLOAD')
    const variable = this.toVariable(mload)
    console.log(`>> ${variable.toString()}`)
  }

  toVariable(expression) {
    const properties = []
    const mainStack = [expression]
    while (mainStack.length > 0) {
      const expression = mainStack.pop()
      switch (expression[1]) {
        case 'MLOAD': {
          const [loc, size, stackLen] = expression.slice(2)
          if (isConst(loc)) {
            assert(loc[1].toNumber() == 0x40)
            const root = `variable_${stackLen[1].toString(16)}`
            const members = reverse(properties).map(prop => {
              if (isConst(prop)) return prop[1].toString(16)
              return '*'
            })
            return new Variable([root, ...members])
          } else {
            const [property, base] = loc.slice(2)
            mainStack.push(base)
            properties.push(property)
          }
          break
        }
        case 'MSTORE': {
          const [loc] = expression.slice(2)
          if (isConst(loc)) {
            const root = `variable_${loc[1].toString(16)}`
            return new Variable([root])
          }
          mainStack.push(loc)
          break
        }
        case 'ADD': {
          const [left, right] = expression.slice(2)
          properties.push(left)
          mainStack.push(right)
          break
        }
        default: {
          assert(false)
        }
      }
    }
  }

  findMatches(traces) {
    const mstores = traces.filter(trace => ([type, name]) => name == 'MSTORE')
    mstores.forEach(mstore => {
      const variable = this.toVariable(mstore)
      console.log(`>> ${variable.toString()}`)
    })
  }
}

module.exports = Memory
