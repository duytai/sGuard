const BN = require('bn.js')
const { isEmpty } = require('lodash')
const utils = require('ethereumjs-util')
const assert = require('assert')
const opcodes = require('./opcodes')
const Ep = require('./ep')
const { logger } = require('../shared')

const TWO_POW256 = new BN('10000000000000000000000000000000000000000000000000000000000000000', 16)
const MAX_INTEGER = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)

class Evm {
  constructor(bin, decoder) {
    this.bin = bin
    this.decoder = decoder
    this.endPoints = []
    this.jumpis = new Set()
  }

  start() {
    const { stats: { njumpis } } = this.decoder
    this.execute()
    return {
      endPoints: this.endPoints,
      njumpis: njumpis || 0,
      cjumpis: this.jumpis.size,
    }
  }

  execute() {
    const execStack = [ { pc: 0, ep: new Ep() } ]
    while (execStack.length) {
      let { pc, ep } = execStack.pop()
      let { stack, trace } = ep
      let isReturned = false

      let iters = 0
      if (!isEmpty(ep.boundary)) {
        iters = Math.max.apply(null, Object.values(ep.boundary))
      }
      if (process.send) {
        process.send({ sevm: { stack: execStack.length, iters } })
      }

      while (true && !isReturned) {
        const opcode = opcodes[this.bin[pc]]
        if (!opcode) break
        const { name, ins, outs } = opcode
        ep.add({ opcode: { ...opcode, opVal: this.bin[pc] }, pc })
        switch (name) {
          case 'PUSH': {
            const dataLen = this.bin[pc] - 0x5f
            const data = this.bin.slice(pc + 1, pc + 1 + dataLen).toString('hex')
            stack.push(['const', new BN(data, 16)])
            pc += dataLen
            break
          }
          case 'POP': {
            stack.pop()
            break
          }
          case 'LOG': {
            stack.popN(ins)
            break
          }
          case 'JUMPI': {
            const [label, cond] = stack.popN(ins)
            assert(label[0] == 'const')
            const jumpdest = label[1].toNumber()
            this.jumpis.add(pc)
            if (ep.distance(pc) >= 0) {
              execStack.push({ pc: jumpdest, ep: ep.clone() })
              execStack.push({ pc: pc + 1, ep: ep.clone() })
            }
            isReturned = true
            break
          }
          case 'JUMP': {
            const label = stack.pop()
            assert(label[0] == 'const')
            const jumpdest = label[1].toNumber()
            execStack.push({ pc: jumpdest, ep: ep.clone() })
            isReturned = true
            break
          }
          case 'SWAP': {
            stack.swapN(this.bin[pc] - 0x8f)
            break
          }
          case 'DUP': {
            stack.dupN(this.bin[pc] - 0x7f)
            break
          }
          case 'REVERT':
          case 'INVALID':
          case 'SELFDESTRUCT':
          case 'RETURN':
          case 'STOP': {
            this.endPoints.push(ep.clone())
            isReturned = true
            break
          }
          case 'MSIZE':
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
          case 'SELFBALANCE':
          case 'RETURNDATASIZE': {
            const epSize = ['const', new BN(ep.size())]
            stack.push(['symbol', name, epSize])
            break
          }
          case 'BALANCE':
          case 'EXTCODESIZE':
          case 'EXTCODEHASH':
          case 'BLOCKHASH': {
            const epSize = ['const', new BN(ep.size())]
            stack.push(['symbol', name, stack.pop(), epSize])
            break
          }
          case 'CALLDATALOAD': {
            const dataOffset = stack.pop()
            const size = ['const', new BN(32)]
            if (dataOffset[0] == 'const') {
              const offset = dataOffset[1].toNumber()
              if (offset == 0 || (offset - 4) % 0x20 == 0) {
                stack.push(['symbol', name, dataOffset, size])
                break
              }
            }
            stack.push(['const', new BN('02', 16)])
            break
          }
          case 'CALLDATACOPY': {
            const [memLoc, dataOffset, dataLength] = stack.popN(ins)
            const memValue = ['symbol', 'CALLDATALOAD', dataOffset, dataLength]
            const t = ['symbol', 'MSTORE', memLoc, memValue, dataLength]
            const vTrackingPos = stack.size() - 1 + 2
            const kTrackingPos = stack.size() - 1 + 3
            const epIdx = ep.size() - 1
            trace.add({ t, pc, epIdx, vTrackingPos, kTrackingPos })
            break
          }
          case 'MSTORE': {
            const [memLoc, memValue] = stack.popN(ins)
            const size = ['const', new BN(32)]
            const vTrackingPos = stack.size() - 1 + 1
            const kTrackingPos = stack.size() - 1 + 2
            const epIdx = ep.size() - 1
            if (memLoc[0] == 'const' && memLoc[1].eq(new BN(0x40))) {
              if (memValue[0] != 'const') {
                const lastValue = trace.memValueAt(memLoc) 
                assert(lastValue[0] == 'const')
                const v = ['const', new BN(lastValue[1].add(new BN('a0', 16)))]
                const t = ['symbol', name, memLoc, v, size]
                trace.add({ t, pc, epIdx, vTrackingPos, kTrackingPos })
                break
              }
            }
            const t = ['symbol', name, memLoc, memValue, size]
            trace.add({ t, pc, epIdx, vTrackingPos, kTrackingPos })
            break
          }
          case 'MLOAD': {
            const memLoc = stack.pop()
            const size = ['const', new BN(32)]
            const traceSize = ['const', new BN(trace.size())]
            const epSize = ['const', new BN(ep.size())]
            if (memLoc[0] == 'const' && memLoc[1].eq(new BN(0x40))) {
              stack.push(trace.memValueAt(memLoc))
              break
            }
            stack.push(['symbol', name, memLoc, size, traceSize, epSize])
            break
          }
          case 'SSTORE': {
            const [x, y] = stack.popN(ins)
            const t = ['symbol', name, x, y]
            const vTrackingPos = stack.size() - 1 + 1
            const kTrackingPos = stack.size() - 1 + 2
            const epIdx = ep.size() - 1
            trace.add({ t, pc, epIdx, vTrackingPos, kTrackingPos })
            break
          }
          case 'SLOAD': {
            const storageLoc = stack.pop()
            const traceSize = ['const', new BN(trace.size())]
            const epSize = ['const', new BN(ep.size())]
            stack.push(['symbol', name, storageLoc, traceSize, epSize])
            break
          }
          case 'ISZERO': {
            const x = stack.pop()
            if (x[0] == 'const') {
              stack.push(['const', x[1].isZero() ? new BN(1) : new BN(0)])
            } else {
              stack.push(['symbol', name, x])
            }
            break
          }
          case 'SHL': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              if (x[1].gten(256)) {
                stack.push(['const', new BN(0)])
              } else {
                const r = y[1].shln(x[1].toNumber()).iand(MAX_INTEGER)
                stack.push(['const', r])
              }
            }
            break
          }
          case 'SHR': {
            const [x, y] = stack.popN(ins)
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
            break
          }
          case 'EQ': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              stack.push(['const', x[1].eq(y[1]) ? new BN(1) : new BN(0)])
            }
            break
          }
          case 'AND': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              stack.push(['const', x[1].and(y[1])])
            }
            break
          }
          case 'JUMPDEST': {
            break
          }
          case 'LT': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              stack.push(['const', x[1].lt(y[1]) ? new BN(1) : new BN(0)])
            }
            break
          }
          case 'SLT': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              stack.push(['const', x[1].fromTwos(256).lt(y[1].fromTwos(256)) ? new BN(1) : new BN(0)])
            }
            break
          }
          case 'GT': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              stack.push(['const', x[1].gt(y[1]) ? new BN(1) : new BN(0)])
            }
            break
          }
          case 'MUL': {
            const [x, y] = stack.popN(ins)
            const epSize = ['const', new BN(ep.size())]
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y, epSize])
            } else {
              stack.push(['const', x[1].mul(y[1]).mod(TWO_POW256)])
            }
            break
          }
          case 'SUB': {
            const [x, y] = stack.popN(ins)
            const epSize = ['const', new BN(ep.size())]
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y, epSize])
            } else {
              stack.push(['const', x[1].sub(y[1]).toTwos(256)])
            }
            break
          }
          case 'ADD': {
            const [x, y] = stack.popN(ins)
            const epSize = ['const', new BN(ep.size())]
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y, epSize])
            } else {
              stack.push(['const', x[1].add(y[1]).mod(TWO_POW256)])
            }
            break
          }
          case 'DIV': {
            const [x, y] = stack.popN(ins)
            const epSize = ['const', new BN(ep.size())]
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y, epSize])
            } else {
              if (y[1].isZero()) {
                stack.push(y)
              } else {
                stack.push(['const', x[1].div(y[1])])
              }
            }
            break
          }
          case 'SDIV': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              if (y[1].isZero()) {
                stack.push(y)
              } else {
                const a = x[1].fromTwos(256)
                const b = y[1].fromTwos(256)
                const r = a.div(b).toTwos(256)
                stack.push(['const', r])
              }
            }
            break
          }
          case 'MOD': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              if (y[1].isZero()) {
                stack.push(y)
              } else {
                stack.push(['const', x[1].mod(y[1])])
              }
            }
            break
          }
          case 'SMOD': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              if (y[1].isZero()) {
                stack.push(y)
              } else {
                const a = x[1].fromTwos(256)
                const b = y[1].fromTwos(256)
                let r = a.abs().mod(b.abs())
                if (a.isNeg()) {
                  r = r.ineg()
                }
                r = r.toTwos(256)
                stack.push(['const', r])
              }
            }
            break
          }
          case 'ADDMOD': {
            const [x, y, z] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const' || z[0] != 'const') {
              stack.push(['symbol', name, x, y, z])
            } else {
              if (z[1].isZero()) {
                stack.push(z)
              } else {
                stack.push(['const', x.add(y).mod(z)])
              }
            }
            break
          }
            /// keccak256 or sha3 of storage
          case 'SHA3': {
            const [x, y] = stack.popN(ins)
            const traceSize = ['const', new BN(trace.size())]
            const epSize = ['const', new BN(ep.size())]
            const mload = ['symbol', 'MLOAD', x, y, traceSize, epSize]
            assert(x[0] == 'const')
            stack.push(['symbol', name, mload])
            break
          }
          case 'CODESIZE': {
            stack.push(['const', new BN(this.bin.length)])
            break
          }
          case 'EXP': {
            const [base, exponent] = stack.popN(ins)
            const epSize = ['const', new BN(ep.size())]
            if (exponent[0] == 'const' && exponent[1].isZero()) {
              stack.push(['const', new BN(1)])
            } else if (base[0] == 'const' && base[1].isZero()) {
              stack.push(['const', new BN(0)])
            } else {
              if (base[0] != 'const' || exponent[0] != 'const') {
                stack.push(['symbol', name, base, exponent, epSize])
              } else {
                const byteLength = exponent[1].byteLength()
                assert(byteLength >= 1 && byteLength <= 32)
                const m = BN.red(TWO_POW256)
                const redBase = base[1].toRed(m)
                const r = redBase.redPow(exponent[1])
                stack.push(['const', r.fromRed()])
              }
            }
            break
          }
          case 'NOT': {
            const x = stack.pop()
            if (x[0] != 'const') {
              stack.push(['symbol', name, x])
            } else {
              const r = x[1].notn(256)
              stack.push(['const', r])
            }
            break
          }
          case 'OR': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              const r = x[1].or(y[1])
              stack.push(['const', r])
            }
            break
          }
          case 'XOR': {
            const [x, y] = stack.popN(ins)
            if (x[0] != 'const' || y[0] != 'const') {
              stack.push(['symbol', name, x, y])
            } else {
              const r = x[1].xor(y[1])
              stack.push(['const', r])
            }
            break
          }
          case 'STATICCALL':
          case 'DELEGATECALL': {
            const [
              gasLimit,
              toAddress,
              inOffset,
              inLength,
              outOffset,
              outLength,
            ] = stack.popN(ins)
            const traceSize = ['const', new BN(trace.size())]
            const epSize = ['const', new BN(ep.size())]
            const mload = ['symbol', 'MLOAD', inOffset, inLength, traceSize, epSize]
            stack.push(['symbol', name, gasLimit, toAddress, mload, outOffset, outLength])
            break
          }
          case 'CALLCODE':
          case 'CALL': {
            const [
              gasLimit,
              toAddress,
              value,
              inOffset,
              inLength,
              outOffset,
              outLength,
            ] = stack.popN(ins)
            const traceSize = ['const', new BN(trace.size())]
            const epSize = ['const', new BN(ep.size())]
            const mload = ['symbol', 'MLOAD', inOffset, inLength, traceSize, epSize]
            stack.push(['symbol', name, gasLimit, toAddress, value, mload, outOffset, outLength])
            break
          }
          case 'CREATE': {
            const [
              value,
              inOffset,
              inLength,
            ] = stack.popN(ins)
            const traceSize = ['const', new BN(trace.size())]
            const epSize = ['const', new BN(ep.size())]
            const mload = ['symbol', 'MLOAD', inOffset, inLength, traceSize, epSize]
            stack.push(['symbol', name, value, mload])
            break
          }
          case 'CREATE2': {
            const [
              value,
              inOffset,
              inLength,
              bitValue,
            ] = stack.popN(ins)
            const traceSize = ['const', new BN(trace.size())]
            const epSize = ['const', new BN(ep.size())]
            const mload = ['symbol', 'MLOAD', inOffset, inLength, traceSize, epSize]
            stack.push(['symbol', name, value, mload, bitValue])
            break
          }
          case 'RETURNDATACOPY': {
            const [memOffset, returnDataOffset, len] = stack.popN(ins)
            const data = ['symbol', 'RETURNDATA', returnDataOffset, len]
            const t = ['symbol', 'MSTORE', memOffset, data, len]
            const vTrackingPos = stack.size() - 1 + 2
            const kTrackingPos = stack.size() - 1 + 3
            const epIdx = ep.size() - 1
            trace.add({ t, pc, epIdx, vTrackingPos, kTrackingPos })
            break
          }
          default: {
            // logger.error(`Missing ${name}`)
            const inputs = ins > 0 ? stack.popN(ins) : []
            assert(outs <= 1)
            if (outs) {
              stack.push(['symbol', name, ...inputs])
            }
            break
          }
        }
        pc = pc + 1
      }
    }
  }
}

module.exports = Evm 
