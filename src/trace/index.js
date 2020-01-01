const assert = require('assert')
const { prettify, logger } = require('../shared')

class Trace {
  constructor() {
    this.ts = []
  }

  withTs(ts) {
    this.ts = ts
  }

  add(t) {
    this.ts.push(t)
  }

  clone() {
    const trace = new Trace()
    trace.withTs([...this.ts])
    return trace
  }

  size() {
    return this.ts.length
  }

  prettify() {
    logger.info('>> Full traces')
    prettify(this.ts)
  }
}

module.exports = Trace
