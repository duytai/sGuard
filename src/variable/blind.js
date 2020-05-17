class BlindVariable {
  constructor() {
    this.blind = true
    this.locs = []
    this.members = []
  }

  eq() {
    return true
  }

  toAlias() {
    return '*'
  }
}

module.exports = BlindVariable
