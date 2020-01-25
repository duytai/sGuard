const assert = require('assert')
const { assign } = require('lodash')
const { prettify } = require('../shared')

class StackAnalyzer {
  constructor({ trace, ep, stackPos }, endPoints) {
    assign(this, { trace, endPoints, ep, stackPos })
    ep.prettify(0)
    this.expand(stackPos, ep)
  }

  expand(stackPos, ep) {
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
        const { stack: prevStack, opcode: { name: prevName, ins: prevIns }} = ep.get(i - 1)
        /// Where inital variable is assigned to variable
        if (prevName == 'POP') {
          console.log('------')
          console.log(`trackingPos: ${trackingPos}`)
          console.log(`pc: ${pc}`)
        } else {
          /// the expression is a combination of multiple operands
          /// Analyze each operand
          // console.log('++++')
          // console.log(`trackingPos: ${trackingPos}`)
          // console.log(`pc: ${pc}`)
          // console.log(`name: ${name}`)
          if (prevStack.size() - 1 > lastStackPos) {
            for (let opIdx = 0; opIdx < prevIns; opIdx ++) {
              const subEp = ep.sub(i)
              this.expand(lastStackPos + opIdx, subEp)
            }
            break
          }
        }
      }
    }
  }
}

module.exports = StackAnalyzer 
