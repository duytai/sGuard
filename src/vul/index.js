const { isEmpty, toPairs } = require('lodash')
const { DNode } = require('../analyzer')

class Scanner {
  constructor(cache, srcmap) {
    this.cache = cache
    this.srcmap = srcmap
  }

  start() {
    const { mem: { calls }, endPoints } = this.cache
    const root = new DNode(['symbol', 'root'], 0)
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        const { sloads, mloads, links } = value
        // const dnode = new DNode(symbol, pc, id)
        // console.log(key)
        // console.log(value)
      })
    })
  }
} 

module.exports = { Scanner }
