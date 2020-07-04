const assert = require('assert')
const { toPairs } = require('lodash')
const Tree = require('../tree')
const { formatSymbol, findSymbols } = require('../../shared')

class Integer {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
    this.fragments = this.findOperands()
  }

  findOperands() {
    const stack = [this.ast]
    const operators = ['--', '-=', '-', '++', '+=', '+', '*', '*=', '/', '/=', '**']
    const fragments = {}
    while (stack.length) {
      const item = stack.pop()
      const children = item.children || []
      if (item.attributes && item.attributes.contractKind == 'library') {
        continue
      }
      const operator = item.attributes ? item.attributes.operator || '' : ''
      if (operators.includes(operator)) {
        const [s, l] = item.src.split(':').map(x => parseInt(x))
        const frag = { range: [s, s + l], operands: [], operator }
        item.children.forEach(({ src, attributes }) => {
          const { type } = attributes
          const [s, l] = src.split(':').map(x => parseInt(x))
          frag.operands.push({ type, range: [s, s + l]})
        })
        fragments[`${s}:${l}`] = frag
      }
      children.forEach(c => stack.push(c))
    }
    return fragments
  }

  scan(bug) {
    const { mem: { calls }, endPoints } = this.cache
    const tree = new Tree(this.cache, bug)
    let ctrees = 0
    let ntrees = calls.reduce((prev, call) => {
      return prev + toPairs(call).length
    }, 0)
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        process.send && process.send({ bug: { ctrees, ntrees }})
        tree.build(endPointIdx, epIdx, value)
        ctrees ++
      })
    })
    tree.root.prettify()
    const targets = ['ADD', 'SUB', 'MUL', 'EXP', 'DIV']
    const dnodes = tree.root.traverse(({ node: { me } }) => {
      const sy = formatSymbol(me)
      for (let i = 0; i < targets.length; i++) {
        if (sy.includes(`${targets[i]}(`)) return true
      }
      return false
    })
    dnodes.forEach(dnode => {
      const { node: { me, endPointIdx } } = dnode
      const nodes = findSymbols(me, ([_, name]) => targets.includes(name))
      nodes.forEach(node => {
        const epIdx = node[4][1].toNumber() - 1
        const endPoint = endPoints[endPointIdx]
        const { pc, opcode } = endPoint.get(epIdx)
        const { s, l } = this.srcmap.toSL(pc)
        const id = `${s}:${l}`
        if (this.fragments[id]) {
          this.fragments[id].selected = true
        }
      })
    })
    const fragments = Object.values(this.fragments)
      .filter(({ selected }) => selected)
    return fragments
  }
} 

module.exports = Integer 
