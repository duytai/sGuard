const { range, uniq, map, forEach, keys } = require('lodash')
const BN = require('bn.js')
const assert = require('assert')
const { opcodes } = require('./evm')
const { logger } = require('./shared')

const TWO_POW256 = new BN('10000000000000000000000000000000000000000000000000000000000000000', 16)

class Contract {
  constructor(bin, asm) {
    this.bin = bin
    this.asm = asm
  }

  prettifyStack(stack) {
    stack.forEach(st => console.log(JSON.stringify(st)))
  }

  execute(pc = 0, stack = [], path = [], memory = [], visited = {}) {
    const opcode = opcodes[this.bin[pc]]
    if (!opcode) return
    const { name, ins, outs } = opcode
    path.push({ stack: [...stack], opcode, pc })
    visited[pc] = true
    switch (name) {
      case 'PUSH': {
        const dataLen = this.bin[pc] - 0x5f
        const data = this.bin.slice(pc + 1, pc + 1 + dataLen).toString('hex')
        stack.push(['const', new BN(data, 16)])
        range(pc + 1, pc + 1 + dataLen).forEach(i => visited[i] = true)
        this.execute(pc + 1 + dataLen, [...stack], [...path], [...memory], visited)
        return
      }
      case 'POP': {
        stack.pop()
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'JUMPI': {
        const [cond, label] = stack.splice(-ins) 
        assert(label[0] == 'const')
        const jumpdest = label[1].toNumber()
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        assert(this.bin[jumpdest] && opcodes[this.bin[jumpdest]].name == 'JUMPDEST')
        this.execute(jumpdest, [...stack], [...path], [...memory], visited)
        return
      }
      case 'JUMP': {
        const [label] = stack.splice(-ins)
        assert(label[0] == 'const')
        const jumpdest = label[1].toNumber()
        assert(this.bin[jumpdest] && opcodes[this.bin[jumpdest]].name == 'JUMPDEST')
        this.execute(jumpdest, [...stack], [...path], [...memory], visited)
        return
      }
      case 'SWAP': {
        const distance = this.bin[pc] - 0x8f
        const target = stack.length - 1 - distance
        const tmp = stack[target]
        assert(target >= 0)
        stack[target] = stack[stack.length - 1]
        stack[stack.length - 1] = tmp
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'DUP': {
        const distance = this.bin[pc] - 0x7f
        const target = stack.length - distance
        assert(target >= 0)
        stack.push(stack[target])
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
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
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'EXTCODESIZE':
      case 'EXTCODEHASH':
      case 'BLOCKHASH': {
        stack.push(['symbol', 'blockhash', stack.pop()])
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'MSTORE': {
        const [memOffset, memValue] = stack.slice(-2).reverse()
        memory.push(['symbol', name, memOffset, memValue])
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'ISZERO': {
        const x = stack.pop()
        if (x[0] == 'const') {
          stack.push(x[1].isZero() ? 1 : 0)
        } else {
          stack.push(['symbol', name, x])
        }
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'SHR': {
        const [x, y] = stack.splice(-2).reverse()
        if (x[0] != 'const' || y[0] != 'const') {
          stack.push(['symbol', name, x, y])
        } else {
          if (x[1].gten(256)) {
            stack.push(['const', new BN(0)])
          } else {
            const r = y[1].shrn(x[1].toNumber())
            stack.push(['const', r])
          }
        }
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'CALLDATALOAD': {
        stack.push(['symbol', name, stack.pop()])
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'EQ': {
        const [x, y] = stack.splice(-2).reverse()
        if (x[0] != 'const' || y[0] != 'const') {
          stack.push(['symbol', name, x, y])
        } else {
          stack.push(x[1].eq(y[1]) ? BN(1) : BN(0))
        }
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'AND': {
        const [x, y] = stack.splice(-2).reverse()
        if (x[0] != 'const' || y[0] != 'const') {
          stack.push(['symbol', name, x, y])
        } else {
          stack.push(['const', x.and(y)])
        }
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'JUMPDEST': {
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'LT': {
        const [x, y] = stack.splice(-2).reverse()
        if (x[0] != 'const' || y[0] != 'const') {
          stack.push(['symbol', name, x, y])
        } else {
          stack.push(['const', x.lt(y) ? new BN(1) : new BN(0)])
        }
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'MUL': {
        const [x, y] = stack.splice(-2).reverse()
        if (x[0] != 'const' || y[0] != 'const') {
          stack.push(['symbol', name, x, y])
        } else {
          stack.push(['const', x.mul(y).mod(TWO_POW256)])
        }
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'MLOAD': {
        stack.push(['symbol', name, stack.pop()])
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'SUB': {
        const [x, y] = stack.splice(-2).reverse()
        if (x[0] != 'const' || y[0] != 'const') {
          stack.push(['symbol', name, x, y])
        } else {
          stack.push(['const', x.sub(y).toTwos(256)])
        }
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      case 'CALL': {
        const [
          gasLimit,
          toAddress,
          value,
          inOffset,
          inLength,
          outOffset,
          outLength,
        ] = stack.splice(-7).reverse()
        stack.push(['symbol', name, gasLimit, toAddress, value, inOffset, inLength, outOffset, outLength])
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
      default: {
        console.log(name)
        console.log(ins)
        stack = stack.slice(0, stack.length - ins)
        range(outs).forEach(() => {
          stack.push(['const', new BN(0)])
        })
        this.execute(pc + 1, [...stack], [...path], [...memory], visited)
        return
      }
    }
  }
}

module.exports = Contract 
