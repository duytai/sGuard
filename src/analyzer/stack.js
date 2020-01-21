const assert = require('assert')
const { assign } = require('lodash')
const { prettify } = require('../shared')

class StackAnalyzer {
  constructor({ trace, ep, stackPos }, endPoints) {
    assign(this, { trace, endPoints, ep, stackPos })
    ep.prettify()
    this.expand(stackPos, ep)
  }

  expand(stackPos, ep) {
    // ep.prettify(0)
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
        const { stack, opcode: { name, ins }} = ep.get(i - 1)
        /// Where inital variable is assigned to variable
        if (name == 'POP') {
          console.log('POP')
          console.log(`pc: ${pc}`)
          console.log(`trackingPos: ${trackingPos}`)
        } else {
          /// the expression is a combination of multiple operands
          /// Analyze each operand
          if (stack.size() - 1 > lastStackPos) {
            for (let opIdx = 0; opIdx < ins; opIdx ++) {
              const subEp = ep.sub(i)
              this.expand(lastStackPos + opIdx, subEp)
            }
            break
          }
        }
      }
    }
    // console.log(`pos: ${trackingPos}`)
  }
}

module.exports = StackAnalyzer 
