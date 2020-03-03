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

module.exports = {
  findSymbol,
}

