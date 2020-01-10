const assert = require('assert')
const chalk = require('chalk')
const Dep = require('./dep')
const { formatSymbol, logger } = require('../shared')

class BlockDep extends Dep {
  constructor(analyzer) {
    super(analyzer)
    this.name = 'BLOCK_DEP'
  }

  report() {
    const dnode = this.analyzer.getdnode()
    const cond = dnode => {
      const symbol = dnode.getSymbol()
      return formatSymbol(symbol).includes('NUMBER')
    }
    const numberDnodes = dnode.traverse(cond)
    if (numberDnodes.length > 0) {
      logger.debug(chalk.red.bold('>> Found Number Dependency'))
      numberDnodes.forEach(dnode => {
        const symbol = dnode.getSymbol()
        logger.debug(` ${formatSymbol(symbol)}`)
      })
    }
  }
}

module.exports = BlockDep
