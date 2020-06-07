const assert = require('assert')
const opcodes = require('./opcodes')

class Decoder {
  constructor(bin) {
    const exts = [
      'DELEGATECALL',
      'CALLCODE',
      'CREATE',
      'CREATE2',
      'SELFDESTRUCT',
      'CALL',
    ]
    const sum = { njumpis: 0, nexts: 0, nexts: 0 }
    let pc = 0;
    while (pc < bin.length) {
      const opcode = opcodes[bin[pc]]
      if (!opcode) break
      if (opcode.name === 'PUSH') pc += bin[pc] - 0x5f
      sum.njumpis += opcode.name == 'JUMPI' ? 1 : 0
      sum.nexts += exts.includes(opcode.name) ? 1 : 0
      pc ++
    }
    this.sum = sum
  }
}

module.exports = Decoder
