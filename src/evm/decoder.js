const assert = require('assert')
const opcodes = require('./opcodes')

class Decoder {
  constructor(bin) {
    let pc = 0;
    let data = null
    this.stats = { njumpis: 0, nexts: 0, nexts: 0 }
    this.doWhile = new Set()
    this.whileDo = new Set()
    while (pc < bin.length) {
      const opcode = opcodes[bin[pc]]
      if (!opcode) break
      switch (opcode.name) {
        case 'PUSH': {
          data = bin.slice(pc + 1, pc + 1 + bin[pc] - 0x5f).toString('hex')
          pc += bin[pc] - 0x5f
          break
        }
        case 'JUMPI': {
          assert(data)
          const jumpdest = parseInt(data, 16)
          if (jumpdest < pc) {
            this.doWhile.add(pc)
          } else {
            let opcode = opcodes[bin[jumpdest - 1]]
            if (opcode.name == 'JUMP') {
              /* Push2 */
              opcode = opcodes[bin[jumpdest - 4]]
              if (opcode.name == 'PUSH') {
                const data = bin.slice(jumpdest - 3, jumpdest - 1).toString('hex')
                const loc = parseInt(data, 16)
                if (loc < pc) {
                  this.whileDo.add(pc)
                }
              }
              /* Push1 */
              opcode = opcodes[bin[jumpdest - 3]]
              if (opcode.name == 'PUSH') {
                const data = bin.slice(jumpdest - 2, jumpdest - 1).toString('hex')
                const loc = parseInt(data, 16)
                if (loc < pc) {
                  this.whileDo.add(pc)
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
      pc ++
    }
    console.log(this.stats)
    console.log(this.doWhile)
    console.log(this.whileDo)
  }
}

module.exports = Decoder
