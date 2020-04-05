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

  findUncheckOperands(tree, endPoints) {
    assert(tree && endPoints)
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

  generateBugFixes(uncheckOperands) {
    const bugFixes = []
    const pairs = toPairs(uncheckOperands)
    pairs.sort((x, y) => x[1].range[0] - y[1].range[0])
    let acc = 0 
    for (const idx in pairs) {
      const [pc, { range, operands }] = pairs[idx]
      const [from, to] = range.map(x => x + acc)
      const check = `sub(${operands.map(x => x.id).join(', ')})`
      const diff = check.length - (to - from)
      bugFixes.push({ action: 'REP', from, to, check })
      acc += diff
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
    const uncheckOperands = this.findUncheckOperands(tree, endPoints)
    const bugFixes = this.generateBugFixes(uncheckOperands)
    return bugFixes
  }
} 

module.exports = Subtract
