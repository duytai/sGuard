const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const BN = require('bn.js')
const Analyzer = require('../analyzer')
const Oracle = require('./oracle')

class Delegate extends Oracle {
  startFinding() {
    const dnodes = this.dictionary.findBuilds(['DELEGATECALL/ADDRESS'])
    return this.dictionary.treeSearch(dnodes, (me) => {
      return /CALLDATALOAD\([^0]+|CALLER/.test(formatSymbol(me))
    })
  }
}

module.exports = Delegate 
