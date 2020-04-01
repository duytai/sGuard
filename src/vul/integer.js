const assert = require('assert')
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
  extractOperands,
} = require('../shared')

class Integer {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  generateCheckpoints(dnode, opcodeName) {
    assert(opcodeName && dnode)
    const { endPoints } = this.cache
    const checkPoints = {}
    const { node: { me, endPointIdx } } = dnode 
    const nodes = findSymbols(me, ([_, name]) => name == opcodeName)
    nodes.forEach(node => {
      const [left, right, epSize] = node.slice(2)
      const expression = [left, right].map(formatWithoutTrace).join(':')
      const epIdx = epSize[1].toNumber() - 1
      const endPoint = endPoints[endPointIdx]
      const { pc, opcode } = endPoint.get(epIdx)
      assert(opcode.name == opcodeName)
      checkPoints[expression] = { pc, operands: extractOperands(pc, this.srcmap, this.ast) }
    })
    return checkPoints
  }

  removeCheckpoints(dnode, checkPoints, opcodeName) {
    assert(dnode && checkPoints && opcodeName)
    /// Search for comparison node 
    const comNodes = dnode.traverse(({ node: { me } }) => {
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
      switch (opcodeName) {
        case 'ADD': {
          if (left[1] == 'ADD') {
            const [leftAdd, rightAdd] = left.slice(2).map(formatWithoutTrace)
            const rightCom = formatWithoutTrace(right)
            if (rightCom == leftAdd || rightCom == rightAdd) {
              const gtExpression = [leftAdd, rightAdd].join(':')
              delete checkPoints[gtExpression]
            }
          }
          break
        }
        case 'SUB': {
          const gtExpression = [left, right].map(formatWithoutTrace).join(':')
          delete checkPoints[gtExpression]
          break
        }
        default: {
          assert(false, `does not support ${opcodeName}`)
        }
      }
    })
  }

  generateBugfixes(operandLocs, opcodeName) {
    assert(operandLocs && opcodeName)
    const bugFixes = []
    for (const pc in operandLocs) {
      const { s } = this.srcmap.toSL(pc)
      const { newlines, spaces, tabs, start } = insertLoc(this.srcmap.source, s)
      let check = ''
      range(spaces).forEach(_ => check += ' ')
      range(tabs).forEach(_ => check += '\t')
      switch (opcodeName) {
        case 'ADD': {
          check += `require(${operandLocs[pc].join(' + ')} > ${operandLocs[pc][0]});\n`
          break
        }
        case 'SUB': {
          check += `require(${operandLocs[pc].join(' >= ')});\n`
          break
        }
        default: {
          assert(false, `does not support ${opcodeName}`)
        }
      }
      bugFixes.push({ start, check, len: check.length })
    }
    return bugFixes
  }

  fixAddition(tree, endPoints) {
    const operandLocs = {}
    const addNodes = tree.root.traverse(({ node: { me } }) => formatSymbol(me).includes('ADD('))
    addNodes.forEach(addNode => {
      const checkPoints = this.generateCheckpoints(addNode, 'ADD')
      this.removeCheckpoints(addNode, checkPoints, 'ADD')
      if (!isEmpty(checkPoints)) {
        for (const t in checkPoints) {
          const { operands, pc } = checkPoints[t]
          operandLocs[pc] = operands
        }
      }
    })
    return this.generateBugfixes(operandLocs, 'ADD')
  }

  fixSubtract(tree, endPoints) {
    const operandLocs = {}
    const subNodes = tree.root.traverse(({ node: { me } }) => formatSymbol(me).includes('SUB('))
    subNodes.forEach(subNode => {
      const checkPoints = this.generateCheckpoints(subNode, 'SUB')
      this.removeCheckpoints(subNode, checkPoints, 'SUB')
      if (!isEmpty(checkPoints)) {
        for (const t in checkPoints) {
          const { operands, pc } = checkPoints[t]
          operandLocs[pc] = operands
        }
      }
    })
    return this.generateBugfixes(operandLocs, 'SUB')
  }

  fixMul(tree, endPoints) {
    const operandLocs = {}
    const mulNodes = tree.root.traverse(({ node: { me } }) => formatSymbol(me).includes('MUL('))
    mulNodes.forEach(mulNode => {
      const checkPoints = this.generateCheckpoints(mulNode, 'MUL')
      // this.removeCheckpoints(subNode, checkPoints, 'SUB')
    })
    return []
  }

  scan() {
    const { mem: { calls }, endPoints } = this.cache
    const tree = new Tree(this.cache)
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        tree.build(endPointIdx, epIdx, value)
      })
    })
    return [
      ...this.fixSubtract(tree, endPoints),
      ...this.fixAddition(tree, endPoints),
      ...this.fixMul(tree, endPoints),
    ]
  }
}

module.exports = Integer
