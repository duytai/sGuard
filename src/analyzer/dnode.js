const assert = require('assert')
const chalk = require('chalk')
const { range } = require('lodash')
const {
  prettify,
  logger,
  formatSymbol,
} = require('../shared')

class DNode {
  constructor(symbol) {
    this.node = { me: symbol, childs: [], alias: 'N/A', variable: null }
  }

  addChild(child) {
    assert(child)
    this.node.childs.push(child)
  }

  findSloads() {
    const cond = (dnode) => {
      const { node: { me, childs } } = dnode
      return me[1] == 'SLOAD'
    }
    return this.traverse(cond)
  }

  traverse(cond) {
    assert(cond)
    const dnodes = []
    const stack = [this]
    while (stack.length > 0) {
      const dnode = stack.pop()
      if (cond(dnode)) dnodes.push(dnode)
      dnode.node.childs.forEach(dnode => stack.push(dnode))
    }
    return dnodes
  }

  prettify(level = 0) {
    if (level == 0) {
      logger.debug(chalk.magenta.bold('>> Full DTREE'))
    }
    const { me, childs, alias } = this.node
    const space = range(0, level).map(i => ' ').join('') || ''
    logger.debug(`${space}${formatSymbol(me)} ${chalk.green.bold(alias)}`)
    childs.forEach(child => {
      child.prettify(level + 1)
    })
  }
}

module.exports = DNode 
