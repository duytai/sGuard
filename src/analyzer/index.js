const assert = require('assert')
const DTree = require('./dtree')

const analyze = (symbol, trace) => {
  const dtree = new DTree(symbol, trace)
  trace.prettify()
  dtree.prettify()
}

module.exports = {
  analyze,
} 
