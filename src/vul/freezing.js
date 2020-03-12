const assert = require('assert')
const Oracle = require('./oracle')
const { DNode }= require('../analyzer')
const { findSymbol, prettify } = require('../shared')

class Freezing extends Oracle {
  startFinding() {
    const { payable, transfer } = this.dictionary.props
    const found = !transfer && payable
    if (!transfer && payable) return [new DNode(['symbol', 'Found'], 0, 1)]
    return [] 
  }
}

module.exports = Freezing 
