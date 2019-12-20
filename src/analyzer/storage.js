const BN = require('bn.js')
const assert = require('assert')
const { findIndex } = require('lodash')
const { prettify, formatSymbol } = require('../shared')

const zero = ['const', new BN(0)]
class Storage {
  constructor(symbol) {
    assert(symbol[1] == 'SLOAD')
  }
}

module.exports = Storage
