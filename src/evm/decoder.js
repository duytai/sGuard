const assert = require('assert')
const opcodes = require('./opcodes')

class Decoder {
  constructor(bin) {
    this.bin = bin
  }

  summarize(opcodeName) {
    let pc = 0;
    const sum = {
      hasCall: false,
    }
    const auxdataLen = 52 // bytes
    while (pc < this.bin.length - auxdataLen - 1) {
      const { name } = opcodes[this.bin[pc]]
      if (name === 'PUSH') pc += this.bin[pc] - 0x5f
      sum.hasCall = sum.hasCall || name == 'CALL'
      pc ++
    }
    return sum
  }
}

module.exports = Decoder
