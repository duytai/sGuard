const assert = require('assert')
const chalk = require('chalk')
const { logger } = require('../shared')

class Variable  {
  constructor(root) {
    assert(root)
    this.root = root
    this.members = [] 
  }

  add(m) {
    assert(m)
    this.members.push(m)
  }

  addN(ms) {
    assert(ms.length > 0)
    ms.forEach(m => {
      this.members.push(m)
    })
  }

  toString() {
    const prop = this.members.map(m => {
      if (m[0] == 'const') return m[1].toString(16)
      return '*'
    }).join('.')
    return [this.root, prop].filter(p => !!p).join('.')
  }

  prettify() {
    logger.debug(chalk.green.bold(this.toString()))
  }
}

module.exports = Variable
