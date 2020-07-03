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

  findFunctions() {
    const stack = [this.ast]
    const fragments = {}
    while (stack.length) {
      const item = stack.pop()
      if (item.name == 'FunctionDefinition') {
        const { constant, functionSelector } = item.attributes
        if (!constant) {
          const [s, l] = item.src.split(':').map(x => parseInt(x))
          const code = this.srcmap.source.slice(s, s + l)
          const open = code.split('{')[0].split(')')[0]
          const frag = {
            range: [s, s + open.length + 1],
            operands: [],
            operator: 'lock:function',
          }
          fragments[functionSelector] = frag
        }
      }
      const children = item.children || []
      children.forEach(c => stack.push(c))
    }
    return fragments
  } 

  scan() {
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
        }
      })
    })
    const ret = []
    const funcs = this.findFunctions()
    for (let sel of selectors.values()) {
      funcs[sel] && ret.push(funcs[sel])
    }
    return ret
  }
} 

module.exports = Reentrancy
