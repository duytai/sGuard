const assert = require('assert')
const { prettify, logger } = require('../shared')
const conversion = require('./conversion')

const { isVariable, toVariable } = conversion
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

  get(idx) {
    assert(idx >= 0 && idx < this.ts.length)
    return this.ts[idx]
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

module.exports = {
  Trace,
  ...conversion,
} 
