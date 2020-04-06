const assert = require('assert')
const { toPairs } = require('lodash')
const { 
  formatWithoutTrace: formatSymbol,
  findSymbols,
  findOperands
} = require('../shared')
const Tree = require('./tree')
const Subtract = require('./subtract')
const Addition = require('./addition')

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
    const subtract = new Subtract(this.cache, this.srcmap, this.ast)
    const addition = new Addition(this.cache, this.srcmap, this.ast)
    return [
      ...subtract.scan(tree),
      ...addition.scan(tree),
    ]
  }
} 

module.exports = Integer 
