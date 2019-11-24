const { range } = require('lodash')
const assert = require('assert')
const { opcodes } = require('./evm')
const { hexToInt, logger } = require('./shared')

class Contract {
  constructor(bin) {
    this.bin = bin
    this.paths = []
    this.execute(0)
    this.paths.forEach(p => {
      this.log(p)
    })
  }

  log(path) {
    logger.info('--BEGIN--')
    path.forEach(({ stack, opcode, pc }) => {
      console.log(stack)
      console.log(`${Number(pc).toString(16)} - ${opcode.name}`)
      console.log('------')
    })
  }

  execute(pc = 0, stack = [], path = []) {
    const opcode = opcodes[this.bin[pc]]
    if (!opcode) return
    const { name, ins, outs } = opcode
    path.push({
      stack: [...stack],
      opcode,
      pc
    })
    switch (name) {
      case 'PUSH': {
        const dataLen = this.bin[pc] - 0x5f
        const data = this.bin.slice(pc + 1, pc + 1 + dataLen)
        stack.push(data)
        return this.execute(pc + 1 + dataLen, [...stack], [...path])
      }
      case 'POP': {
        stack.pop()
        return this.execute(pc + 1, [...stack], [...path])
      }
      case 'JUMPI': {
        const [cond, label] = stack.splice(-ins) 
        const jumpdest = hexToInt(label)
        this.execute(pc + 1, [...stack], [...path])
        assert(this.bin[jumpdest] && opcodes[this.bin[jumpdest]].name == 'JUMPDEST')
        return this.execute(jumpdest, [...stack], [...path])
      }
      case 'SWAP': {
        const distance = this.bin[pc] - 0x8f
        const target = stack.length - 1 - distance
        const tmp = stack[target]
        assert(target >= 0)
        stack[target] = stack[stack.length - 1]
        stack[stack.length - 1] = tmp
        return this.execute(pc + 1, [...stack], [...path])
      }
      case 'DUP': {
        const distance = this.bin[pc] - 0x7f
        const target = stack.length - distance
        assert(target >= 0)
        stack.push(stack[target])
        return this.execute(pc + 1, [...stack], [...path])
      }
      case 'JUMP': {
        const [label] = stack.splice(-ins)
        const jumpdest = hexToInt(label)
        assert(this.bin[jumpdest] && opcodes[this.bin[jumpdest]].name == 'JUMPDEST')
        return this.execute(jumpdest, [...stack], [...path])
      }
      case 'REVERT':
      case 'SELFDESTRUCT':
      case 'RETURN':
      case 'STOP':
      case 'INVALID': {
        this.paths.push(path)
        return
      }
      default: {
        stack = stack.slice(0, stack.length - ins)
        range(outs).forEach(() => {
          stack.push(Buffer.from('00', 'hex'))
        })
        return this.execute(pc + 1, [...stack], [...path])
      }
    }
  }
}

module.exports = Contract 
