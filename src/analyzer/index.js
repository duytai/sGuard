const assert = require('assert')
const Register = require('./register')
const DNode = require('./dnode')
const { prettify, isConst } = require('../shared')

class Analyzer {
  constructor(ep, endPoints) {
    const { opcode: { name } } = ep.last()
    this.registers = []
    switch (name) {
      case 'CALL': {
        const trackingPos = ep.stack.size() - 3
        const symbol = ep.stack.get(trackingPos)
        if (isConst(symbol) && symbol[1].isZero())  return
        const register = new Register(symbol, trackingPos, ep, endPoints)
        this.registers.push(register)
        break
      }
      default: {
        assert(false, `dont know ${name}`)
      }
    }
  }

  prettify(srcmap) {
    this.registers.forEach(register => {
      register.prettify(srcmap)
    })
  }

  getdnode() {
    const root = new DNode(['symbol', 'ROOT'], 0)
    root.node.childs = this.registers.map(r => r.dnode)
    return root
  }
}

module.exports = Analyzer
