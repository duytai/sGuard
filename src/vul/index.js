const assert = require('assert')
const { toPairs } = require('lodash')
const { prettify } = require('../shared')
const Integer = require('./integer')

class Scanner {
  constructor(cache, srcmap, ast) {
    this.vuls = {
      integer: new Integer(cache, srcmap, ast),
    }
  }

  scan() {
    for (const k in this.vuls) {
      this.vuls[k].scan()
    }
  }

} 

module.exports = { Scanner }
