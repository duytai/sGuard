const assert = require('assert')
const { prettify, isConst } = require('../shared')
const Variable = require('./variable')

/// t = sha3(t0) + ax + b
/// a: size of type - b: prop

class StateVariable extends Variable {
  convert(t, ep) {
    if (isConst(t)) return [t]
    prettify([t])
    assert(false, 'Dont know')
  }
}

module.exports = StateVariable 
