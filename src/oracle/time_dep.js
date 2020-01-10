const chalk = require('chalk')
const Dep = require('./dep')
const { formatSymbol, logger } = require('../shared')

class TimeDep extends Dep {
  constructor(analyzer) {
    super(analyzer)
    this.name = 'TIME_DEP'
  }

  report() {
    const dnode = this.analyzer.getdnode()
    const cond = dnode => {
      const symbol = dnode.getSymbol()
      return formatSymbol(symbol).includes('TIMESTAMP')
    }
    const timeDnodes = dnode.traverse(cond)
    if (timeDnodes.length > 0) {
      logger.debug(chalk.red.bold('>> Found Time Dependency'))
      timeDnodes.forEach(dnode => {
        const symbol = dnode.getSymbol()
        logger.debug(` ${formatSymbol(symbol)}`)
      })
    }
  }
}

module.exports = TimeDep
