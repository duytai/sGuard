const assert = require('assert')
const DNode = require('./dnode')

const analyze = (symbol, trace) => {
  const dnode = new DNode(symbol, trace)
  trace.prettify()
  dnode.prettify()
}

module.exports = {
  analyze,
} 
