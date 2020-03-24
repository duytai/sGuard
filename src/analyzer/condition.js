const assert = require('assert')
const { uniqBy, uniq } = require('lodash')
const { prettify, formatSymbol, logger } = require('../shared')

class Condition {
  constructor(endPoints) {
    assert(endPoints.length > 0)
    this.edges = this.buildGraph(endPoints)
  }

  buildGraph(endPoints) {
    const edges = {} 
    endPoints.forEach(({ ep }) => {
      const jumpis = ep.filter(({ opcode: { name } }) => name == 'JUMPI')
      jumpis.slice(1).forEach(({ pc: to }, idx) => {
        const from = jumpis[idx].pc
        if (!edges[to]) edges[to] = new Set()
        edges[to].add(from)
      })
    })
    return edges
  }

  findConditions(jPc) {
    assert(this.edges[jPc])
    const stack = [jPc]
    while (stack.length) {
      const from = this.edges[stack.pop()] 
      console.log(from)
    }
  }
}

module.exports = Condition 
