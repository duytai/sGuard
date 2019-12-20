const { findIndex, reverse } = require('lodash')
const assert = require('assert')
const BN = require('bn.js')
const { prettify, isConst } = require('../shared')

class Variable {
  constructor(members) {
    this.members = members
  }

  toString() {
    return this.members.join('.')
  }
}

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
          const [offset, size, stackLen] = expression.slice(2)
          if (isConst(offset)) {
            assert(offset[1].toNumber() == 0x40)
            const root = `variable_${stackLen[1].toString(16)}`
            const members = reverse(properties).map(prop => {
              if (isConst(prop)) return prop[1].toString(16)
              return '*'
            })
            return new Variable([root, ...members])
          } else {
            const [property, nestedMload] = offset.slice(2)
            mainStack.push(nestedMload)
            properties.push(property)
          }
          break
        }
        case 'MSTORE': {
          const [offset] = expression.slice(2)
          if (isConst(offset)) {
            const root = `variable_${offset[1].toString(16)}`
            return new Variable([root])
          }
          mainStack.push(offset)
          break
        }
        case 'ADD': {
          const [left, right] = expression.slice(2)
          assert(isConst(left))
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
