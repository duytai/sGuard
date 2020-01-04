const assert = require('assert')
const chalk = require('chalk')
const { range } = require('lodash')
const {
  prettify,
  logger,
  findSymbol,
  formatSymbol,
} = require('../shared')
const {
  toStateVariable,
  toLocalVariable,
  toVariable,
  NameAllocatorFactory,
} = require('../variable')

class DTree {
  constructor(symbol, trace) {
    this.root = { me: symbol, childs: [], alias: 'N/A' }
    this.trace = trace
    this.expand(this.root)
  }

  expand(node) {
    const { me, childs } = node
    assert(!childs.length)
    switch (me[1]) {
      case 'MLOAD': {
        const allocator = NameAllocatorFactory.byName('MEMORY', this.trace)
        const loadVariable = toLocalVariable(me[2], this.trace, allocator)
        assert(loadVariable)
        node.alias = loadVariable.toString()
        this.trace.eachLocalVariable((storeVariable, storedValue) => {
          if (loadVariable.exactEqual(storeVariable)) {
            const newNode = { me: storedValue, childs: [], alias: 'N/A' }
            childs.push(newNode)
            this.expand(newNode)
          }
        })
        break
      }
      case 'SLOAD': {
        const allocator = NameAllocatorFactory.byName('STORAGE', this.trace)
        const loadVariable = toStateVariable(me[2], this.trace, allocator) 
        assert(loadVariable)
        node.alias = loadVariable.toString() 
        this.trace.eachStateVariable((storeVariable, storedValue) => {
          if (loadVariable.exactEqual(storeVariable)) {
            const newNode = { me: storedValue, childs: [], alias: 'N/A' }
            childs.push(newNode)
            this.expand(newNode)
          }
        })
        break
      }
      default: {
        const symbols = findSymbol(me, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
        symbols.forEach(symbol => {
          const newNode = { me: symbol, childs: [], alias: 'N/A' }
          childs.push(newNode)
          this.expand(newNode)
        })
      }
    }
  }


  prettify() {
    logger.debug(chalk.magenta.bold('>> Full DTREE'))
    const goDown = (root, level) => {
      const { me, childs, alias } = root
      const space = range(0, level).map(i => ' ').join('') || ''
      logger.debug(`${space}${formatSymbol(me)} ${chalk.green.bold(alias)}`)
      childs.forEach(child => {
        goDown(child, level + 1)
      })
    }
    goDown(this.root, 0)
  }
}

module.exports = DTree
