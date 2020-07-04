const assert = require('assert')
const { uniqBy, lastIndexOf } = require('lodash')
const ethutil = require('ethereumjs-util')
const { prettify, formatSymbol } = require('./prettify')
const BN = require('bn.js')
const jp = require('jsonpath')

const findSymbol = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (cond(symbol)) return [symbol]
  return params.reduce(
    (agg, symbol) => [...agg, ...findSymbol(symbol, cond)],
    [],
  )
}

const findSymbols = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (type == 'const') return []
  return params.reduce(
    (agg, symbol) => [...agg, ...findSymbols(symbol, cond)],
    cond(symbol) ? [symbol] : [],
  )
} 

const addFunctionSelector = (ast) => {
  const responses = jp.query(ast, `$..children[?(@.name=="FunctionDefinition")]`)
  responses.forEach(({ children, attributes }) => {
    const { name: functionName } = attributes
    const params = children.find(({ name }) => name == 'ParameterList')
    assert(params)
    const d = params.children.map(c => c.attributes.type)
    const functionSignature = `${functionName}(${d.join(',')})`
    const functionSelector = functionName
      ? ethutil.keccak(functionSignature).toString('hex').slice(0, 8)
      : 'fallback'
    attributes.functionSelector = functionSelector
  })
}

module.exports = {
  findSymbol,
  findSymbols,
  addFunctionSelector,
}

