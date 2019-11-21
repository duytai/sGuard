const assert = require('assert')
const { hexToInt } = require('./shared')
const { EVM } = require('./kind')

module.exports = {
  STOP() {
  },
  ADD() {
  },
  MUL() {
  },
  SUB() {
  },
  DIV() {
  },
  SDIV() {
  },
  MOD() {
  },
  SMOD() {
  },
  ADDMOD() {
  },
  MULMOD() {
  },
  EXP() {
  },
  SIGNEXTEND() {
  },
  LT() {
  },
  GT() {
  },
  SLT() {
  },
  SGT() {
  },
  EQ() {
  },
  ISZERO() {
  },
  AND() {
  },
  OR() {
  },
  XOR() {
  },
  NOT() {
  },
  BYTE() {
  },
  SHL() {
  },
  SHR() {
  },
  SAR() {
  },
  SHA3() {
  },
  ADDRESS() {
  },
  BALANCE() {
  },
  ORIGIN() {
  },
  CALLER() {
  },
  CALLVALUE() {
  },
  CALLDATALOAD() {
  },
  CALLDATASIZE({ stack }) {
    stack.push({
      kind: EVM.VARIABLE,
    })
  },
  CALLDATACOPY() {
  },
  CODESIZE() {
  },
  CODECOPY() {
  },
  EXTCODESIZE() {
  },
  EXTCODECOPY() {
  },
  EXTCODEHASH() {
  },
  RETURNDATASIZE() {
  },
  RETURNDATACOPY() {
  },
  GASPRICE() {
  },
  BLOCKHASH() {
  },
  COINBASE() {
  },
  TIMESTAMP() {
  },
  NUMBER() {
  },
  DIFFICULTY() {
  },
  GASLIMIT() {
  },
  CHAINID() {
  },
  SELFBALANCE() {
  },
  POP() {
  },
  MLOAD() {
  },
  MSTORE({ stack, memory }) {
    const [offset, word] = stack.popN(2)
    switch (offset.kind) {
      case EVM.CONST: {
        memory.write(hexToInt(offset.value), 32, word)
        break
      }
      default: {
        assert(false, `Unkown kind ${offset.kind}`)
      }
    }
  },
  MSTORE8() {
  },
  SLOAD() {
  },
  SSTORE() {
  },
  JUMP() {
  },
  JUMPI() {
  },
  PC() {
  },
  MSIZE() {
  },
  GAS() {
  },
  JUMPDEST() {
  },
  PUSH(state, value) {
    state.stack.push(value)
  },
  DUP() {
  },
  SWAP() {
  },
  LOG() {
  },
  CREATE() {
  },
  CREATE2() {
  },
  CALL() {
  },
  CALLCODE() {
  },
  DELEGATECALL() {
  },
  STATICCALL() {
  },
  RETURN() {
  },
  REVERT() {
  },
  SELFDESTRUCT() {
  }
}
