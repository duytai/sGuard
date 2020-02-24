const assert = require('assert')
const { reverse } = require('lodash')
const Variable = require('./variable')
const hash = require('object-hash')
const { prettify, isConst } = require('../shared')

class StateVariableConversion {
  constructor() {
    this.variables = []
  }

  getVariables() {
    return this.variables
  }
}
module.exports = StateVariableConversion 
