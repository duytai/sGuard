const assert = require('assert')
const { prettify } = require('../shared')

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
    prettify(this.ts)
  }
}

module.exports = Trace
