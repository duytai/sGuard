const assert = require('assert')
const { range } = require('lodash')
const logger = require('./logger')
const chalk = require('chalk')

const formatSymbol = ([type, name, ...params]) => {
  if (type == 'const') return name.toString(16) 
  if (!params.length) return name
  return `${name}(${params.map(p => formatSymbol(p)).join(',')})`
}

const prettify = (values, spaceLen = 0) => {
  const space = range(0, spaceLen).map(i => ' ').join('') || ''
  values.forEach((v, idx) => logger.debug(`${space}${formatSymbol(v)}`))
}

module.exports = {
  prettify,
  formatSymbol,
  gb: chalk.green.bold,
}

