const assert = require('assert')
const { uniqBy } = require('lodash')
const { formatSymbol, isConst } = require('../shared')
const BN = require('bn.js')
const Analyzer = require('../analyzer')
const Oracle = require('./oracle')

class Reentrancy extends Oracle {
  startFinding() {
    const dnodes = this.dictionary.findBuilds(['CALL/SSTORE'])
    return uniqBy(dnodes, ({ node: { id }}) => id)
  }
}

module.exports = Reentrancy 
