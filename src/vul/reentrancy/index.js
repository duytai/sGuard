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
            const reg = /EQ\([0-f]{7,8},/
            return reg.test(formatSymbol(me))
          })
          dnodes.forEach(({ node: { me } }) => {
            let selector = me[2][1].toString(16)
            while (selector.length < 8) selector = `0${selector}`
            selectors.add(selector)
          })
          const callSymbol = formatSymbol(stack.get(stack.size() - 1))
          let newS = s
          const seps = [';', '{']
          while (!seps.includes(this.srcmap.source[newS - 1])) newS--; 
          const indents = [' ', '\t', '\n']
          while (indents.includes(this.srcmap.source[newS])) newS ++;
          checkPoints[pc + callSymbol] = {
            pc,
            operands: {
              range: [newS, s + l],
              operands: [],
              operator: 'lock:tuple'
            },
          }
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
