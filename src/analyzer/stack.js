const assert = require('assert')
const { assign } = require('lodash')
const { prettify } = require('../shared')

class StackAnalyzer {
  constructor({ trace, ep, stackPos }, endPoints) {
    assign(this, { trace, endPoints, ep, stackPos })
    this.expand(stackPos, ep)
  }

  expand(stackPos, ep) {
    ep.prettify(0)
    let trackingPos = stackPos
    for (let i = ep.size() - 1; i >= 0; i--) {
      const { stack, opcode: { name, opVal, ins, outs }, pc } = ep.get(i)
      const lastStackPos = stack.size() - 1
      if (lastStackPos >= trackingPos && name == 'SWAP') {
        const swapN = opVal - 0x8f
        if (trackingPos + swapN == lastStackPos) {
          trackingPos = trackingPos + swapN
        } else if (lastStackPos == trackingPos) {
          trackingPos = trackingPos - swapN
        }
      }
      if (name == 'DUP' && trackingPos == lastStackPos + 1) {
        const dupN = opVal - 0x7f
        trackingPos = trackingPos - dupN
      }
      if (trackingPos == lastStackPos) {
        const { opcode: { name }} = ep.get(i - 1)
        if (name == 'POP') {
          console.log('POP')
          console.log(`pc: ${pc}`)
          break
        }
      }
    }
    console.log(`pos: ${trackingPos}`)
  }
}

module.exports = StackAnalyzer 
