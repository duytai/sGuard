const assert = require('assert')
const { assign } = require('lodash')
const { prettify } = require('../shared')

class StackAnalyzer {
  constructor({ trace, ep, stackPos }, endPoints) {
    assign(this, { trace, endPoints, ep, stackPos })
    this.expand(ep)
  }

  expand(ep) {
    ep.prettify()
    for (let i = 1; i < ep.size(); i++ ) {
      let { opcode: { name: prevName, ins: prevIns, outs: prevOuts } } = ep.get(i - 1)
      let { stack: curStack, opcode: { name: curName, opVal: curOpVal }, pc } = ep.get(i)
      if (curName == 'SWAP') {
        let minTrackingPos = curStack.size() - 1 - (curOpVal - 0x8f)
        let j = i + 1
        for (; j < ep.size(); j++) {
          let { stack, opcode: { name, opVal } } = ep.get(j)
          if (name != 'SWAP') break
          const trackingPos = stack.size() - 1 - (opVal - 0x8f)
          if (trackingPos < minTrackingPos) {
            minTrackingPos = trackingPos
          }
        }
        const { opcode: { name } } = ep.get(j)
        if (name == 'POP') {
          if (prevName != 'POP') {
            console.log(`minTrackingPos: ${minTrackingPos}`)
            console.log(`pc: ${pc}`)
          }
        }
        i = j
      }
    }
  }
}

module.exports = StackAnalyzer 
