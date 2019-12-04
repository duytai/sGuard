const assert = require('assert')
const { reverse } = require('lodash')
const {
  prettify,
  logger,
  isConstWithValue,
  isConst,
  isSymbol,
} = require('./shared')

const find = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (cond(symbol)) return [symbol]
  return params.reduce(
    (agg, symbol) => [...agg, ...find(symbol, cond)],
    [],
  )
}

const buildDependencyTree = (node, traces) => {
  const { me, childs } = node
  assert(isSymbol(me))
  assert(!childs.length)
  switch (me[1]) {
    case 'MLOAD': {
      break
    }
    case 'SLOAD': {
      console.log('>>SLOAD')
      prettify([me])
      break
    }
    default: {
      const symbols = find(me, ([type, name]) => type == 'symbol' && ['SLOAD', 'MLOAD'].includes(name))
      symbols.forEach(symbol => {
        const newNode = { me: symbol, childs: [] }
        buildDependencyTree(newNode, traces)
        childs.push(newNode)
      })
    }
  }
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
        const root = { me: symbol, childs: [] }
        buildDependencyTree(root, traces)
      }
      break
    }
  }
}

module.exports = {
  analyze,
} 
