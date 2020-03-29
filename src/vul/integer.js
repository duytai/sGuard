const assert = require('assert')
const jp = require('jsonpath')
const { toPairs } = require('lodash')
const { prettify, formatSymbol, lookBack, logger, gb } = require('../shared')
const { StateVariable } = require('../variable')
const Tree = require('./tree')

class Integer {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
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
    const candidates = new Set() 
    const nodeStack = [tree.root]
    while (nodeStack.length > 0) {
      const node = nodeStack.pop()
      const { node: { me, childs, pc, endPointIdx, epIdx } } = node
      if (formatSymbol(me).includes('SUB')) {
        candidates.add(pc)
      }
      childs.forEach(child => nodeStack.push(child))
    }
    /// Map to source 
    candidates.forEach(pc => {
      const { s, l } = this.srcmap.toSL(pc)
      const key = [s,l,0].join(':')
      const response = jp.query(this.ast, `$..children[?(@.src=="${key}")]`)
      assert(response.length >= 1)
      const astStack = [response[0]]
      const underflowCheck = []
      while (astStack.length > 0) {
        const astNode = astStack.pop()
        const { attributes, children } = astNode
        if (attributes && attributes.operator) {
          if (attributes.operator.startsWith('-')) {
            assert(children.length == 2)
            const operands = []
            children.forEach(({ src }) => {
              const [s, l] = src.split(':').map(x => parseInt(x))
              const operand = this.srcmap.source.slice(s, s + l)
              operands.push(operand)
            })
            underflowCheck.push(operands.join(' >= '))
          }
        }
        (astNode.children || []).forEach(child => {
          astStack.push(child)
        })
      }
      const { source } = this.srcmap
      const splitAt = lookBack(source, s)
      const startAt = lookBack(source, splitAt - 1)
      const first = source.slice(0, splitAt)
      const last = source.slice(splitAt)
      const check = `require(${underflowCheck.join('&&')})`
      const existingCheck = source.slice(startAt, splitAt - 1).trim()
      console.log(existingCheck)
      if (check == existingCheck) {
        logger.info(`${gb('SUB')} is checked at ${gb(existingCheck)}`)
      }

      // console.log(first)
      // console.log('---')
      // console.log(last)
    })
    tree.root.prettify(0, this.srcmap)
  }
}

module.exports = Integer
