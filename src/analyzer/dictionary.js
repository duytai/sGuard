const Condition = require('./condition')
const Cache = require('./cache')
const { prettify } = require('../shared')

class Dictionary {
  constructor(endPoints) {
    this.endPoints = endPoints
    this.condition = new Condition(endPoints)
    this.cache = new Cache(this.condition, endPoints)
    this.build()
  }

  build() {
  }
}

module.exports = Dictionary
