const { assign } = require('lodash')
const { prettify, isConstWithValue } = require('../shared')

const traverse = (symbol) => {
  const [type, name, ...params] = symbol 
}

const simplify = (traces) => {
  // traces.forEach(trace => traverse(trace))
  // console.log('///NEW TRACES')
  // prettify(traces)
}


module.exports = simplify
