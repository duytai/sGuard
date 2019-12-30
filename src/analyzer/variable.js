const assert = require('assert')
const { isConst } = require('../shared')

// first member is variable name (string)
// the rest is a list of symbols
class Variable {
  constructor(members, variable) {
    this.members = variable ? [...variable.members, ...members] : members
  }

  equal(other) {
    assert(other.constructor.name == 'Variable')
    const readableMembers = this.toReadableMembers()
    const otherReadableMembers = other.toReadableMembers()
    const memberLen = Math.min(readableMembers.length, otherReadableMembers.length)
    assert(memberLen > 0)
    for (let i = 0; i < memberLen; i ++) {
      const myMember = readableMembers[i]
      const otherMember = otherReadableMembers[i]
      if (myMember != '*' && otherMember != '*' && myMember != otherMember)
        return false
    }
    return true
  }

  toReadableMembers() {
    const [root, ...members] = this.members
    const props = members.map(member => {
      if (isConst(member)) return member[1].toString(16)
      return '*'
    })
    return [root, ...props]
  }

  toString() {
    return this.toReadableMembers().join('.')
  }
}

module.exports = Variable

