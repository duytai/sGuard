const assert = require('assert')
const { toPairs } = require('lodash')
const Tree = require('../tree')
const { formatSymbol, firstMeet, findFunctions } = require('../../shared')

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
          const tree = new Tree(this.cache)
          tree.build(endPointIdx, epIdx, value)
          const dnodes = firstMeet(tree.root, ({ node: { me } }) => {
            const reg = /EQ\([0-f]{8},SHR\(e0,CALLDATALOAD\(0,20\)\)\)/
            return reg.test(formatSymbol(me))
          })
          const selectors = new Set()
          dnodes.forEach(({ node: { me } }) => {
            const [selector] = me.slice(2)
            selectors.add(selector[1].toString(16))
          })
          if (selectors.size) {
            const operands = findFunctions(this.srcmap, this.ast, [...selectors])
            if (!checkPoints[pc]) {
              checkPoints[pc] = {
                pc,
                operands: {
                  range: [s, s + l],
                  operands,
                  operator: 'reentrancy'
                },
              }
            } else {
              const curOperands = checkPoints[pc].operands.operands
              operands.forEach(operand => {
                const found = curOperands.find(c => c.range.join(':') == operand.range.join(':'))
                if (!found) {
                  curOperands.push(operand)
                }
              })
            }
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
