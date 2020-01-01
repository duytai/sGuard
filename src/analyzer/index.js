const assert = require('assert')
const { reverse, last, first } = require('lodash')
const chalk = require('chalk')
const { prettify, logger, findSymbol } = require('../shared')

const analyze = (symbol, trace) => {
  const root = { me: symbol, childs: [] }
  const [type, name, ...params] = symbol
  trace.add(symbol)
  trace.prettify()
  // logger.info(`>> Build dependency tree`)
  // buildDependencyTree(root, traces)
  // logger.info(`>> Final tree`)
  // prettifyTree(root)
}

module.exports = {
  analyze,
} 
