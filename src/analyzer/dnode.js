const assert = require('assert')
const chalk = require('chalk')
const { range } = require('lodash')
const {
  prettify,
  logger,
  findSymbol,
  formatSymbol,
  isConst,
} = require('../shared')
const {
  toStateVariable,
  toLocalVariable,
  toVariable,
} = require('../variable')

class DNode {
  constructor(symbol, trace) {
    this.node = { me: symbol, childs: [], alias: 'N/A' }
    this.trace = trace
    this.expand(this.node)
  }

  expand(node) {
    const { me, childs } = node
    assert(!childs.length)
    switch (me[1]) {
      case 'MLOAD': {
        const loadVariable = toLocalVariable(me[2], this.trace)
        assert(loadVariable)
        node.alias = loadVariable.toString()
        this.trace.eachLocalVariable((storeVariable, storedValue) => {
          // TODO:
        })
        break
      }
      case 'SLOAD': {
        const loadVariable = toStateVariable(me[2], this.trace) 
        assert(loadVariable)
        node.alias = loadVariable.toString() 
        const root = loadVariable.getAbsoluteRoot()
        this.trace.eachStateVariable((storeVariable, storedValue, traceIdx) => {
          // TODO:
        })
        break
      }
      default: {
        const symbols = findSymbol(me, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
        symbols.forEach(symbol => {
          const traceSize = symbol[1] == 'SLOAD' ? symbol[3] : symbol[4]
          assert(isConst(traceSize))
          const dnode = new DNode(symbol, this.trace.sub(traceSize[1].toNumber()));
          childs.push(dnode)
        })
      }
    }
  }


  prettify(level = 0) {
    if (level == 0) {
      logger.debug(chalk.magenta.bold('>> Full DTREE'))
    }
    const { me, childs, alias } = this.node
    const space = range(0, level).map(i => ' ').join('') || ''
    logger.debug(`${space}${formatSymbol(me)} ${chalk.green.bold(alias)}`)
    childs.forEach(child => {
      child.prettify(level + 1)
    })
  }
}

module.exports = DNode 
