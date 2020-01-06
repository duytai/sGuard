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
    const prop = this.members.map(m => isConst(m) ? m[1].toString(16) : '*').join('.')
    return [this.root, prop].filter(p => !!p).join('.')
  }

  prettify() {
    logger.debug(chalk.green.bold(this.toString()))
  }

  getSymbolMembers() {
    return this.members.filter(m => !isConst(m))
  }

  partialEqual(other) {
    if (this.root != other.root) return false
    const minLen = Math.min(this.members.length, other.members.length)
    for (let i = 0; i < minLen; i ++) {
      const member = this.members[i]
      const otherMember = other.members[i]
      if (isConst(member) && isConst(otherMember)) {
        if (member[1].toNumber() != otherMember[1].toNumber()) return false
      }
    }
    return true
  }
}

module.exports = Variable
