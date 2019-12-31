const assert = require('assert')

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

  toMTrace() {
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

  toSTrace() {
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

  lastIndex() {
    const idx = this.size() - 1
    assert(idx >= 0)
    return idx
  }

  size() {
    return this.ts.length
  }
}

module.exports = Trace
