const { prettify } = require('./prettify')
const BN = require('bn.js')

const findSymbol = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (cond(symbol)) return [symbol]
  return params.reduce(
    (agg, symbol) => [...agg, ...findSymbol(symbol, cond)],
    [],
  )
}

/// Find all matches
const findAllMatches = (str, reg) => {
  const result = []
  do {
    matches = reg.exec(str)
    if (matches) {
      result.push(matches)
    }
  } while(matches)
  return result
}

/// Find outOfIndex condition
const findIndexRange = (ep, bin, opcodes) => {
  let isAssert = false
  for (let i = ep.size() - 1; i >= 0; i--) {
    const { stack, opcode: { name }, pc } = ep.get(i)
    if (name == 'JUMPI') {
      const opcode = opcodes[bin[pc + 1]]
      if (opcode.name == 'INVALID') isAssert = true
    }
    if (name == 'LT' && isAssert) {
      const left = stack.get(stack.size() - 1)
      const right = stack.get(stack.size() - 2)
      prettify([left, right])
      console.log('-----')
      if (right[0] == 'const') return right
    }
  }
  return ['const', new BN(0)]
}

module.exports = {
  findSymbol,
  findIndexRange,
  findAllMatches,
}

