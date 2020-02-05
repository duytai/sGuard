const assert = require('assert')
const BN = require('bn.js')
const chalk = require('chalk')
const { uniq } = require('lodash')
const { logger, isConst } = require('../shared')

/// FIXME: a member is a sum of all other constant members 
/// to compare between two variable
class Variable  {
  constructor(root) {
    assert(root)
    this.root = root
    this.members = [] 
  }

  addN(ms) {
    assert(ms.length > 0)
    this.members = [...this.members, ...ms]
  }

  toString() {
    const prop = this.members.map(({ symbol }) => isConst(symbol) ? symbol[1].toString(16) : '*').join('.')
    return [this.root, prop].filter(p => !!p).join('.')
  }

  prettify() {
    logger.debug(chalk.green.bold(this.toString()))
  }

  getMembers() {
    return [...this.members]
  }

  exactEqual(other) {
    const myStr = this.toString()
    const otherStr = other.toString()
    return myStr == otherStr && !myStr.includes('*')
  }

  partialEqual(other) {
    const minLen = Math.min(this.members.length, other.members.length)
    for (let i = 0; i < minLen; i ++) {
      const member = this.members[i]
      const otherMember = other.members[i]
      if (isConst(member) && isConst(otherMember)) {
        if (member[1].toNumber() != otherMember[1].toNumber()) return false
      }
    }
    return this.root == other.root
  }
}

module.exports = Variable
