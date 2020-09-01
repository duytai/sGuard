const assert = require('assert')
const { 
  formatSymbol,
  findFunctions,
} = require('../../shared')

class Reentrancy {
  constructor(srcmap, ast) {
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
        const { stateMutability, functionSelector, implemented } = item.attributes
        if (['payable', 'nonpayable'].includes(stateMutability) && implemented) {
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

  scan(tree, endPoints) {
    const selectors = new Set()
    const checkPoints = {}
    const targets = ['ADD', 'SUB', 'MUL', 'EXP', 'DIV']
    tree.root.node.childs.forEach(call => {
      const dnodes = call.traverse(({ node: { me } }) => formatSymbol(me).includes('SSTORE'))
      const found = dnodes.find(dnode => {
        if (dnode.node.endPointIdx != call.node.endPointIdx) return false
        if (parseInt(dnode.node.epIdx) < parseInt(call.node.epIdx)) return false
        return true
      })
      if (found) {
        const dnodes = this.firstMeet(call, ({ node: { me } }) => {
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
