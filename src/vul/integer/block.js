const assert = require('assert')
const { toPairs } = require('lodash')
const { 
  formatWithoutTrace: formatSymbol,
  findSymbols,
  findOperands
} = require('../../shared')
const Tree = require('../tree')

class Block {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  scan(tree) {
    const ret = []
    const timestamps = tree.root.traverse(({ node: { me } }) => formatSymbol(me).includes('TIMESTAMP'))
    const numbers = tree.root.traverse(({ node: { me } }) => formatSymbol(me).includes('NUMBER'))
    if (timestamps.length) {
      ret.push({ range: [0, 0], operands: [], operator: 'timestamp' })
    }
    if (numbers.length) {
      ret.push({ range: [0, 0], operands: [], operator: 'number' })
    }
    return toPairs(ret)
  }
} 

module.exports = Block 
