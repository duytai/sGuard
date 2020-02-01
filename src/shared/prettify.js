const { range } = require('lodash')
const logger = require('./logger')

const formatSymbol = ([type, name, ...params]) => {
  if (type == 'const') return name.toString(16) 
  if (!params.length) return name
  return `${name}(${params.map(p => formatSymbol(p)).join(',')})`
}

const formatSymbolWithoutTraceInfo = ([type, name, ...params]) => {
  if (type == 'const') return name.toString(16) 
  if (!params.length) return name
  switch (name) {
    case 'SLOAD': {
      const subParams = params.slice(0, 1)
      return `${name}(${subParams.map(p => formatSymbolWithoutTraceInfo(p)).join(',')})`
    }
    case 'MLOAD': {
      const subParams = params.slice(0, 2)
      return `${name}(${subParams.map(p => formatSymbolWithoutTraceInfo(p)).join(',')})`
    }
    default: {
      return `${name}(${params.map(p => formatSymbolWithoutTraceInfo(p)).join(',')})`
    }
  }
}

const prettify = (values, spaceLen = 0) => {
  const space = range(0, spaceLen).map(i => ' ').join('') || ''
  values.forEach((v, idx) => logger.debug(`${space}${formatSymbol(v)}`))
}

module.exports = {
  prettify,
  formatSymbol,
  formatSymbolWithoutTraceInfo,
}

