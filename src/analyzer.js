const assert = require('assert')
const { reverse } = require('lodash')
const {
  prettify,
  logger,
  isConstWithValue,
} = require('./shared')

const find = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (cond(symbol)) return [symbol]
  return params.reduce(
    (agg, symbol) => [...agg, ...find(symbol, cond)],
    [],
  )
}

const analyze = (symbol, traces) => {
  prettify(traces)
  const [type, name, ...params] = symbol 
  switch (type) {
    case 'const': {
      logger.info(`No dependency since wei is ${JSON.stringify(symbol)}`)
      break
    }
    case 'symbol': {
      const foundSymbols = find(symbol, ([type, name]) => type == 'symbol' && name == 'NUMBER')
      if (foundSymbols.length > 0) {
        logger.info(`Number dependency since wei is ${JSON.stringify(symbol)}`)
      } else {
        console.log('////BEFORE')
        prettify([symbol])
      }
      break
    }
  }
}

module.exports = {
  analyze,
} 
