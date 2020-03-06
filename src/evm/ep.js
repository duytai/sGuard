const assert = require('assert')
const chalk = require('chalk')
const { reverse } = require('lodash')
const { logger, prettify, isConst, formatSymbol } = require('../shared')
const { StateVariable, LocalVariable } = require('../variable')
const Stack = require('./stack')
const Trace = require('./trace')

class Ep {
  constructor(maxVisitedBlock) {
    this.ep = []
    this.maxVisitedBlock = maxVisitedBlock
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
    const ep = new Ep(this.maxVisitedBlock)
    ep.ep = [...this.ep]
    ep.trace = this.trace.clone()
    ep.stack = this.stack.clone()
    return ep
  }

  sub(epSize) {
    assert(epSize >= 0)
    assert(epSize <= this.ep.length)
    const ep = new Ep(this.maxVisitedBlock)
    ep.ep = this.ep.slice(0, epSize)
    const { stack, trace } = ep.ep[ep.ep.length - 1]
    ep.stack = stack.clone()
    ep.trace = trace.clone()
    return ep
  }

  isForbidden(jumpdest) {
    const forbiddenJumpdests = new Set() 
    const pcs = [
      ...this.ep.filter(({ opcode: { name } }) => name == 'JUMPDEST').map(({ pc }) => pc),
      jumpdest,
    ]
    return pcs.length >= this.maxVisitedBlock
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
    const failures = []
    this.trace.ts.forEach(({ t, epIdx, pc }) => {
      prettify([t])
      const [_, name, loc] = t
      const subEp = this.sub(epIdx + 1)
      let isFailed = false
      if (name == 'SSTORE') {
        if (!this.isAntiPatternSloc(loc))  {
          const variable = new StateVariable(loc, subEp)
          logger.debug(chalk.green.bold(variable.toAlias()))
        } else {
          isFailed = true
        }
      }
      if (name == 'MSTORE') {
        /// Solidity use mem to storage encoded abi
        if (!this.isAntiPatternMloc(loc)) {
          const variable = new LocalVariable(loc, subEp)
          logger.debug(chalk.green.bold(variable.toAlias()))
        } else {
          isFailed = true
        }
      }
      if (isFailed) {
        failures.push(formatSymbol(loc))
      }
      if (srcmap) {
        const { txt, line } = srcmap.toSrc(pc)
        const firstLine = txt.split("\n")[0]
        if (firstLine) {
          logger.debug(`${chalk.dim.italic(`${line}:${firstLine}`)}`)
          if (isFailed) {
            failures.push(`${chalk.dim.italic(`${line}:${firstLine}`)}`)
          }
        }
      }
    })
    return failures
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
