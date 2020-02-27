const assert = require('assert')
const { uniqBy } = require('lodash')
const { prettify, formatSymbol } = require('./prettify')
const BN = require('bn.js')

const findSymbol = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (cond(symbol)) return [symbol]
  return params.reduce(
    (agg, symbol) => [...agg, ...findSymbol(symbol, cond)],
    [],
  )
}

const findOpcodeParams = (opcodeName, symbol) => {
  const ret = []
  let stack = [symbol]
  while (stack.length > 0) {
    const symbol = stack.pop()
    const [type, name, ...operands] = symbol
    if (type == 'symbol') {
      if (name == opcodeName) {
        ret.push(symbol)
        continue
      }
      stack = stack.concat(operands)
    }
  }
  return uniqBy(ret,formatSymbol)
}

module.exports = {
  findSymbol,
  findOpcodeParams,
}

