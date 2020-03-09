const assert = require('assert')

class Oracle {
  constructor(dnode, endPoints) {
    assert(dnode && endPoints)
    this.dnode = dnode 
    this.endPoints = endPoints
  }

  startFinding() {}
}

module.exports = Oracle
