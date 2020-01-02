const assert = require('assert')
const { logger } = require('../shared')

class Variable  {
  constructor(root, members = []) {
    assert(root)
    this.members = members
    this.root = root
  }

  add(m) {
    assert(m)
    this.members.push(m)
  }

  addN(ms) {
    assert(ms.length > 0)
    ms.forEach(m => {
      this.members.push(m)
    })
  }

  prettify() {
    const prop = this.members.map(m => {
      if (m[0] == 'const') return m[1].toString(16)
      return '*'
    }).join('.')
    logger.debug([this.root, prop].filter(p => !!p).join('.'))
  }
}

module.exports = Variable
