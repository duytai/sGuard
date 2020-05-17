const assert = require('assert')
const { toPairs } = require('lodash')
const { 
  formatWithoutTrace: formatSymbol,
  findSymbols,
  findOperands
} = require('../../shared')
const Tree = require('../tree')

class Delegate {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  scan(tree) {
    const calls = tree.root.node.childs
    const found = !!calls.find(({ node: { me } }) => me[1] == 'DELEGATECALL')
    if (!found) return []
    return toPairs([
      { range: [0, 0], operands: [], operator: 'delegate' }
    ])
  }
} 

module.exports = Delegate
