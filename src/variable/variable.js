const assert = require('assert')
const BN = require('bn.js')
const chalk = require('chalk')
const { logger, isConst } = require('../shared')

class Variable  {
  constructor(root) {
    assert(root)
    this.root = root
    this.members = [] 
  }

  addN(ms) {
    assert(ms.length > 0)
    const symbols = ms.filter(m => !isConst(m))
    switch (symbols.length) {
      case 0: {
        const sum = ms.reduce((r, n) => r + n[1].toNumber(), 0)
        if (sum > 0) return this.members.push(['const', new BN(sum)])
        break
      }
      case 1: {
        return this.members.push(symbols[0])
      }
      default: {
        assert(false, 'accept only one symbol')
      }
    }
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
