const assert = require('assert')
const hash = require('object-hash')

class LocalAssignment {
  constructor(subEp, trackingPos) {
    assert(trackingPos >= 0 && subEp)
    this.epIndexes = new Set()
    this.visited = new Set()
    this.locateAssignments(subEp, trackingPos)
    this.epIndexes = [...this.epIndexes]
  }

  toKey(epSize, trackingPos) {
    assert(trackingPos >= 0 && epSize >= 0)
    return hash([epSize, trackingPos].join(':')).slice(0, 4)
  }

  locateAssignments(ep, trackingPos) {
    const key = this.toKey(ep.size(), trackingPos)
    if (this.visited.has(key)) return
    this.visited.add(key)
    for (let i = ep.size() - 1; i >= 0; i--) {
      const { stack, opcode: { name, opVal, ins, outs }, pc } = ep.get(i)
      const lastStackPos = stack.size() - 1
      if (lastStackPos >= trackingPos && name == 'SWAP') {
        const swapN = opVal - 0x8f
        if (trackingPos + swapN == lastStackPos) {
          this.epIndexes.add(i)
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
            this.locateAssignments(subEp, lastStackPos + opIdx)
          }
          break
        }
      }
      if (trackingPos > lastStackPos) break
    }
  }
}

module.exports = LocalAssignment 
