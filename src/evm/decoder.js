const assert = require('assert')
const opcodes = require('./opcodes')

class Decoder {
  constructor(bin) {
    this.bin = bin
  }

  summarize(opcodeName) {
    let pc = 0;
    const sum = {
      njumpis: 0,
    }
    const auxdataLen = 52 // bytes
    while (pc < this.bin.length - auxdataLen - 1) {
      const opcode = opcodes[this.bin[pc]]
      if (!opcode) break
      if (opcode.name === 'PUSH') pc += this.bin[pc] - 0x5f
      sum.njumpis += opcode.name == 'JUMPI' ? 1 : 0
      pc ++
    }
    return sum
  }
}

module.exports = Decoder
