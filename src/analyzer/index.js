const assert = require('assert')
const Register = require('./register')
const { prettify } = require('../shared')

class Analyzer {
  constructor(ep, endPoints) {
    const { stack, trace, opcode: { name } } = ep.last()
    switch (name) {
      case 'CALL': {
        const trackingPos = stack.size() - 3
        const symbol = stack.get(trackingPos)
        prettify(trace.ts.map(({ t }) => t))
        prettify([symbol])
        this.register = new Register(symbol, ep, endPoints)
        break
      }
      default: {
        assert(false, `dont know ${name}`)
      }
    }
  }

  prettify() {
    this.register.prettify()
  }

  getdnode() {
    return this.register.dnode
  }
}

module.exports = Analyzer
