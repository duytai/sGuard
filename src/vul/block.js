const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const { Register } = require('../analyzer')
const Oracle = require('./oracle')

class Block extends Oracle {
  startFinding() {
    const dnodes = this.dictionary.findBuilds(['CALL/VALUE', 'CALL/ADDRESS'])
    return this.dictionary.treeSearch(dnodes, (me) => {
      const txt = formatSymbol(me)
      return txt.includes('NUMBER') || txt.includes('TIMESTAMP')
    })
  }
}

module.exports = Block
