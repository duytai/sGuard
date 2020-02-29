const assert = require('assert')
const { reverse } = require('lodash')
const { logger, prettify } = require('../shared')
const { StateVariable, LocalVariable } = require('../variable')
const Stack = require('./stack')
const Trace = require('./trace')

const MAX_VISITED_BLOCK = parseInt(process.env.MAX_VISITED_BLOCK) || 20

class Ep {
  constructor() {
    this.ep = []
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

  isForbidden(jumpdest) {
    const forbiddenJumpdests = new Set() 
    const pcs = [
      ...this.ep.filter(({ opcode: { name } }) => name == 'JUMPDEST').map(({ pc }) => pc),
      jumpdest,
    ]
    return pcs.length >= MAX_VISITED_BLOCK 
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

  eachStateVariable(cb) {
    assert(cb)
    reverse([...this.trace.ts]).forEach(({ t, epIdx }) => {
      const [_, name, loc] = t
      if (name == 'SSTORE') {
        const subEp = this.sub(epIdx + 1)
        const variable = new StateVariable(loc, subEp)
        cb({ variable })
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
