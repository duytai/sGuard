const assert = require('assert')
const BN = require('bn.js')
const { reverse, findIndex } = require('lodash')
const {
  prettify,
  isConst,
  isConstWithValue,
  isMload,
} = require('../shared')

class LocalVariable {
  constructor(t, ep) {
    const locs = this.convert(t, ep)
    prettify(locs)
  }

  findArraySize(ep) {
    const { stack } = ep.find(({ opcode: { name }}) => name == 'JUMPI')
    const cond = stack.get(stack.size() - 2)
    const [_, name, left, right] = cond
    assert(name == 'LT')
    assert(isConst(right))
    return right[1].toNumber()
  }

  convert(t, ep) {
    if (isConst(t)) return [new Variable(`m_${t[1].toString(16)}`)]

    const mainStack = [t]
    const markerStack = [ep.size()]
    let concreteLocs = []

    while (mainStack.length > 0) {
      const t = mainStack.pop()
      switch (t[0]) {
        case 'const': {
          concreteLocs.push(t)
          break
        }
        default: {
          switch(t[1]) {
            case 'MLOAD': {
              const [loc, loadSize, _, epSize] = t.slice(2)
              markerStack.push(epSize[1].toNumber())
              mainStack.push(loc)
              break
            }
            case 'ADD': {
              const operands = t.slice(2)
              assert(operands[0][1] == 'MUL')
              mainStack.push(operands[1])
              break
            }
            default: {
              assert(false, `dont know ${t[1]}`)
            }
          }
        }
      }
    }

    while (markerStack.length > 0) {
      const epSize = markerStack.pop() 
      const subEp = ep.sub(epSize)
      const arraySize = this.findArraySize(subEp)
      const tmp = []
      concreteLocs.forEach(concreteLoc => {
        for (let i = 0; i < arraySize; i ++) {
          const loc = ['const', concreteLoc[1].add(new BN(0x20 * i))]
          if (ep.size() == epSize) {
            tmp.push(loc)
          } else {
            tmp.push(ep.trace.memValueAt(loc))
          }
        }
      })
      concreteLocs = tmp
    }

    return concreteLocs
  }
}

module.exports = LocalVariable 
