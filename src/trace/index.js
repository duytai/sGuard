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
  toLocalVariables,
  toStateVariable,
} = require('../variable')

class Trace {
  constructor() {
    this.ts = []
  }

  clear() {
    this.ts.length = 0
  }

  withTs(ts) {
    this.ts = ts
  }

  add(t, pc, { epIdx, vTrackingPos, kTrackingPos }) {
    this.ts.push({ pc, t, epIdx, vTrackingPos, kTrackingPos })
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

  memValueAt(loc) {
    assert(loc && loc[0] == 'const')
    for (let i = this.ts.length - 1; i >= 0; i --) {
      const { t } = this.ts[i]
      if (t[1] == 'MSTORE') {
        if (t[2][0] == 'const' && t[2][1].eq(loc[1])) {
          return t[3]
        }
      }
    }
    return null
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
    return this.ts[this.ts.length - 1]
  }

  prettify() {
    logger.info(chalk.yellow.bold(`>> Full traces ${this.ts.length}`))
    this.ts.forEach(({ pc, t, kTrackingPos, epIdx }) => {
      prettify([t])
      if (isLocalVariable(t)) {
        const variables = toLocalVariables(t[2], this)
        assert(variables.length > 0)
        variables.forEach(variable => {
          variable.prettify()
        })
      }
      if (isStateVariable(t)) {
        const variable = toStateVariable(t[2], this, kTrackingPos, epIdx)
        assert(variable)
        variable.prettify()
      }
    })
  }
}

module.exports = {
  Trace,
} 
