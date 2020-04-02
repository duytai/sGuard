const assert = require('assert')
const { toPairs, fromPairs, intersection, union, xor } = require('lodash')
const { prettify, formatSymbol, logger } = require('../shared')

class Condition {
  constructor(endPoints) {
    assert(endPoints.length >= 0)
    this.start = 0
    this.end = 100000
    this.buildGraph(endPoints)
    this.computeDominators()
    this.computeControls()
  }

  buildGraph(endPoints) {
    const successors = {}
    const predecessors = {} 
    const nodes = new Set([this.start, this.end])
    endPoints.forEach(({ ep }) => {
      ep.forEach(({ opcode: { name }, pc }, idx) => {
        if (name == 'JUMPI' || (idx >= 1 && ep[idx - 1].opcode.name == 'JUMPI')) {
          nodes.add(pc)
        }
      })
    })
    endPoints.forEach(({ ep }) => {
      const markers = [
        { pc: this.start },
        ...ep.filter(({ pc }) => nodes.has(pc)),
        { pc: this.end }
      ]
      markers.slice(1).forEach(({ pc: to }, idx) => {
        const from = markers[idx].pc
        if (!successors[from]) successors[from] = new Set()
        successors[from].add(to)
        if (!predecessors[to]) predecessors[to] = new Set()
        predecessors[to].add(from)
      })
    })
    this.successors = fromPairs(
      toPairs(successors).map(([key, values]) => [key, [...values]])
    )
    this.predecessors = fromPairs(
      toPairs(predecessors).map(([key, values]) => [key, [...values]])
    )
    this.nodes = [...nodes]
  }

  computeDominators() {
    const trees = [
      {
        predecessors: this.predecessors,
        successors: this.successors,
        nodes: this.nodes,
        start: this.start,
      },
      {
        predecessors: this.successors,
        successors: this.predecessors,
        nodes: this.nodes,
        start: this.end,
      }
    ]
    const [dominators, postdominators] = trees.map(({ start, predecessors, successors, nodes }) => {
      const dominators = {}
      nodes.forEach(node => dominators[node] = nodes)
      let workList = [start]
      while (workList.length > 0) {
        const node = workList.pop()
        const preds = predecessors[node] || []
        const pdominators = intersection.apply(intersection, preds.map(p => dominators[p]))
        const ndominators = union([node], pdominators)
        if (ndominators.join('') != dominators[node].join('')) {
          dominators[node] = ndominators
          const succs = successors[node]
          workList = union(workList, succs)
        }
      }
      return dominators
    })
    this.dominators = dominators
    this.postdominators = postdominators
  }

  computeControls() {
    this.fullControls = {}
    const domDict = this.nodes.map(node => {
      const succs = this.successors[node] || []
      return {
        node,
        iters: intersection.apply(intersection, succs.map(s => this.postdominators[s])),
        unios: union.apply(union, succs.map(s => this.postdominators[s]))
      }
    })
    this.nodes.forEach(node => {
      if (node == this.start) return
      toPairs(domDict).forEach(([_, { node: onode, iters, unios }]) => {
        if (!iters.includes(node) && unios.includes(node)) {
          !this.fullControls[node] && (this.fullControls[node] = [])
          this.fullControls[node].push(onode)
        }
      })
    })
  }
}

module.exports = Condition 
