const assert = require('assert')

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
}

module.exports = Trace
