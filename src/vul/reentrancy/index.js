const assert = require('assert')
const { toPairs } = require('lodash')
const Tree = require('../tree')
const { 
  formatWithoutTrace: formatSymbol,
  firstMeet,
  findFunctions,
  findReturnType,
} = require('../../shared')

class Reentrancy {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  scan() {
    const selectors = new Set()
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
          dnodes.forEach(({ node: { me } }) => {
            const [selector] = me.slice(2)
            selectors.add(selector[1].toString(16))
          })
          const resultType = findReturnType(pc, this.srcmap, this.ast)
          if (resultType.startsWith('tuple(')) {
            const callSymbol = formatSymbol(stack.get(stack.size() - 1))
            checkPoints[pc + callSymbol] = {
              pc,
              operands: {
                range: [s, s + l],
                operands: [],
                operator: 'lock_tuple'
              },
            }
          }
        }
      })
    })
    const locks = findFunctions(this.srcmap, this.ast, [...selectors])
    return toPairs(locks)
  }
} 

module.exports = Reentrancy
