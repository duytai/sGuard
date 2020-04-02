const assert = require('assert')
const { toPairs, isEmpty, range } = require('lodash')
const Tree = require('./tree')
const {
  prettify,
  formatWithoutTrace,
  formatSymbol,
  findSymbols,
  logger,
  insertLocs,
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
      if (left[1] == 'ISZERO' || right[1] == 'ISZERO') return
      const expression = formatWithoutTrace(node)
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
    switch (opcodeName) {
      case 'ADD':
      case 'SUB': {
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
                  const expressions = [
                    `ADD(${leftAdd},${rightAdd})`,
                    `ADD(${rightAdd},${leftAdd})`,
                  ]
                  expressions.forEach(expression => {
                    delete checkPoints[expression]
                  })
                }
              }
              break
            }
            case 'SUB': {
              const expression = `SUB(${[left, right].map(formatWithoutTrace).join(',')})`
              delete checkPoints[expression]
              break
            }
          }
        })
        break
      }
      case 'MUL': {
        const comNodes = dnode.traverse(({ node: { me } }) => formatSymbol(me).includes('EQ('))
        comNodes.forEach(comNode => {
          const { node: { me } } = comNode
          // a * b / a == b || a * b / b == a
          /// TODO: check if a == 0 
          if (me[1] == 'ISZERO' && me[2][1] == 'ISZERO' && me[2][2][1] == 'EQ') {
            const [leftEq, rightEq] = me[2][2].slice(2)
              .map((symbol, idx) => idx == 1 ? formatWithoutTrace(symbol) : symbol)
            if (leftEq[1] == 'DIV') {
              const [leftDiv, rightDiv] = leftEq.slice(2)
                .map((symbol, idx) => idx == 1 ? formatWithoutTrace(symbol) : symbol)
              if (leftDiv[1] == 'MUL') {
                const [leftMul, rightMul] = leftDiv.slice(2).map(formatWithoutTrace)
                if ((leftMul == rightDiv && rightMul == rightEq) || (rightMul == rightDiv && leftMul == rightEq)) {
                  const expressions = [
                    `MUL(${leftMul},${rightMul})`,
                    `MUL(${rightMul},${leftMul})`,
                  ]
                  expressions.forEach(expression => {
                    delete checkPoints[expression]
                  })
                }
              }
            }
          }
        })
        break
      }
    }
  }

  generateBugfixes(operandLocs, opcodeName) {
    assert(operandLocs && opcodeName)
    const bugFixes = []
    for (const pc in operandLocs) {
      const configLocs = insertLocs(this.srcmap, this.ast, pc)
      configLocs.forEach(configLoc => {
        const { newlines, spaces, tabs, start } = configLoc
        let check = ''
        range(spaces).forEach(_ => check += ' ')
        range(tabs).forEach(_ => check += '\t')
        switch (opcodeName) {
          case 'ADD': {
            check += `require(${operandLocs[pc].join(' + ')} >= ${operandLocs[pc][0]});\n`
            break
          }
          case 'SUB': {
            check += `require(${operandLocs[pc].join(' >= ')});\n`
            break
          }
          case 'MUL': {
            const [left, right] = operandLocs[pc]
            check += `require(${left} == 0 || ${left} * ${right} / ${left} == ${right});\n`
            break
          }
          default: {
            assert(false, `does not support ${opcodeName}`)
          }
        }
        bugFixes.push({ start, check, len: check.length })
      })
    }
    return bugFixes
  }

  fixAddition(tree, endPoints) {
    const operandLocs = {}
    const addNodes = tree.root.traverse(({ node: { me } }) => formatSymbol(me).includes('ADD('))
    addNodes.forEach(addNode => {
      const checkPoints = this.generateCheckpoints(addNode, 'ADD')
      // TODO
      // this.removeCheckpoints(addNode, checkPoints, 'ADD')
      if (!isEmpty(checkPoints)) {
        for (const t in checkPoints) {
          if (t.startsWith('ADD')) {
            const { operands, pc } = checkPoints[t]
            operandLocs[pc] = operands
          }
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
      // TODO
      // this.removeCheckpoints(subNode, checkPoints, 'SUB')
      if (!isEmpty(checkPoints)) {
        for (const t in checkPoints) {
          if (t.startsWith('SUB')) {
            const { operands, pc } = checkPoints[t]
            operandLocs[pc] = operands
          }
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
      // TODO:
      // this.removeCheckpoints(mulNode, checkPoints, 'MUL')
      if (!isEmpty(checkPoints)) {
        for (const t in checkPoints) {
          if (t.startsWith('MUL')) {
            const { operands, pc } = checkPoints[t]
            operandLocs[pc] = operands
          }
        }
      }
    })
    return this.generateBugfixes(operandLocs, 'MUL')
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
