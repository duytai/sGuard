const assert = require('assert')
const { isConst } = require('../shared')

class Variable {
  // first member is variable name (string)
  // the rest is a list of symbol
  constructor(members, variable) {
    this.members = variable ? [...variable.members, ...members] : members
  }

  equal(other) {
    assert(other.constructor.name == 'Variable')
    const readableMembers = this.toReadableMembers()
    const otherReadableMembers = other.toReadableMembers()
    if (readableMembers.length != otherReadableMembers.length)
      return false
    for (let i = 0; i < readableMembers.length; i ++) {
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

