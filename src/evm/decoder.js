const assert = require('assert')
const opcodes = require('./opcodes')

class Decoder {
  constructor(bin) {
    this.stats = { 
      njumpis: 0,
      nexts: 0,
      nexts: 0,
      pc: 0,
    }
    while (this.stats.pc < bin.length) {
      const opcode = opcodes[bin[this.stats.pc]]
      if (!opcode) break
      switch (opcode.name) {
        case 'JUMPI': {
          assert(this.stats.data)
          this.stats.njumpis ++
          break
        }
        case 'DELEGATECALL':
        case 'CALLCODE':
        case 'CREATE':
        case 'CREATE2':
        case 'SELFDESTRUCT':
        case 'CALL': {
          this.stats.nexts ++
          break
        }
      }
      this.stats.pc ++
    }
  }
}

module.exports = Decoder
