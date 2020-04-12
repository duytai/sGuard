const { isEmpty, toPairs } = require('lodash')
const { findPayables } = require('../shared')

class Freezing {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }
  scan() {
    const { endPoints, mem: { calls } } = this.cache
    const config = { hasCall: false, isPayable: false }
    config.hasCall = !!calls.find(call => !isEmpty(call)) 
    for (const endPointIdx in endPoints) {
      const { opcode: { name } } = endPoints[endPointIdx].get(3)
      config.isPayable = !(name == 'CALLVALUE') || config.isPayable
    }
    const ret = {}
    const freezed = !config.hasCall && config.isPayable
    if (freezed) {
      const payables = findPayables(this.srcmap, this.ast)
      for (const idx in payables) {
        ret[idx] = payables[idx]
      }
    }
    return toPairs(ret)
  }
}

module.exports = Freezing
