const assert = require('assert')
const { toPairs } = require('lodash')
const { 
  formatWithoutTrace: formatSymbol,
  findSymbols,
} = require('../shared')
const Tree = require('./tree')

class Disorder {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  generateCheckPoints() {
    const checkPoints = {}
    const { mem: { calls }, endPoints } = this.cache
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx]) => {
        const endPoint = endPoints[endPointIdx]
        const { stack, pc } = endPoint.get(parseInt(epIdx) + 1)
        const callSymbol = formatSymbol(stack.get(stack.size() - 1))
        const opcodes = []
        for (let i = parseInt(epIdx); i < endPoint.size(); i++) {
          const { pc, stack, opcode: { name } } = endPoint.get(i)
          if (stack.size() == 0) continue
          const symbol = formatSymbol(stack.get(stack.size() - 1))
          if (symbol == callSymbol) opcodes.push(name)
        }
        switch (opcodes.join(':')) {
          case 'SWAP:POP': {
            const { s, l } = this.srcmap.toSL(pc)
            checkPoints[pc + callSymbol] = {
              pc,
              operands: {
                range: [s, s + l],
                operands: [],
                operator: 'single:disorder'
              },
            }
            break
          }
          case 'SWAP:RETURNDATASIZE:POP': {
            const { s, l } = this.srcmap.toSL(pc)
            checkPoints[pc + callSymbol] = {
              pc,
              operands: {
                range: [s, s + l],
                operands: [],
                operator: 'double:disorder'
              },
            }
            break
          }
        }
      })
    })
    return checkPoints
  }

  findUncheckOperands() {
    const uncheckOperands = {}
    const checkPoints = this.generateCheckPoints()
    for (const t in checkPoints) {
      const { operands, pc } = checkPoints[t]
      uncheckOperands[pc] = operands
    }
    return uncheckOperands
  }

  scan() {
    const uncheckOperands = this.findUncheckOperands()
    return toPairs(uncheckOperands)
  }
}

module.exports = Disorder
