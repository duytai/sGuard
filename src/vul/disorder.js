const assert = require('assert')
const { toPairs } = require('lodash')
const { 
  formatWithoutTrace: formatSymbol,
  findSymbols,
  findOperands
} = require('../shared')
const Tree = require('./tree')

class Disorder {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  scan() {
    const checkPoints = {}
    const { mem: { calls }, endPoints } = this.cache
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx]) => {
        const endPoint = endPoints[endPointIdx]
        const { stack } = endPoint.get(parseInt(epIdx) + 1)
        const callSymbol = formatSymbol(stack.get(stack.size() - 1))
        const opcodes = []
        for (let i = parseInt(epIdx); i < endPoint.size(); i++) {
          const { pc, stack, opcode: { name } } = endPoint.get(i)
          const symbol = formatSymbol(stack.get(stack.size() - 1))
          if (symbol == callSymbol) {
            opcodes.push(name)
          }
        }
        switch (opcodes.join(':')) {
          case 'SWAP:POP': {
            break
          }
          case 'SWAP:RETURNDATASIZE:POP': {
            break
          }
        }
      })
    })
    return []
  }
}

module.exports = Disorder
