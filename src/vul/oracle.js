const assert = require('assert')

class Oracle {
  constructor(dictionary) {
    assert(dictionary)
    this.dictionary = dictionary 
  }
  startFinding() {}
}

module.exports = Oracle
