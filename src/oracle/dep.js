const assert = require('assert')

class Dep {
  constructor(analyzer) {
    assert(analyzer)
    this.analyzer = analyzer
  }

  report() {}
}

module.exports = Dep
