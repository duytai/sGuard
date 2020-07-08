const assert = require('assert')
const opcodes = require('./opcodes')

class Decoder {
  constructor(bin) {
    this.stats = { 
      njumpis: 0,
      nexts: 0,
      nexts: 0,
      pc: 0,
      data: null,
      doWhile: new Set(),
      whileDo: new Set(),
    }
    while (this.stats.pc < bin.length) {
      const opcode = opcodes[bin[this.stats.pc]]
      if (!opcode) break
      switch (opcode.name) {
        case 'PUSH': {
          this.stats.data = bin.slice(
            this.stats.pc + 1,
            this.stats.pc + 1 + bin[this.stats.pc] - 0x5f
          ).toString('hex')
          this.stats.pc += bin[this.stats.pc] - 0x5f
          break
        }
        case 'JUMPI': {
          assert(this.stats.data)
          const jumpdest = parseInt(this.stats.data, 16)
          if (jumpdest < this.stats.pc) {
            this.stats.doWhile.add(this.stats.pc)
          } else {
            let opcode = opcodes[bin[jumpdest - 1]]
            if (opcode.name == 'JUMP') {
              /* Push2 */
              opcode = opcodes[bin[jumpdest - 4]]
              if (opcode.name == 'PUSH') {
                const data = bin.slice(
                  jumpdest - 3,
                  jumpdest - 1
                ).toString('hex')
                const loc = parseInt(data, 16)
                if (loc < this.stats.pc) {
                  this.stats.whileDo.add(this.stats.pc)
                }
              }
              /* Push1 */
              opcode = opcodes[bin[jumpdest - 3]]
              if (opcode.name == 'PUSH') {
                const data = bin.slice(
                  jumpdest - 2,
                  jumpdest - 1
                ).toString('hex')
                const loc = parseInt(data, 16)
                if (loc < this.stats.pc) {
                  this.stats.whileDo.add(this.stats.pc)
                }
              }
            }
          }
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
    console.log(this.stats)
  }
}

module.exports = Decoder
