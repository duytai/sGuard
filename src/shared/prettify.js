const assert = require('assert')
const { range } = require('lodash')
const logger = require('./logger')
const chalk = require('chalk')

const formatSymbol = ([type, name, ...params]) => {
  if (type == 'const') return name.toString(16) 
  if (!params.length) return name
  return `${name}(${params.map(p => formatSymbol(p)).join(',')})`
}

const formatSymbolWithoutEpSize = ([type, name, ...params]) => {
  if (type == 'const') return name.toString(16) 
  if (!params.length) return name
  if (['SLOAD', 'MLOAD'].includes(name)) params = params.slice(0, 3)
  return `${name}(${params.map(p => formatSymbolWithoutEpSize(p)).join(',')})`
}

const prettify = (values, spaceLen = 0) => {
  const space = range(0, spaceLen).map(i => ' ').join('') || ''
  values.forEach((v, idx) => logger.debug(`${space}${formatSymbol(v)}`))
}

module.exports = {
  prettify,
  formatSymbol,
  formatSymbolWithoutEpSize,
  gb: chalk.green.bold,
}

