const assert = require('assert')
const RegisterAnalyzer = require('./register')
const { prettify } = require('../shared')

class Analyzer {
  constructor({ ep, trace }, endPoints) {
    const { stack, opcode: { name } } = ep.get(ep.size() - 1)
    assert(name == 'CALL')
    const symbol = stack.get(stack.size() - 3)
    const trackingPos = stack.size() - 3
    prettify(trace.ts.map(({ t }) => t))
    prettify([symbol])
    this.register = new RegisterAnalyzer({ ep, trace, symbol, trackingPos }, endPoints)
  }

  prettify() {
    this.register.prettify()
  }

  getdnode() {
    return this.register.dnode
  }
}

module.exports = Analyzer
