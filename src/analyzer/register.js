const assert = require('assert')
const { intersection, uniqBy, uniq, assign, forEach } = require('lodash')
const DNode = require('./dnode')
const { prettify, formatSymbol } = require('../shared')

class RegisterAnalayzer {
  constructor({ symbol, trace, pc, ep, trackingPos }, endPoints, visited = []) {
    assign(this, { symbol, trace, pc, endPoints, ep, trackingPos })
    visited.push(pc)
    this.dnode = new DNode(symbol, trace)
    this.conditionAnalysis(visited)
    this.crossfunctionAnalysis(visited)
  }

  crossfunctionAnalysis(visited) {
    const sloads = this.dnode.findSloads()
    this.endPoints.forEach(({ trace, ep }) => {
      sloads.forEach(sload => {
        const loadVariable = sload.getVariable()
        trace.eachStateVariable(({ variable: storeVariable, value: storedValue, traceIdx, pc, epIdx, kTrackingPos, vTrackingPos }) => {
          /// If it is exactEqual, return true to break forEach loop 
          if (storeVariable.exactEqual(loadVariable)) {
            if (!visited.includes(pc)) {
              /// since sstore here, we need to analyze sstore dependency
              const subEp = ep.sub(epIdx + 1)
              const data = { pc, symbol: storedValue, trace, ep: subEp, trackingPos: vTrackingPos }
              const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
              sload.addChild(analyzer.dnode)
            }
            return true
          }
          const subTrace = trace.sub(traceIdx)
          /// sload corresponds to other sstores in other function
          if (storeVariable.partialEqual(loadVariable)) {
            /// dont need to get symbolMembers of loadVariable
            storeVariable.getSymbolMembers().forEach(m => {
              const dnode = new DNode(m, subTrace)
              sload.addChild(dnode)
            })
            if (!visited.includes(pc)) {
              /// since sstore here, we need to analyze sstore dependency
              const data = { pc, symbol: storedValue, trace, ep }
              const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
              sload.addChild(analyzer.dnode)
            }
          }
        })
      })
    })
  }

  conditionAnalysis(visited) {
    let conds = this.findConds(this.pc)
    if (this.trackingPos) {
      const trackingPcs = this.findTrackingPcs(this.trackingPos, this.ep)
      trackingPcs.forEach(trackingPc => {
        const extConds = this.findConds(trackingPc, this.ep)
        conds = [...conds, ...extConds]
      })
    }
    conds = uniqBy(conds, ({ cond, pc }) => `${pc}:${formatSymbol(cond)}`)
    conds.forEach(({ pc, cond }) => {
      if (!visited.includes(pc)) {
        const data = { pc, symbol: cond, trace: this.trace, ep: this.ep }
        const analyzer = new RegisterAnalayzer(data, this.endPoints, visited)
        this.dnode.addChild(analyzer.dnode)
      }
    })
  }

  /// Find jumpi nodes where our `pc` depends on
  /// and collect conditions at that jumpi
  findConds(trackingPc) {
    const executionPaths = this.endPoints.map(({ ep, trace }) => ep)
    /// Find previous jumpis 
    let allPrevJumpis = []
    const allUnrelatedJumpis = []
    executionPaths.forEach(ep => {
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
      allPrevJumpis = allPrevJumpis.filter(p => !controlJumpis.includes(p[p.length - 1]))
      allPrevJumpis = allPrevJumpis.map(p => p.slice(0, -1))
      allPrevJumpis = allPrevJumpis.filter(p => p.length)
    }
    /// Get condition at jumpi
    const conds = []
    for (let i = 0; i < this.ep.size(); i ++) {
      const { pc, opcode: { name }, stack } = this.ep.get(i)
      if (controlJumpis.includes(pc)) {
        const cond = stack.get(stack.size() - 2)
        conds.push({ pc, cond })
      }
    }
    return uniqBy(conds, ({ cond, pc }) => `${pc}:${formatSymbol(cond)}`)
  }

  /// Find assigments of stack variables 
  findTrackingPcs(trackingPos, ep) {
    let result = []
    for (let i = ep.size() - 1; i >= 0; i--) {
      const { stack, opcode: { name, opVal, ins, outs }, pc } = ep.get(i)
      const lastStackPos = stack.size() - 1
      if (lastStackPos >= trackingPos && name == 'SWAP') {
        const swapN = opVal - 0x8f
        if (trackingPos + swapN == lastStackPos) {
          result.push(pc)
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
            result = [
              ...result,
              ...this.findTrackingPcs(lastStackPos + opIdx, subEp)
            ]
          }
          break
        }
      }
      if (trackingPos > lastStackPos) break
    }
    return result
  }

  prettify() {
    this.trace.prettify()
    this.dnode.prettify()
  }
}

module.exports = RegisterAnalayzer
