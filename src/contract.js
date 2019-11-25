const { range, uniq, map, forEach, keys } = require('lodash')
const assert = require('assert')
const hash = require('object-hash')
const { opcodes } = require('./evm')
const { hexToInt, logger } = require('./shared')

class Contract {
  constructor(bin, asm) {
    this.bin = bin
    this.asm = asm
    this.jumpdests = []
    this.findJumpdests()
    this.execute(0)
  }

  findJumpdests() {
    const counter = { pc: 0, idx: 0 }
    const asm = this.asm.filter(({ name }) => name != 'tag')
    while (counter.pc < this.bin.length && counter.idx < asm.length) {
      const opcode = opcodes[this.bin[counter.pc]]
      switch (opcode.name) {
        case 'PUSH': {
          counter.pc += this.bin[counter.pc] - 0x5f
          break
        }
        case 'JUMPDEST': {
          this.jumpdests.push(counter.pc)
          break
        }
      }
      counter.pc ++
      counter.idx ++
    }
  }

  execute(pc = 0, stack = [], path = [], visited = {}, jumpdests = {}) {
    const opcode = opcodes[this.bin[pc]]
    if (!opcode) return
    console.log(keys(jumpdests))
    console.log(this.jumpdests)
    console.log('----')
    const { name, ins, outs } = opcode
    path.push({ stack: [...stack], opcode, pc })
    visited[pc] = true
    switch (name) {
      case 'PUSH': {
        const dataLen = this.bin[pc] - 0x5f
        const data = this.bin.slice(pc + 1, pc + 1 + dataLen)
        stack.push(data)
        range(pc + 1, pc + 1 + dataLen).forEach(i => visited[i] = true)
        this.execute(pc + 1 + dataLen, [...stack], [...path], visited, jumpdests)
        return
      }
      case 'POP': {
        stack.pop()
        this.execute(pc + 1, [...stack], [...path], visited, jumpdests)
        return
      }
      case 'JUMPI': {
        const [cond, label] = stack.splice(-ins) 
        const jumpdest = hexToInt(label)
        jumpdests[jumpdest] = true
        this.execute(pc + 1, [...stack], [...path], visited, jumpdests)
        assert(this.bin[jumpdest] && opcodes[this.bin[jumpdest]].name == 'JUMPDEST')
        this.execute(jumpdest, [...stack], [...path], visited, jumpdests)
        return
      }
      case 'JUMP': {
        const [label] = stack.splice(-ins)
        const jumpdest = hexToInt(label)
        jumpdests[jumpdest] = true
        assert(this.bin[jumpdest] && opcodes[this.bin[jumpdest]].name == 'JUMPDEST')
        this.execute(jumpdest, [...stack], [...path], visited, jumpdests)
        return
      }
      case 'SWAP': {
        const distance = this.bin[pc] - 0x8f
        const target = stack.length - 1 - distance
        const tmp = stack[target]
        assert(target >= 0)
        stack[target] = stack[stack.length - 1]
        stack[stack.length - 1] = tmp
        this.execute(pc + 1, [...stack], [...path], visited, jumpdests)
        return
      }
      case 'DUP': {
        const distance = this.bin[pc] - 0x7f
        const target = stack.length - distance
        assert(target >= 0)
        stack.push(stack[target])
        this.execute(pc + 1, [...stack], [...path], visited, jumpdests)
        return
      }
      case 'REVERT':
      case 'SELFDESTRUCT':
      case 'RETURN':
      case 'STOP':
      case 'INVALID': {
        return
      }
      default: {
        stack = stack.slice(0, stack.length - ins)
        range(outs).forEach(() => {
          stack.push(Buffer.from('00', 'hex'))
        })
        this.execute(pc + 1, [...stack], [...path], visited, jumpdests)
        return
      }
    }
  }
}

module.exports = Contract 
