const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const BN = require('bn.js')
const Analyzer = require('../analyzer')
const Oracle = require('./oracle')

class Reentrancy extends Oracle {
  startFinding() {
    const dnodes = this.dictionary.findBuilds(['CALL/SSTORE'])
    return this.dictionary.treeSearch(dnodes, () => true)
  }
}

module.exports = Reentrancy 
