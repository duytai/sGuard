const assert = require('assert')
const chalk = require('chalk')
const { reverse, clone } = require('lodash')
const { logger, prettify, isConst, formatSymbol } = require('../shared')
const { StateVariable, LocalVariable } = require('../variable')
const Stack = require('./stack')
const Trace = require('./trace')

class Ep {
  constructor() {
    this.ep = []
    this.boundary = {}
    this.stack = new Stack() 
    this.trace = new Trace()
  }

  clear() {
    this.ep.length = 0
    this.stack.clear()
    this.trace.clear()
  }

  add({ opcode, pc }) {
    const stack = this.stack.clone()
    const trace = this.trace.clone()
    this.ep.push({ stack, trace, opcode, pc })
  }

  clone() {
    const ep = new Ep()
    ep.ep = [...this.ep]
    ep.trace = this.trace.clone()
    ep.stack = this.stack.clone()
    ep.boundary = clone(this.boundary)
    return ep
  }

  sub(epSize) {
    assert(epSize >= 0)
    assert(epSize <= this.ep.length)
    const ep = new Ep()
    ep.ep = this.ep.slice(0, epSize)
    const { stack, trace } = ep.ep[ep.ep.length - 1]
    ep.stack = stack.clone()
    ep.trace = trace.clone()
    return ep
  }

  distance(pc) {
    let jp = 0 // jumpi
    let ams = new Set() // assignment
    let coveredJp = new Set([pc]) // nested jumpi

    // default boundary = 2
    if (!this.boundary[pc]) this.boundary[pc] = 2

    // count assignments between two jumpis
    for (let i = 0; i < this.ep.length - 1; i ++) {
      const { pc: coveredPc, opcode: { name }, stack } = this.ep[i];
      if (pc == coveredPc) jp ++
      if (jp > 0) {
        switch (name) {
          case 'SWAP': {
            const value = stack.get(stack.size() - 1)
            if (value[0] == 'const') break
            ams.add(coveredPc)
            break
          }
          case 'SSTORE': {
            const value = stack.get(stack.size() - 2)
            if (value[0] == 'const') break
            ams.add(coveredPc)
            break
          }
          case 'MSTORE': {
            const loc = stack.get(stack.size() - 1)
            const value = stack.get(stack.size() - 2)
            if (loc[0] == 'const' && loc[1].toNumber() < 0x80) break
            if (value[0] == 'const') break
            ams.add(coveredPc)
            break
          }
          case 'JUMPI': {
            coveredJp.add(coveredPc)
            break
          }
        }
      }
    }

    if (jp) {
      // set new boundary for coveredJp
      for (let pc of coveredJp.values()) {
        // set new boundary for JUMPI at pc
        if (this.boundary[pc] < ams.size) {
          this.boundary[pc] = ams.size
        }
      }
    }
    
    return this.boundary[pc] - jp
  }

  filter(cond) {
    assert(cond)
    return reverse([...this.ep]).filter(ep => cond(ep))
  }

  find(cond) {
    assert(cond)
    return reverse([...this.ep]).find(ep => cond(ep))
  }

  get(idx) {
    assert(idx >= 0 && idx < this.ep.length)
    return this.ep[idx]
  }

  last() {
    assert(this.ep.length > 0)
    return this.ep[this.ep.length - 1]
  }

  size() {
    return this.ep.length
  }

  eachLocalVariable(cb) {
    assert(cb)
    reverse([...this.trace.ts]).forEach(({ t, epIdx, vTrackingPos, kTrackingPos }) => {
      const [_, name, loc, storedValue ] = t
      if (name == 'MSTORE') {
        /// Solidity use mem to storage encoded abi
        if (this.isAntiPatternMloc(loc)) return
        const subEp = this.sub(epIdx + 1)
        const variable = new LocalVariable(loc, subEp)
        cb({ variable, subEp, storedLoc: loc, storedValue, vTrackingPos, kTrackingPos })
      }
    })
  }

  eachStateVariable(cb) {
    assert(cb)
    reverse([...this.trace.ts]).forEach(({ t, epIdx, vTrackingPos, kTrackingPos }) => {
      const [_, name, loc, storedValue ] = t
      if (name == 'SSTORE') {
        if (this.isAntiPatternSloc(loc)) return
        const subEp = this.sub(epIdx + 1)
        const variable = new StateVariable(loc, subEp)
        cb({ variable, subEp, storedLoc: loc, storedValue, vTrackingPos, kTrackingPos })
      }
    })
  }

  isAntiPatternSloc(loc) {
    const formatted = formatSymbol(loc)
    const useStoreInAssembly = /SHA3\(MLOAD\([1-9]+/ // MLOAD(x) when x is not 0
    return useStoreInAssembly.test(formatted) 
  }

  isAntiPatternMloc(loc) {
    const formatted = formatSymbol(loc)
    const useAbiEncoder = /SUB/ // use SUB
    return useAbiEncoder.test(formatted) 
  }

  showTrace(srcmap) {
    logger.info('>> Full trace')
    this.trace.ts.forEach(({ t, epIdx, pc }) => {
      const [_, name, loc] = t
      const subEp = this.sub(epIdx + 1)
      let firstLine = srcmap ? srcmap.toSrc(pc).txt.split("\n")[0] : ""
      let line = srcmap ? srcmap.toSrc(pc).line : 0
      firstLine && logger.debug(`${chalk.dim.italic(`${line}:${pc}:${firstLine}`)}`)
      prettify([t])
      if (name == 'SSTORE') {
        if (!this.isAntiPatternSloc(loc))  {
          const variable = new StateVariable(loc, subEp)
          logger.debug(chalk.green.bold(variable.toAlias()))
        } else {
          logger.error(formatSymbol(loc))
        }
      }
      if (name == 'MSTORE') {
        /// Solidity use mem to storage encoded abi
        if (!this.isAntiPatternMloc(loc)) {
          const variable = new LocalVariable(loc, subEp)
          logger.debug(chalk.green.bold(variable.toAlias()))
        } else {
          logger.error(formatSymbol(loc))
        }
      }
    })
  }

  prettify() {
    logger.info('>> Full ep')
    this.ep.forEach(({ pc, opcode, stack }, idx) => {
      logger.debug('-----')
      logger.debug(`${pc} | ${Number(pc).toString(16)}\t${opcode.name}`)
      stack.prettify(2)
    })
  }
}

module.exports = Ep 
