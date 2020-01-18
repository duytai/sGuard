const { assign } = require('lodash')
const { prettify } = require('../shared')

class StackAnalyzer {
  constructor({ trace, ep }, endPoints) {
    assign(this, { trace, endPoints, ep })
  }

  expand() {
  }
}

module.exports = StackAnalyzer 
