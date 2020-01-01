const assert = require('assert')
const { prettify } = require('./shared')

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

  toMemoryLocTrace(traceSize) {
    traceSize = traceSize || this.ts.length
    const ts = this.ts.slice(0, traceSize).filter(([type, name, loc ]) => {
      if (name != 'MSTORE') return false
      if (loc[0] != 'const') return false
      const locNumber = loc[1].toNumber()
      return locNumber >= 0x40 && locNumber < 0x080
    })
    const trace = new Trace()
    trace.withTs([...ts])
    return trace
  }

  toStorageLocTrace(traceSize) {
    traceSize = traceSize || this.ts.length
    const ts = this.ts.slice(0, traceSize).filter(([type, name, loc ]) => {
      if (name != 'MSTORE') return false
      if (loc[0] != 'const') return false
      const locNumber = loc[1].toNumber()
      return locNumber >= 0x00 && locNumber < 0x40
    })
    const trace = new Trace()
    trace.withTs([...ts])
    return trace
  }

  toMemoryAccessTrace(traceSize) {
    traceSize = traceSize || this.ts.length
    const ts = this.ts.slice(0, traceSize).filter(([type, name, loc]) => {
      if (name != 'MSTORE') return false
      if (loc[0] == 'const' && loc[1] <= 0x80) return false
      return true
    })
    const trace = new Trace()
    trace.withTs([...ts])
    return trace
  }

  toStorageAccessTrace(traceSize) {
    traceSize = traceSize || this.ts.length
    const ts = this.ts.slice(0, traceSize).filter(([type, name, loc]) => {
      if (name != 'SSTORE') return false
      if (loc[0] == 'const' && loc[1] <= 0x80) return false
      return true
    })
    const trace = new Trace()
    trace.withTs([...ts])
    return trace
  }

  backedStorage() {
    return [...this.ts]
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
