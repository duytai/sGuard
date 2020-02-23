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

  add(t, pc, { vTrackingPos, kTrackingPos }) {
    this.ts.push({ pc, t, vTrackingPos, kTrackingPos })
  }

  clone() {
    const trace = new Trace()
    trace.ts = [...this.ts]
    return trace
  }

  sub(traceSize) {
    assert(traceSize >= 0)
    assert(traceSize <= this.ts.length)
    const trace = new Trace()
    const ts = this.ts.slice(0, traceSize)
    trace.ts = [...ts]
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
    assert(false, `not found 0x${loc[1].toNumber()}`)
  }

  get(idx) {
    assert(idx >= 0 && idx <= this.ts.length)
    return this.ts[idx]
  }

  last() {
    assert(this.ts.length > 0)
    return this.ts[this.ts.length - 1]
  }

  size() {
    return this.ts.length
  }

  prettify() {
    logger.info(chalk.yellow.bold(`>> Full traces ${this.ts.length}`))
    this.ts.forEach(({ pc, t, kTrackingPos }) => {
      prettify([t])
      if (isLocalVariable(t)) {
        const variables = toLocalVariables(t[2], this)
        assert(variables.length > 0)
        variables.forEach(variable => {
          variable.prettify()
        })
      }
      if (isStateVariable(t)) {
        const variable = toStateVariable(t[2], this)
        assert(variable)
        variable.prettify()
      }
    })
  }
}

module.exports = Trace
