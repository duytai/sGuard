const assert = require('assert')
const { isArray } = require('lodash')
const { prettify } = require('../shared')

class Variable {
  constructor(t, ep) {
    assert(t && ep)
    this.t = t
    this.members = []
    this.locs = this.convert(t, ep)
    assert(this.locs.length >= 1)
  }
  eq() {}
  convert() {}
  toAlias() {}
}

module.exports = Variable
