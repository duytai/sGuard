const assert = require('assert')
const { toPairs } = require('lodash')
const { 
  formatWithoutTrace: formatSymbol,
  findSymbols,
  findOperands
} = require('../shared')
const Tree = require('./tree')

class Subtract {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  generateCheckPoints(dnode) {
    assert(dnode)
    const checkPoints = {}
    const { endPoints } = this.cache
    const { node: { me, endPointIdx } } = dnode
    const nodes = findSymbols(me, ([_, name]) => name == 'SUB')
    nodes.forEach(node => {
      const [left, right, epSize] = node.slice(2)
      if (left[1] == 'ISZERO' || right[1] == 'ISZERO') return
      const expression = formatSymbol(node)
      const epIdx = epSize[1].toNumber() - 1
      const endPoint = endPoints[endPointIdx]
      const { pc, opcode } = endPoint.get(epIdx)
      assert(opcode.name == 'SUB')
      const operands = findOperands(pc, this.srcmap, this.ast)
      checkPoints[expression] = { pc, operands }
    })
    return checkPoints
  }

  findUncheckOperands(tree) {
    assert(tree)
    const uncheckOperands = {}
    const dnodes = tree.root.traverse(({ node: { me } }) => formatSymbol(me).includes('SUB('))
    dnodes.forEach(dnode => {
      const checkPoints = this.generateCheckPoints(dnode)
      for (const t in checkPoints) {
        const { operands, pc } = checkPoints[t]
        uncheckOperands[pc] = operands
      }
    })
    return uncheckOperands
  }

  scan(tree) {
    const uncheckOperands = this.findUncheckOperands(tree)
    return toPairs(uncheckOperands)
  }
} 

module.exports = Subtract
