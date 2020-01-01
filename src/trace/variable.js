const assert = require('assert')
const { logger } = require('../shared')

class Variable  {
  constructor(root, members = []) {
    assert(root)
    this.members = members
    this.root = root
  }

  prettify() {
    const prop = this.members.map(m => {
      if (m[0] == 'const') return m[1].toString()
      return '*'
    }).join('.')
    logger.debug([this.root, ...prop].join('.'))
  }
}

module.exports = Variable
