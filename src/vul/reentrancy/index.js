const assert = require('assert')
const { toPairs } = require('lodash')
const Tree = require('../tree')
const { 
  formatSymbol,
  firstMeet,
  findFunctions,
} = require('../../shared')

class Reentrancy {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  scan() {
    const selectors = new Set()
    const { mem: { calls }, endPoints } = this.cache
    const unlocks = []
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
          unlocks.push({ range: [s, s + l], operands: [], operator: 'unlock' })
        }
      })
    })
    const locks = findFunctions(this.srcmap, this.ast, [...selectors])
    return toPairs([...locks, ...unlocks])
  }
} 

module.exports = Reentrancy
