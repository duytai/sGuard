const assert = require('assert')
const chalk = require('chalk')
const { reverse } = require('lodash')
const {
  prettify,
  logger,
  isLocalVariable,
  isStateVariable,
} = require('../shared')
const {
  toLocalVariable,
  toStateVariable,
} = require('../variable')

class Trace {
  constructor() {
    this.ts = []
  }

  withTs(ts) {
    this.ts = ts
  }

  add(t, pc) {
    this.ts.push({ pc, t })
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
    this.ts.forEach(({ pc, t }) => assert(['MSTORE', 'SSTORE'].includes(t[1])))
    return this.ts.map(({ pc, t }) => t[3])
  }

  keys() {
    this.ts.forEach(({ pc, t }) => assert(['MSTORE', 'SSTORE'].includes(t[1])))
    return this.ts.map(({ pc, t }) => t[2])
  }

  filter(cond) {
    assert(cond)
    const trace = new Trace()
    const ts = this.ts.filter(({ t }) => cond(t))
    trace.withTs([...ts])
    return trace
  }

  size() {
    return this.ts.length
  }

  last() {
    assert(this.ts.length > 0)
    return this.ts[this.ts.length - 1].t
  }

  eachLocalVariable(cb) {
    assert(cb)
    for (let traceIdx = this.ts.length - 1; traceIdx >= 0; traceIdx --) {
      const { pc, t } = this.ts[traceIdx]
      if (isLocalVariable(t)) {
        const [loc, value] = t.slice(2)
        const variable = toLocalVariable(loc, this)
        const shouldBreak = cb(variable, value, traceIdx, pc)
        if (shouldBreak) break
      }
    }
  }

  eachStateVariable(cb) {
    assert(cb)
    for (let traceIdx = this.ts.length - 1; traceIdx >= 0; traceIdx --) {
      const { pc, t } = this.ts[traceIdx]
      if (isStateVariable(t)) {
        const [loc, value] = t.slice(2)
        const variable = toStateVariable(loc, this)
        const shouldBreak = cb(variable, value, traceIdx, pc)
        if (shouldBreak) break
      }
    }
  }

  prettify() {
    logger.info(chalk.yellow.bold(`>> Full traces ${this.ts.length}`))
    this.ts.forEach(({ pc, t }) => {
      prettify([t])
      if (isLocalVariable(t)) {
        const variable = toLocalVariable(t[2], this)
        assert(variable)
        variable.prettify()
      }
      if (isStateVariable(t)) {
        const variable = toStateVariable(t[2], this)
        assert(variable)
        variable.prettify()
      }
    })
  }
}

module.exports = {
  Trace,
} 
