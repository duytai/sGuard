const { range, uniq, map, forEach, keys } = require('lodash')
const assert = require('assert')
const hash = require('object-hash')
const { opcodes } = require('./evm')
const { hexToInt, logger } = require('./shared')

class Contract {
  constructor(bin, asm) {
    this.bin = bin
    this.asm = asm
  }

  execute(pc = 0, stack = [], path = [], memory = {}, visited = {}) {
    const opcode = opcodes[this.bin[pc]]
    if (!opcode) return
    const { name, ins, outs } = opcode
    path.push({ stack: [...stack], opcode, pc })
    visited[pc] = true
    switch (name) {
      case 'PUSH': {
        const dataLen = this.bin[pc] - 0x5f
        const data = this.bin.slice(pc + 1, pc + 1 + dataLen)
        stack.push(['const', data])
        range(pc + 1, pc + 1 + dataLen).forEach(i => visited[i] = true)
        this.execute(pc + 1 + dataLen, [...stack], [...path], {...memory}, visited)
        return
      }
      case 'POP': {
        stack.pop()
        this.execute(pc + 1, [...stack], [...path], {...memory}, visited)
        return
      }
      case 'JUMPI': {
        const [cond, label] = stack.splice(-ins) 
        assert(label[0] == 'const')
        const jumpdest = hexToInt(label[1])
        this.execute(pc + 1, [...stack], [...path], {...memory}, visited)
        assert(this.bin[jumpdest] && opcodes[this.bin[jumpdest]].name == 'JUMPDEST')
        this.execute(jumpdest, [...stack], [...path], {...memory}, visited)
        return
      }
      case 'JUMP': {
        const [label] = stack.splice(-ins)
        assert(label[0] == 'const')
        const jumpdest = hexToInt(label[1])
        assert(this.bin[jumpdest] && opcodes[this.bin[jumpdest]].name == 'JUMPDEST')
        this.execute(jumpdest, [...stack], [...path], {...memory}, visited)
        return
      }
      case 'SWAP': {
        const distance = this.bin[pc] - 0x8f
        const target = stack.length - 1 - distance
        const tmp = stack[target]
        assert(target >= 0)
        stack[target] = stack[stack.length - 1]
        stack[stack.length - 1] = tmp
        this.execute(pc + 1, [...stack], [...path], {...memory}, visited)
        return
      }
      case 'DUP': {
        const distance = this.bin[pc] - 0x7f
        const target = stack.length - distance
        assert(target >= 0)
        stack.push(stack[target])
        this.execute(pc + 1, [...stack], [...path], {...memory}, visited)
        return
      }
      case 'REVERT':
      case 'SELFDESTRUCT':
      case 'RETURN':
      case 'STOP':
      case 'INVALID': {
        return
      }
      case 'CALLVALUE':
      case 'CALLER':
      case 'ADDRESS':
      case 'NUMBER':
      case 'GAS':
      case 'ORIGIN':
      case 'TIMESTAMP':
      case 'DIFFICULTY':
      case 'GASPRICE':
      case 'COINBASE':
      case 'GASLIMIT':
      case 'CALLDATASIZE':
      case 'RETURNDATASIZE': {
        stack.push(['symbol', name])
        this.execute(pc + 1, [...stack], [...path], {...memory}, visited)
        return
      }
      case 'EXTCODESIZE':
      case 'EXTCODEHASH':
      case 'BLOCKHASH': {
        stack.push(['symbol', 'blockhash', stack.pop()])
        this.execute(pc + 1, [...stack], [...path], {...memory}, visited)
        return
      }
      case 'MSTORE': {
        const [memOffset, memValue] = stack.slice(-2).reverse()
        assert(memOffset[0] == 'const')
        const offset = hexToInt(memOffset[1])
        const value = hexToInt(memValue[1])
        memory[offset] = memValue
        this.execute(pc + 1, [...stack], [...path], {...memory}, visited)
        return
      }
      case 'ISZERO': {
        const item = stack.pop()
        if (item.type == 'const') {
          if (hexToInt(item.value) == 0) {
            stack.push(Buffer.from([1]))
          } else {
            stack.push(Buffer.from([0]))
          }
        } else {
          stack.push(['symbol', name, item])
        }
        return
      }
      default: {
        stack = stack.slice(0, stack.length - ins)
        range(outs).forEach(() => {
          stack.push(['const', Buffer.from([0])])
        })
        this.execute(pc + 1, [...stack], [...path], {...memory}, visited)
        return
      }
    }
  }
}

module.exports = Contract 
