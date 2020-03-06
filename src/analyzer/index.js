const assert = require('assert')
const Register = require('./register')
const { prettify } = require('../shared')

class Analyzer {
  constructor(ep, endPoints) {
    const { opcode: { name } } = ep.last()
    switch (name) {
      case 'CALL': {
        const trackingPos = ep.stack.size() - 3
        const symbol = ep.stack.get(trackingPos)
        prettify([symbol])
        this.register = new Register(symbol, trackingPos, ep, endPoints)
        break
      }
      default: {
        assert(false, `dont know ${name}`)
      }
    }
  }

  prettify(srcmap) {
    this.register.prettify(srcmap)
  }

  getdnode() {
    return this.register.dnode
  }
}

module.exports = Analyzer
