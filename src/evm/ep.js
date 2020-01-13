const { pickBy } = require('lodash')
const { logger } = require('../shared')

class ExecutionPath {
  constructor() {
    this.ep = []
    this.MAX_VISITED_BLOCK = 20;
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

  isForbidden(jumpdest) {
    const forbiddenJumpdests = new Set() 
    const pcs = [
      ...this.ep.filter(({ opcode: { name } }) => name == 'JUMPDEST').map(({ pc }) => pc),
      jumpdest,
    ]
    return pcs.length >= this.MAX_VISITED_BLOCK 
  }

  prettify() {
    logger.info('>> Full ep')
    this.ep.forEach(({ pc, opcode, stack }, idx) => {
      logger.debug(`${pc} | ${Number(pc).toString(16)}\t${opcode.name}`)
      stack.prettify(2)
    })
  }
}

module.exports = ExecutionPath
