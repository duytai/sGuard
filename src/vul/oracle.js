const assert = require('assert')

class Oracle {
  constructor(endPoints) {
    assert(endPoints)
    this.endPoints = endPoints
  }

  startFinding() {}
}

module.exports = Oracle
