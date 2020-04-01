const assert = require('assert')
const { range } = require('lodash')
const logger = require('./logger')
const chalk = require('chalk')

const formatSymbol = ([type, name, ...params]) => {
  if (type == 'const') return name.toString(16) 
  if (!params.length) return name
  return `${name}(${params.map(p => formatSymbol(p)).join(',')})`
}

const formatWithoutTrace = ([type, name, ...params]) => {
  if (type == 'const') return name.toString(16) 
  if (!params.length) return name
  const config = { SLOAD: 1, MLOAD: 2, SUB: 2, ADD: 2, MUL: 2, DIV: 2 }
  const ps = config[name] ? params.slice(0, config[name]) : params
  return `${name}(${ps.map(p => formatWithoutTrace(p)).join(',')})`
}

const prettify = (values, spaceLen = 0) => {
  const space = range(0, spaceLen).map(i => ' ').join('') || ''
  values.forEach((v, idx) => logger.debug(`${space}${formatSymbol(v)}`))
}

module.exports = {
  prettify,
  formatSymbol,
  formatWithoutTrace,
  gb: chalk.green.bold,
}

