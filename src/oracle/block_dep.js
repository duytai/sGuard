const assert = require('assert')
const Dep = require('./dep')

class BlockDep extends Dep {
  constructor(analyzer) {
    super(analyzer)
    this.name = 'BLOCK_DEP'
  }

  report() {
    const dnode = this.analyzer.getdnode()
    // console.log(dnode)
  }
}

module.exports = BlockDep
