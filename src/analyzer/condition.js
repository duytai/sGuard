const { uniqBy, uniq } = require('lodash')
const { prettify, formatSymbol, logger } = require('../shared')

class Condition {
  constructor(ep, endPoints) {
    this.ep = ep
    this.endPoints = endPoints
  }

  toKey(pc, cond) {
    return `${pc}:${formatSymbol(cond)}`
  }

  batchFindConds(trackingPcs = []) {
    return uniqBy(
      trackingPcs.reduce((agg, trackingPc) => [...agg, ...this.findConds(trackingPc)], []),
      ({ cond, pc }) => this.toKey(pc, formatSymbol(cond))
    )
  }
  /// Find jumpi nodes where our `pc` depends on
  /// and collect conditions at that jumpi
  findConds(trackingPc) {
    /// Find previous jumpis 
    let allPrevJumpis = []
    const allUnrelatedJumpis = []
    this.endPoints.forEach(ep => {
      let encounterTrackingPc = false
      const prevJumpis = []
      for (let i = 0; i < ep.size(); i++) {
        const { pc, opcode: { name } } = ep.get(i)
        if (name == 'JUMPI') prevJumpis.push(pc)
        if (pc == trackingPc && prevJumpis.length) {
          allPrevJumpis.push([...prevJumpis])
          prevJumpis.length = 0 
          encounterTrackingPc = true
        }
      }
      if (!encounterTrackingPc) {
        allUnrelatedJumpis.push([...prevJumpis])
      }
    })
    /// Detect control dependency
    const controlJumpis = []
    while (true) {
      /// If no more jumpi control then break
      const closestJumpis = uniq(allPrevJumpis.map(p => p[p.length - 1]))
      if (!closestJumpis.length) break
      closestJumpis.forEach(jumpi => {
        allUnrelatedJumpis.forEach(uJumpis => {
          if (uJumpis.includes(jumpi) && !controlJumpis.includes(jumpi)) {
            controlJumpis.push(jumpi)
          }
        })
      })
      /// Update allPrevJumpis
      allPrevJumpis = allPrevJumpis.map(p => p.slice(0, -1)).filter(p => p.length)
    }
    /// Get condition at jumpi
    const conds = []
    for (let i = 0; i < this.ep.size(); i ++) {
      const { pc, opcode: { name }, stack } = this.ep.get(i)
      if (controlJumpis.includes(pc)) {
        const cond = stack.get(stack.size() - 2)
        conds.push({ pc, cond, epIdx: i, trackingPos: stack.size() - 2 })
      }
    }
    return uniqBy(conds, ({ cond, pc }) => this.toKey(pc, formatSymbol(cond)))
  }
}

module.exports = Condition 
