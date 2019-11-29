const BN = require('bn.js')
const assert = require('assert')
const { prettify } = require('../shared')

const evaluate = (traces, symbol) => {
  const memory = {} 

  traces.forEach(([type, name, ...params]) => {
    const [address, value] = params
    assert(address[0] == 'const')
    memory[address[1].toNumber()] = value
  })

  switch (symbol[1]) {
    case 'MLOAD': {
      const address = symbol[2]
      assert(address[0] == 'const')
      return memory[address[1].toNumber()] || ['const', new BN(0)]
    }
  }
  return symbol
}

module.exports = evaluate
