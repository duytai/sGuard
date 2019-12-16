const assert = require('assert')
const { prettify } = require('../shared')

class Storage {
  constructor(symbol, traces) {
    const [type, name, offset] = symbol
    assert(name == 'SLOAD')
    this.storageloc = this.extractStorageloc(offset)
  }

  extractStorageloc(symbol) {
  }
}

module.exports = Storage
