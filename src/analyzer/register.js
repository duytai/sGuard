const assert = require('assert')
const { intersection, uniqBy, assign } = require('lodash')
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
        trace.eachStateVariable(({ variable: storeVariable, value: storedValue, traceIdx, pc }) => {
          /// If it is exactEqual, return true to break forEach loop 
          if (storeVariable.exactEqual(loadVariable)) {
            if (!visited.includes(pc)) {
              /// since sstore here, we need to analyze sstore dependency
              const data = { pc, symbol: storedValue, trace, ep }
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
    if (this.trackingPos && this.ep) {
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
    const executionPaths = this.endPoints.map(({ ep, trace }) => ep.ep)
    const pcIncludingExecutionPaths = executionPaths.filter(p => p.find(pp => pp.pc == trackingPc))
    const pcExcludingExecutionPaths = executionPaths.filter(p => !p.find(pp => pp.pc == trackingPc))
    const pathToBranchKeys = (p) => {
      const keys = []
      for (let i = 0; i < p.length - 1; i ++) {
        const current = p[i]
        const next = p[i + 1]
        if (current.opcode.name == 'JUMPI') {
          keys.push({ from: current.pc, to: next.pc })
        }
      }
      return keys 
    }
    const dJumpis = []
    const pcIncludingJumpis = pcIncludingExecutionPaths
      .reduce((r, p) => [...r, ...pathToBranchKeys(p)], [])
    const pcExcludingJumpis = pcExcludingExecutionPaths
      .reduce((r, p) => [...r, ...pathToBranchKeys(p)], [])
    pcIncludingJumpis.forEach(ikey => {
      pcExcludingJumpis.forEach(ekey => {
        if (ikey.from == ekey.from && ikey.to != ekey.to) {
          if (!dJumpis.includes(ikey.from)) {
            dJumpis.push(ikey.from)
          }
        }
      })
    })
    const conds = []
    this.ep.ep.forEach(({ pc, opcode: { name }, stack }) => {
      if (dJumpis.includes(pc)) {
        const cond = stack.get(stack.size() - 2)
        conds.push({ pc, cond })
      }
    })
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
