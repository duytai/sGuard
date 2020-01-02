const assert = require('assert')
const { prettify, logger } = require('../shared')
const {
  isVariable,
  toVariable,
} = require('./conversion')

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

  subTrace(traceSize) {
    assert(traceSize > 0)
    assert(traceSize <= this.ts.length)
    const trace = new Trace()
    const ts = this.ts.slice(0, traceSize)
    trace.withTs([...ts])
    return trace
  }

  filter(cond) {
    assert(cond)
    const trace = new Trace()
    const ts = this.ts.filter(t => cond(t))
    trace.withTs([...ts])
    return trace
  }

  applyConversion() {
    this.ts.forEach(t => {
      if (isVariable(t)) {
        const variable = toVariable(t, this)
        if (variable) {
          prettify([t])
          variable.prettify()
        }
      }
    })
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
