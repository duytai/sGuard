const { pickBy } = require('lodash')
const { logger } = require('../shared')

class ExecutionPath {
  constructor() {
    this.ep = []
    this.MAX_VISITED_BLOCK = 30;
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

  findForbiddenJumpdests(jumpdest) {
    const forbiddenJumpdests = new Set() 
    const pcs = [
      ...this.ep.filter(({ opcode: { name } }) => name == 'JUMPDEST').map(({ pc }) => pc),
      jumpdest,
    ]
    const indexes = Object.keys(pickBy(pcs, pc => pc == jumpdest)).map(i => parseInt(i))
    if (indexes.length > 2) {
      const subPaths = []
      for (let i = 0; i < indexes.length - 1; i ++) {
        subPaths.push(pcs.slice(indexes[i], indexes[i + 1]))
      }
      for (let i = 0; i < subPaths.length - 1; i ++) {
        for (let j = i + 1; j < subPaths.length; j ++) {
          if (subPaths[i].join('') == subPaths[j].join('')) {
            forbiddenJumpdests.add(subPaths[i][0])
          }
        }
      }
    }
    // Return all jumpdests to stop the execution
    if (pcs.length >= this.MAX_VISITED_BLOCK)
      return pcs
    return [...forbiddenJumpdests]
  }

  prettify() {
    this.ep.forEach(({ pc, opcode, stack }, idx) => {
      logger.debug(`${pc} | ${Number(pc).toString(16)}\t${opcode.name}`)
      stack.prettify(2)
    })
  }
}

module.exports = ExecutionPath
