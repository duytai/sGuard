const assert = require('assert')
const { toPairs } = require('lodash')
const Tree = require('../tree')
const { 
  formatWithoutTrace: formatSymbol,
  firstMeet,
  findFunctions,
} = require('../../shared')

class Reentrancy {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  scan(bug) {
    bug.cvuls ++
    process.send && process.send({ bug })
    const selectors = new Set()
    const checkPoints = {}
    const { mem: { calls }, endPoints } = this.cache
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        const endPoint = endPoints[endPointIdx]
        if (parseInt(epIdx) + 1 >= endPoint.size()) return
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
            const reg = /EQ\([0-f]{7,8},/
            return reg.test(formatSymbol(me))
          })
          dnodes.forEach(({ node: { me } }) => {
            let selector = me[2][1].toString(16)
            while (selector.length < 8) selector = `0${selector}`
            selectors.add(selector)
          })
          /* Dont need to lock tuple */
          // const callSymbol = formatSymbol(stack.get(stack.size() - 1))
          // let newS = s
          // const seps = [';', '{', '}']
          // while (!seps.includes(this.srcmap.source[newS - 1])) newS--;
          // const indents = [' ', '\t', '\n']
          // while (indents.includes(this.srcmap.source[newS])) newS ++;
          // let newL = s - newS + l
          // while (!seps.includes(this.srcmap.source[newS + newL])) newL ++;
          // checkPoints[pc + callSymbol] = {
            // pc,
            // operands: {
              // range: [newS, newS + newL],
              // operands: [],
              // operator: 'lock:tuple'
            // },
          // }
        }
      })
    })
    let locks = []
    // lock:tuple
    for (const t in checkPoints) {
      const { operands, pc } = checkPoints[t]
      locks = locks.concat(operands)
    }
    // lock:function
    const funcs = findFunctions(this.srcmap, this.ast, [...selectors])
    return toPairs([...locks, ...funcs])
  }
} 

module.exports = Reentrancy
