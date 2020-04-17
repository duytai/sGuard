const assert = require('assert')
const { toPairs } = require('lodash')
const Tree = require('./tree')

class Reentrancy {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  generateCheckPoints() {
    const checkPoints = {}
    const { mem: { calls }, endPoints } = this.cache
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        const endPoint = endPoints[endPointIdx]
        const { stack, pc } = endPoint.get(parseInt(epIdx) + 1)
        let sstore = false
        for (let i = parseInt(epIdx); i < endPoint.size(); i++) {
          const { opcode: { name } } = endPoint.get(i)
          if (name == 'SSTORE') {
            sstore = true
            break
          }
        }
        if (sstore) {
          const { s, l } = this.srcmap.toSL(pc)
          checkPoints[pc] = {
            pc,
            operands: {
              range: [s, s + l],
              operands: [],
              operator: 'reentrancy'
            },
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

module.exports = Reentrancy
