const assert = require('assert')
const Oracle = require('./oracle')
const { formatSymbol } = require('../shared')

class Int extends Oracle {
  startFinding() {
    const dnodes = this.dictionary.findBuilds(['CALL/VALUE', 'CALL/ADDRESS'])
    return this.dictionary.treeSearch(dnodes, (me) => {
      const txt = formatSymbol(me)
      return !!['ADD', 'SUB', 'MUL', 'POW'].find(x => txt.includes(x))
    })
  }
}

module.exports = Int
