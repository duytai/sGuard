const assert = require('assert')

class Oracle {
  constructor(dnode) {
    assert(dnode)
    this.dnode = dnode 
  }

  startFinding() {}
}

module.exports = Oracle
