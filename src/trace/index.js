const assert = require('assert')
const chalk = require('chalk')
const {
  prettify,
  logger,
  isLocalVariable,
  isStateVariable,
} = require('../shared')
const {
  toLocalVariable,
  toStateVariable,
  NameAllocatorFactory,
} = require('../variable')

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
    assert(this.ts.length > 0)
    return this.ts[this.ts.length - 1]
  }

  eachLocalVariable(cb) {
    assert(cb)
    const allocator = NameAllocatorFactory.byName('MEMORY', this)
    const ts = this.ts.filter(isLocalVariable)
    ts.forEach(t => {
      const [loc, value] = t.slice(2)
      const variable = toLocalVariable(loc, this, allocator)
      cb(variable, value)
    })
  }

  eachStateVariable(cb) {
    assert(cb)
    const allocator = NameAllocatorFactory.byName('STORAGE', this)
    const ts = this.ts.filter(isStateVariable)
    ts.forEach(t => {
      const [loc, value] = t.slice(2)
      const variable = toStateVariable(loc, this, allocator)
      cb(variable, value)
    })
  }

  prettify() {
    logger.info(chalk.yellow.bold(`>> Full traces ${this.ts.length}`))
    this.ts.forEach(t => {
      prettify([t])
      if (isLocalVariable(t)) {
        const allocator = NameAllocatorFactory.byName('MEMORY', this)
        const variable = toLocalVariable(t[2], this, allocator)
        assert(variable)
        variable.prettify()
      }
      if (isStateVariable(t)) {
        const allocator = NameAllocatorFactory.byName('STORAGE', this)
        const variable = toStateVariable(t[2], this, allocator)
        assert(variable)
        variable.prettify()
      }
    })
  }
}

module.exports = {
  Trace,
} 
