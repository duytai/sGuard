const assert = require('assert')
const DNode = require('./dnode')
const { prettify } = require('../shared')

const analyze = (symbol, trace, endPoints) => {
  const dnode = new DNode(symbol, trace)
  trace.prettify()
  dnode.prettify()
  const sloads = dnode.findSloads()
  endPoints.forEach(({ trace }) => {
    trace.prettify()
  })
}

module.exports = {
  analyze,
} 
