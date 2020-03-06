const { uniq } = require('lodash')
const assert = require('assert')

class StackVar {
  constructor(ep) {
    assert(ep)
    this.ep = ep
    this.assignmentPcs = new Set()
    this.visited = new Set()
  }

  toVisitedKey(trackingPos, epSize) {
    assert(trackingPos >= 0 && epSize >= 0)
    return `${trackingPos}:${epSize}`
  }

  myAncestors(trackingPos) {
    this.assignmentPcs.clear()
    this.visited.clear()
    this.whereAreAssignments(trackingPos, this.ep)
    return [...this.assignmentPcs]
  }

  whereAreAssignments(trackingPos, ep) {
    const key = this.toVisitedKey(trackingPos, ep.size())
    if (this.visited.has(key)) return
    this.visited.add(key)
    for (let i = ep.size() - 1; i >= 0; i--) {
      const { stack, opcode: { name, opVal, ins, outs }, pc } = ep.get(i)
      const lastStackPos = stack.size() - 1
      if (lastStackPos >= trackingPos && name == 'SWAP') {
        const swapN = opVal - 0x8f
        if (trackingPos + swapN == lastStackPos) {
          this.assignmentPcs.add(pc)
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
        /// An expression, need to consider all operands 
        if (prevIns > 0) {
          for (let opIdx = 0; opIdx < prevIns; opIdx ++) {
            const subEp = ep.sub(i)
            this.whereAreAssignments(lastStackPos + opIdx, subEp)
          }
          break
        }
      }
      if (trackingPos > lastStackPos) break
    }
  }
}

module.exports = StackVar 
