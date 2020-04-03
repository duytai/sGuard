const assert = require('assert')
const { toPairs } = require('lodash')
const { prettify, logger, gb } = require('../shared')
const Integer = require('./integer')
const UncheckReturnValue = require('./uncheck')

class Scanner {
  constructor(cache, srcmap, ast) {
    this.srcmap = srcmap
    this.vuls = {
      integer: new Integer(cache, srcmap, ast),
      uncheck: new UncheckReturnValue(cache, srcmap, ast),
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
    // Apply bugFixes
    bugFixes.sort((x, y) => x.start - y.start)
    let acc = 0
    let source = this.srcmap.source
    bugFixes.forEach(bugFix => {
      bugFix.start = bugFix.start + acc
      // Begin fix here
      const first = source.slice(0, bugFix.start + 1)
      const last = source.slice(bugFix.start + 1)
      logger.info(`PATCH: ${gb(bugFix.check.trim())}`)
      source = [first, bugFix.check, last].join('')
      // End fix
      acc += bugFix.len
    })
    if (bugFixes.length) {
      logger.info(`FIXED`)
      console.log(source)
    }
  }

} 

module.exports = { Scanner }
