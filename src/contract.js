const assert = require('assert')
const { opcodes } = require('./evm')

class Contract {
  constructor(bin) {
    this.bin = bin
  }

  execute(pc = 0, stackSize = 0) {
    const opcode = opcodes[this.bin[pc]]
    if (!opcode) return
    switch (opcode.name) {
      case 'PUSH': {
        pc += this.bin[pc] - 0x5f
        stackSize += 1
        return this.execute(pc + 1, stackSize)
      }
      default: {
        assert(false, `unknown ${opcode.name}`)
      }
    }
  }
}

module.exports = Contract 
