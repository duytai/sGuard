const BN = require('bn.js')
const assert = require('assert')
const chalk = require('chalk')
const { reverse, findIndex } = require('lodash')
const Variable = require('./variable')
const { isConst, prettify } = require('../shared')

class Storage {
  constructor(sload, traces) {
    assert(sload[1] == 'SLOAD')
    const variable = this.toVariable(sload, traces)
    console.log(chalk.green(variable.toString()))
  }

  shaToVariableName(sha, traces) {
    const [loc, size, stackLen] = sha[2].slice(2)
    const trace = traces[stackLen[1].toNumber() - 1]
    const storeValue = trace[3]
    return `s_${storeValue[1].toString(16)}`
  }

  findMatches(traces) {
    const sstores = traces.filter(([type, name]) => name == 'SSTORE')
    sstores.forEach(sstore => {
      const variable = this.toVariable(sstore, traces)
      console.log(`>> ${variable.toString()}`)
    })
  }

  toVariable(expression, traces) {
    const properties = []
    const mainStack = [expression]
    while (mainStack.length > 0) {
      const expression = mainStack.pop()
      switch (expression[1]) {
        case 'SSTORE':
        case 'SLOAD': {
          const [loc, size, stackLen] = expression.slice(2)
          if (isConst(loc)) {
            const root = `s_${loc[1].toString(16)}`
            return new Variable([root])
          }
          mainStack.push(loc)
          break
        }
        case 'ADD': {
          const operands = expression.slice(2, 4)
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
            const root = this.shaToVariableName(base, traces) 
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
            mainStack.push(base)
          }
          break
        }
        default: {
          assert(false)
        }
      }
    }
  }
}

module.exports = Storage
