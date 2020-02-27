const assert = require('assert')
const { prettify } = require('../shared')

class Variable {
  constructor(t, ep) {
    assert(t && ep)
    const locs = this.convert(t, ep)
    prettify(locs)
  }

  convert() {}
}

module.exports = Variable
