const assert = require('assert')
const { reverse } = require('lodash')
const Variable = require('./variable')
const hash = require('object-hash')
const { prettify, isConst } = require('../shared')

const toStateVariables = (t, trace) => {
  assert(false, `TODO: implementation`)
}

module.exports = toStateVariables
