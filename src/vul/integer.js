const assert = require('assert')
const jp = require('jsonpath')
const { toPairs } = require('lodash')
const { prettify, findSymbols, formatWithoutTrace } = require('../shared')
const Tree = require('./tree')

class Integer {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  extractOperands(pc) {
    const { s, l } = this.srcmap.toSL(pc)
    const key = [s, l, 0].join(':')
    const response = jp.query(this.ast, `$..children[?(@.src=="${key}")]`) 
    assert(response.length >= 1)
    const { children } = response[response.length - 1]
    const operands = []
    children.forEach(({ src }) => {
      const [s, l] = src.split(':').map(x => parseInt(x))
      const operand = this.srcmap.source.slice(s, s + l)
      operands.push(operand)
    })
    return operands
  }

  scan() {
    const { mem: { calls }, endPoints } = this.cache
    const tree = new Tree(this.cache)
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        tree.build(endPointIdx, epIdx, value)
      })
    })
    /// Find SUB
    const nodeStack = [tree.root]
    while (nodeStack.length > 0) {
      const node = nodeStack.pop()
      const { node: { me, childs, pc, endPointIdx } } = node
      const subs = findSymbols(me, ([_, name]) => name == 'SUB')
      const endPoint = endPoints[endPointIdx]
      subs.forEach(sub => {
        const [left, right, epSize] = sub.slice(2)
        console.log('--')
        console.log(formatWithoutTrace(left))
        console.log(formatWithoutTrace(right))
        prettify([left, right])
      })
      /// Find condition 
      childs.forEach(child => nodeStack.push(child))
    }
    /// Map to source 
    tree.root.prettify(0, this.srcmap)
  }
}

module.exports = Integer
