const assert = require('assert')
const { reverse, last, first } = require('lodash')
const chalk = require('chalk')
const { prettify, logger, findSymbol } = require('../shared')

const analyze = (symbol, trace) => {
  const root = { me: symbol, childs: [] }
  const [type, name, ...params] = symbol
  trace.prettify()
  logger.info(">> Full conversion")
  trace.applyConversion()
}

module.exports = {
  analyze,
} 
