class Variable {
  constructor(members) {
    this.members = members
  }

  toString() {
    return this.members.join('.')
  }
}

module.exports = Variable

