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

  toMemoryPoiterTrace() {
    const ts = this.ts.filter(([type, name, loc ]) => {
      if (name != 'MSTORE') return false
      if (loc[0] != 'const') return false
      const locNumber = loc[1].toNumber()
      return locNumber >= 0x40 && locNumber < 0x080
    })
    const trace = new Trace()
    trace.withTs([...ts])
    return trace
  }

  toStoragePointerTrace() {
    const ts = this.ts.filter(([type, name, loc ]) => {
      if (name != 'MSTORE') return false
      if (loc[0] != 'const') return false
      const locNumber = loc[1].toNumber()
      return locNumber >= 0x00 && locNumber < 0x40
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
