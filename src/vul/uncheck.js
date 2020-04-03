const assert = require('assert')
const { toPairs } = require('lodash')
const Tree = require('./tree')
const {
  prettify,
  formatWithoutTrace,
} = require('../shared')

class UncheckReturnValue {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  generateCheckPoints() {
    const checkPoints = {}
    const { mem: { calls }, endPoints } = this.cache
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        const endPoint = endPoints[endPointIdx] 
        const { pc } = endPoint.ep[epIdx]
        const expression = formatWithoutTrace(value.expression)
        checkPoints[expression] = { pc }
      })
    })
    return checkPoints
  }

  removeCheckPoints(tree, checkPoints) {
    const { node: { childs } } = tree.root
    childs.forEach(dnode => {
      dnode.traverse(({ node: { me } }) => {
        const f = formatWithoutTrace(me)
        for (const key in checkPoints) {
          if (f.includes(key) && f.startsWith('ISZERO')) {
            delete checkPoints[key]
          }
        }
      })
    })
  }

  generateBugFixes(checkPoints) {
    for (const key in checkPoints) {
      const { pc } = checkPoints[key]
      console.log(`pc: ${pc}`)
      console.log(`key: ${key}`)
      console.log('-----')
    }
    return []
  }

  scan() {
    const checkPoints = this.generateCheckPoints()
    const { mem: { ends } } = this.cache
    const tree = new Tree(this.cache)
    ends.forEach((end, endPointIdx) => {
      toPairs(end).forEach(([epIdx, value]) => {
        tree.build(endPointIdx, epIdx, value)
      })
    })
    this.removeCheckPoints(tree, checkPoints)
    this.generateBugFixes(checkPoints)
  }
}

module.exports = UncheckReturnValue
