const assert = require('assert')
const logger = require('./logger')
const prettify = require('./prettify')
const searching = require('./searching')
const isConst = t => t[0] == 'const'

module.exports = {
  logger,
  isConst,
  ...prettify,
  ...searching,
}
