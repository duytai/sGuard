const assert = require('assert')
const { isArray } = require('lodash')
const { prettify } = require('../shared')

class Variable {
  constructor(t, ep) {
    assert(t && ep)
    this.locs = this.convert(t, ep)
    this.prettify()
  }

  convert() {}

  prettify() {
    console.log(`>> Possible values`)
    this.locs.forEach(loc => {
      if (isArray(loc)) 
        prettify(loc)
      else
        prettify([loc])
      console.log('----')
    })
  }
}

module.exports = Variable
