const assert = require('assert')
const { isArray } = require('lodash')
const { prettify } = require('../shared')

class Variable {
  constructor(t, ep) {
    assert(t && ep)
    this.locs = this.convert(t, ep)
    assert(this.locs.length >= 1)
  }

  eq(other) {}

  convert() {}
}

module.exports = Variable
