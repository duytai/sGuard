class BlindVariable {
  constructor() {
    this.blind = true
  }

  eq() {
    return true
  }

  toAlias() {
    return '*'
  }
}

module.exports = BlindVariable
