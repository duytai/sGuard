const { isEmpty } = require('lodash')

class Scanner {
  constructor(cache) {
    this.cache = cache
  }

  start() {
    const { calls } = this.cache.mem
    calls.forEach((call, endPointIdx) => {
      if (isEmpty(call)) return
      const epIdx = Object.keys(call)[0]
    })
  }
} 

module.exports = { Scanner }
