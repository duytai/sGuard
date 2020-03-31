const assert = require('assert')
const jp = require('jsonpath')
const { toPairs, isEmpty } = require('lodash')
const Tree = require('./tree')
const {
  prettify,
  formatWithoutTrace,
  formatSymbol,
  findSymbols,
  logger,
} = require('../shared')

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
    tree.root.prettify(0, this.srcmap)
    /// Find SUB
    const subNodes = tree.root.traverse(({ node: { me } }) => formatSymbol(me).includes('SUB('))
    subNodes.forEach(subNode => {
      const { node: { me } } = subNode 
      const subs = findSymbols(me, ([_, name]) => name == 'SUB') 
      const trace = {} 
      subs.forEach(sub => {
        const [left, right] = sub.slice(2)
        const subExpression = [left, right].map(formatWithoutTrace).join(':')
        trace[subExpression] = true
      })
      const comNodes = subNode.traverse(({ node: { me } }) => {
        const f = formatSymbol(me) 
        return f.includes('LT(') || f.includes('GT(')
      })
      comNodes.forEach(comNode => {
        let { node: { me } } = comNode 
        const orders = [0, 1]
        while (me[1] != 'LT' && me[1] != 'GT') {
          assert(me[1] == 'ISZERO')
          me = me[2]
          orders.reverse()
        }
        if (me[1] == 'LT') orders.reverse()
        const [left, right] = orders.map(order => me[order + 2])
        const ltExpression = [left, right].map(formatWithoutTrace).join(':')
        delete trace[ltExpression]
      })
      if (isEmpty(trace)) {
        logger.info('CHECKED')
      } else {
        logger.info('UNCHECKED')
      }
    })
  }
}

module.exports = Integer
