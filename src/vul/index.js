const assert = require('assert')
const { toPairs } = require('lodash')
const { prettify, logger, gb } = require('../shared')
const Subtract = require('./subtract')

class Scanner {
  constructor(cache, srcmap, ast) {
    this.srcmap = srcmap
    this.vuls = {
      subtract: new Subtract(cache, srcmap, ast),
    }
  }

  scan() {
    let bugFixes = []
    for (const k in this.vuls) {
      bugFixes = [
        ...bugFixes,
        ...(this.vuls[k].scan() || [])
      ]
    }
  }

  fix(bugFixes) {
  }

} 

module.exports = { Scanner }
