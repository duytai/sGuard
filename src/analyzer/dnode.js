const assert = require('assert')
const chalk = require('chalk')
const { range } = require('lodash')
const {
  prettify,
  logger,
  formatSymbol,
} = require('../shared')

class DNode {
  constructor(symbol, pc) {
    assert(symbol && pc >= 0)
    this.node = { me: symbol, pc, childs: [], alias: '' }
  }

  prettify(level = 0, srcmap) {
    if (level == 0) {
      logger.debug(chalk.magenta.bold('>> Full DTREE'))
    }
    const { me, childs, alias, pc } = this.node
    const space = range(0, level).map(i => ' ').join('') || ''
    logger.debug(`${space}${formatSymbol(me)} ${chalk.green.bold(alias)}`)
    if (srcmap) {
      const { txt, line } = srcmap.toSrc(pc)
      const firstLine = txt.split("\n")[0]
      if (firstLine) {
        logger.debug(`${space}${chalk.dim.italic(`${line}:${pc}:${firstLine}`)}`)
      }
    }
    childs.forEach(child => {
      child.prettify(level + 1, srcmap)
    })
  }
}

module.exports = DNode 
