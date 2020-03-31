const assert = require('assert')
const jp = require('jsonpath')
const { toPairs, isEmpty, range } = require('lodash')
const Tree = require('./tree')
const {
  prettify,
  formatWithoutTrace,
  formatSymbol,
  findSymbols,
  logger,
  insertLoc,
  gb,
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

  fixSubtract(tree, endPoints) {
    /// Find SUB
    const operandLocs = {}
    const subNodes = tree.root.traverse(({ node: { me } }) => formatSymbol(me).includes('SUB('))
    subNodes.forEach(subNode => {
      const { node: { me, endPointIdx } } = subNode 
      const subs = findSymbols(me, ([_, name]) => name == 'SUB') 
      const trace = {} 
      subs.forEach(sub => {
        const [left, right, epSize] = sub.slice(2)
        const subExpression = [left, right].map(formatWithoutTrace).join(':')
        const epIdx = epSize[1].toNumber() - 1
        const endPoint = endPoints[endPointIdx]
        const { pc, opcode } = endPoint.get(epIdx)
        assert(opcode.name == 'SUB')
        trace[subExpression] = { pc, operands: this.extractOperands(pc) }
      })
      /// Search for comparison node 
      const comNodes = subNode.traverse(({ node: { me } }) => {
        const f = formatSymbol(me) 
        return f.includes('LT(') || f.includes('GT(')
      })
      /// Verify comparison
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
        for (const t in trace) {
          const { operands, pc } = trace[t]
          operandLocs[pc] = operands 
        }
      }
    })
    /// Try to fix
    const bugFixes = []
    for (const pc in operandLocs) {
      const { s } = this.srcmap.toSL(pc)
      const { newlines, spaces, tabs, start } = insertLoc(this.srcmap.source, s)
      let check = ''
      range(spaces).forEach(_ => check += ' ')
      range(tabs).forEach(_ => check += '\t')
      check += `require(${operandLocs[pc].join(' >= ')});\n`
      bugFixes.push({ start, check, len: check.length })
    }
    return bugFixes 
  }

  scan() {
    const { mem: { calls }, endPoints } = this.cache
    const tree = new Tree(this.cache)
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        tree.build(endPointIdx, epIdx, value)
      })
    })
    const bugFixes = this.fixSubtract(tree, endPoints)
    return bugFixes
  }
}

module.exports = Integer
