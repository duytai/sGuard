const assert = require('assert')
const logger = require('./logger')
const prettify = require('./prettify')
const searching = require('./searching')

module.exports = {
  logger,
  ...prettify,
  ...searching,
}
