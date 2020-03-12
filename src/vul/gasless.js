const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const BN = require('bn.js')
const Analyzer = require('../analyzer')
const Oracle = require('./oracle')

class Gasless extends Oracle {
  startFinding() {
    const dnodes = this.dictionary.findBuilds(['SEND/VALUE', 'SEND/ADDRESS'])
    return this.dictionary.treeSearch(dnodes, (me) => {
      return /CALLDATALOAD\([^0]+|CALLER/.test(formatSymbol(me))
    })
    return []
  }
}

module.exports = Gasless 
