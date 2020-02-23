const assert = require('assert')
const BN = require('bn.js')
const chalk = require('chalk')
const { uniq } = require('lodash')
const { logger, isConst } = require('../shared')

class Variable  {
  constructor(root) {
    assert(root)
    this.root = root
  }

  toString() {
    return this.root
  }

  prettify() {
    logger.debug(chalk.green.bold(this.toString()))
  }
}

module.exports = Variable
