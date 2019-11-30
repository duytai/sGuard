const { prettify, logger } = require('./shared')

const find = (symbol, cond) => {
  if (cond(symbol)) return [symbol]
  const [type, name, ...params] = symbol
  return params.reduce(
    (agg, symbol) => [...agg, ...find(symbol, cond)],
    []
  )
}

const analyze = (symbol, traces) => {
  console.log(symbol)
  const [type, name, ...params] = symbol 
  switch (type) {
    case 'const': {
      logger.info(`No dependency since wei is ${JSON.stringify(value)}`)
      break
    }
    case 'symbol': {
      const foundSymbols = find(symbol, ([type, name]) => type == 'symbol' && name == 'NUMBER')
      if (foundSymbols.length > 0) {
        logger.info(`Number dependency since wei is ${JSON.stringify(symbol)}`)
      }
      break
    }
  }
}

module.exports = {
  analyze,
} 
