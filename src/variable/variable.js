const assert = require('assert')
const chalk = require('chalk')
const { logger, isConst } = require('../shared')

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
    const isStr = typeof this.root == 'string'
    let root = this.root.toString()
    root = isStr ? root : `[${root}]`
    const prop = this.members.map(m => m[0] == 'const' ? m[1].toString(16) : '*').join('.')
    return [root, prop].filter(p => !!p).join('.')
  }

  prettify() {
    logger.debug(chalk.green.bold(this.toString()))
  }

  exactEqual(other) {
    return other.toString() == this.toString()
  }

  getAbsoluteRoot() {
    const isStr = typeof this.root == 'string'
    if (isStr) return new Variable(this.root)
    return this.root.getAbsoluteRoot()
  }

}

module.exports = Variable
