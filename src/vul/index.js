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
    this.fix(bugFixes)
  }

  fix(bugFixes) {
    let source = this.srcmap.source
    console.log(source)
    for (const idx in bugFixes) {
      const { action, from, to, check } = bugFixes[idx]
      if (action == 'REP') {
        const first = source.slice(0, from)
        const second = source.slice(to)
        source = [first, check, second].join('')
      }
    }
    console.log('----')
    console.log(source)
  }

} 

module.exports = { Scanner }
