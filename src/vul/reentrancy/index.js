const assert = require('assert')
const { toPairs } = require('lodash')
const Tree = require('../tree')
const { 
  formatSymbol,
  findFunctions,
} = require('../../shared')

class Reentrancy {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  firstMeet(dnode, cond) {
    assert(dnode && cond)
    if (cond(dnode)) return [dnode]
    return dnode.node
      .childs
      .reduce((all, next) => [...all, ...this.firstMeet(next, cond)], [])
  }

  findFunctions() {
    const stack = [this.ast]
    const fragments = {}
    while (stack.length) {
      const item = stack.pop()
      if (item.name == 'FunctionDefinition') {
        const { stateMutability, functionSelector } = item.attributes
        if (['payable', 'nonpayable'].includes(stateMutability)) {
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
    let ctrees = 0
    let ntrees = calls.reduce((prev, call) => {
      return prev + toPairs(call).length
    }, 0)
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        process.send && process.send({ bug: { ctrees, ntrees }})
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
          const dnodes = this.firstMeet(tree.root, ({ node: { me } }) => {
            const eqReg = /EQ\([0-f]{7,8},/
            const sym = formatSymbol(me)
            return eqReg.test(sym) || sym == 'LT(CALLDATASIZE,4)' 
          })
          dnodes.forEach(({ node: { me } }) => {
            if (me[1] == 'EQ') {
              let selector = me[2][1].toString(16)
              while (selector.length < 8) selector = `0${selector}`
              selectors.add(selector)
              return
            }
            selectors.add('fallback')
          })
        }
        ctrees ++
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
