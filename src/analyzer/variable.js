const assert = require('assert')

class Variable {
  constructor(members) {
    this.members = members
  }

  equal(other) {
    assert(other.constructor.name == 'Variable')
    if (this.members.length != other.members.length)
      return false
    for (let i = 0; i < this.members.length; i ++) {
      const myMember = this.members[i]
      const otherMember = other.members[i]
      if (myMember != '*' && otherMember != '*' && myMember != otherMember)
        return false
    }
    return true
  }

  toString() {
    return this.members.join('.')
  }
}

module.exports = Variable

