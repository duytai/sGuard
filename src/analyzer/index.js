const assert = require('assert')
const RegisterAnalyzer = require('./register')
const { prettify } = require('../shared')

class Analyzer {
  constructor({ ep, trace }, endPoints) {
    const { stack, opcode: { name }, pc } = ep.get(ep.size() - 1)
    assert(name == 'CALL')
    const symbol = stack.get(stack.size() - 3)
    const trackingPos = stack.size() - 3
    this.register = new RegisterAnalyzer({ ep, trace, symbol, pc, trackingPos }, endPoints)
  }

  prettify() {
    this.register.prettify()
  }

  getdnode() {
    return this.register.dnode
  }
}

module.exports = Analyzer
