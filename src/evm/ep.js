const assert = require('assert')
const { pickBy } = require('lodash')
const { logger } = require('../shared')

const MAX_VISITED_BLOCK = parseInt(process.env.MAX_VISITED_BLOCK) || 20

class ExecutionPath {
  constructor() {
    this.ep = []
  }

  withEp(ep) {
    this.ep = ep
  }

  add({ stack, opcode, pc }) {
    this.ep.push({ stack, opcode, pc })
  }

  clone() {
    const executionPath = new ExecutionPath()
    executionPath.withEp([...this.ep])
    return executionPath
  }

  sub(epSize) {
    assert(epSize >= 0)
    assert(epSize <= this.ep.length)
    const executionPath = new ExecutionPath()
    const ep = this.ep.slice(0, epSize)
    executionPath.withTs([...ep])
    return ep 
  }

  isForbidden(jumpdest) {
    const forbiddenJumpdests = new Set() 
    const pcs = [
      ...this.ep.filter(({ opcode: { name } }) => name == 'JUMPDEST').map(({ pc }) => pc),
      jumpdest,
    ]
    return pcs.length >= MAX_VISITED_BLOCK 
  }

  prettify() {
    logger.info('>> Full ep')
    this.ep.forEach(({ pc, opcode, stack }, idx) => {
      logger.debug(`${pc} | ${Number(pc).toString(16)}\t${opcode.name}`)
      stack.prettify(2)
    })
  }

  get(idx) {
    assert(idx >= 0 && idx < this.ep.length)
    return this.ep[idx]
  }

  size() {
    return this.ep.length
  }
}

module.exports = ExecutionPath
