const { prettify, logger } = require('./shared')

const find = (symbol, cond) => {
  if (cond(symbol)) return [symbol]
  const [type, name, ...params] = symbol
  return params.reduce(
    (agg, symbol) => [...agg, ...find(symbol, cond)],
    []
  )
}

const analyzeStorage = (symbol, traces) => {
  const [type, name, ...params] = symbol
  const [address, position] = params
  console.log(position)
}

const analyze = (symbol, traces) => {
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
      const sloads = find(symbol, ([type, name]) => type == 'symbol' && name == 'SLOAD')
      sloads.forEach(sload => analyzeStorage(sload, traces))
      break
    }
  }
}

module.exports = {
  analyze,
} 
