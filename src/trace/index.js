const assert = require('assert')
const { prettify, logger } = require('../shared')
const conversion = require('./conversion')

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

  sub(traceSize) {
    assert(traceSize >= 0)
    assert(traceSize <= this.ts.length)
    const trace = new Trace()
    const ts = this.ts.slice(0, traceSize)
    trace.withTs([...ts])
    return trace
  }

  values() {
    this.ts.forEach(([type, name]) => assert(['MSTORE', 'SSTORE'].includes(name)))
    return this.ts.map(([type, name, loc, value]) => value)
  }

  keys() {
    this.ts.forEach(([type, name]) => assert(['MSTORE', 'SSTORE'].includes(name)))
    return this.ts.map(([type, name, loc]) => loc)
  }

  filter(cond) {
    assert(cond)
    const trace = new Trace()
    const ts = this.ts.filter(t => cond(t))
    trace.withTs([...ts])
    return trace
  }

  size() {
    return this.ts.length
  }

  last() {
    assert(this.length.length > 0)
    return this.ts[this.ts.length - 1]
  }

  prettify() {
    logger.info('>> Full traces')
    prettify(this.ts)
  }
}

module.exports = {
  Trace,
  ...conversion,
} 
