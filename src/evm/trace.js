const assert = require('assert')
const chalk = require('chalk')
const { prettify, logger } = require('../shared')

class Trace {
  constructor() {
    this.ts = []
  }

  clear() {
    this.ts.length = 0
  }

  add({ pc, t, epIdx, vTrackingPos, kTrackingPos }) {
    this.ts.push({ pc, t, epIdx, vTrackingPos, kTrackingPos })
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
    prettify(this.ts.map(({ t }) => t))
  }
}

module.exports = Trace
