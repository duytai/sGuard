const { range } = require('lodash')
const logger = require('./logger')

const formatSymbol = ([type, name, ...params]) => {
  if (type == 'const') return name.toString(16) 
  if (!params.length) return name
  return `${name}(${params.map(p => formatSymbol(p)).join(',')})`
}

const prettify = (values, spaceLen = 0) => {
  const space = range(0, spaceLen).map(i => ' ').join('') || ''
  values.forEach((v, idx) => logger.debug(`${space}${formatSymbol(v)}`))
}

const prettifyPath = (path) => {
  path.forEach(({ pc, opcode, stack }, idx) => {
    logger.debug(`${pc} | ${Number(pc).toString(16)}\t${opcode.name}`)
    prettify(stack, 2)
  })
}

module.exports = {
  prettify,
  prettifyPath,
  formatSymbol,
}

