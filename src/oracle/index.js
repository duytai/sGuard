const assert = require('assert')
const BlockDep = require('./block_dep')
const TimeDep = require('./time_dep')

class Oracle {
  constructor(analyzer) {
    assert(analyzer)
    this.analyzer = analyzer
  }

  findBugs(oracleNames = []) {
    return oracleNames.map(oracleName => {
      switch (oracleName) {
        case 'BLOCK_DEP': {
          return new BlockDep(this.analyzer)
        }
        case 'TIME_DEP': {
          return new TimeDep(this.analyzer)
        }
        default: {
          assert(false, `unsupport oracle ${oracleName}`)
        }
      }
    })
  }
}

module.exports = Oracle
