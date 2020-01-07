const assert = require('assert')
const DNode = require('./dnode')
const { prettify } = require('../shared')

const analyze = (symbol, trace, endPoints) => {
  const dnode = new DNode(symbol, trace)
  const sloads = dnode.findSloads()
  /*
   * Internal analyzing
   * */
  trace.prettify()
  dnode.prettify()
  /*
   * Cross function analyzing 
   * */
  endPoints.forEach(({ trace }) => {
    sloads.forEach(sload => {
      const { variable: loadVariable, childs } = sload.node
      trace.eachStateVariable((storeVariable, storedValue, traceIdx) => {
        const subTrace = trace.sub(traceIdx)
        if (storeVariable.partialEqual(loadVariable)) {
          const members = [
            ...storeVariable.getSymbolMembers(),
            storedValue,
          ]
          members.forEach(m => {
            const dnode = new DNode(m, subTrace)
            childs.push(dnode)
          })
        }
      })
    })
  })
  dnode.prettify()
}

module.exports = {
  analyze,
} 
