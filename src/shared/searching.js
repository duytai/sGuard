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

const lookBack = (source, startAt) => {
  const separators = [';', '{', '}']
  while (!separators.includes(source[startAt - 1])) startAt -= 1 
  return startAt
}


module.exports = {
  findSymbol,
  lookBack,
}

