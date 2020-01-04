const assert = require('assert')
const chalk = require('chalk')
const { range } = require('lodash')
const {
  prettify,
  logger,
  findSymbol,
  formatSymbol,
} = require('../shared')
const {
  toStateVariable,
  toLocalVariable,
} = require('../variable')

class DTree {
  constructor(symbol, trace) {
    this.root = { me: symbol, childs: [], alias: 'N/A' }
    this.trace = trace
    this.expand(this.root)
  }

  expand(node) {
    const { me, childs } = node
    assert(!childs.length)
    switch (me[1]) {
      case 'MLOAD': {
        break
      }
      case 'SLOAD': {
        break
      }
      default: {
        const symbols = findSymbol(me, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
        symbols.forEach(symbol => {
          const newNode = { me: symbol, childs: [], alias: 'N/A' }
          childs.push(newNode)
          this.expand(newNode)
        })
      }
    }
  }


  prettify() {
    logger.debug(chalk.green.bold('>> Full DTREE'))
    const goDown = (root, level) => {
      const { me, childs, alias } = root
      const space = range(0, level).map(i => ' ').join('') || ''
      logger.debug(`${space}${formatSymbol(me)} ${chalk.green.bold(alias)}`)
      childs.forEach(child => {
        goDown(child, level + 1)
      })
    }
    goDown(this.root, 0)
  }
}

module.exports = DTree
