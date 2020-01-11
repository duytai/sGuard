const assert = require('assert')
const chalk = require('chalk')
const { range } = require('lodash')
const {
  prettify,
  logger,
  findSymbol,
  formatSymbol,
  isConst,
  isMloadConst,
} = require('../shared')
const {
  toStateVariable,
  toLocalVariable,
  toVariable,
} = require('../variable')

class DNode {
  constructor(symbol, trace) {
    this.node = { me: symbol, childs: [], alias: 'N/A', variable: null }
    this.trace = trace
    this.expand()
  }

  addChild(child) {
    assert(child)
    this.node.childs.push(child)
  }

  getSymbol() {
    return this.node.me
  }

  getAlias() {
    return this.node.alias
  } 

  getVariable() {
    return this.node.variable
  }

  expandLocalVariable(loadVariable, subTrace) {
    this.node.alias = loadVariable.toString() 
    this.node.variable = loadVariable
    this.trace.eachLocalVariable((storeVariable, storedValue) => {
      /// If it is exactEqual, return true to break forEach loop 
      if (storeVariable.exactEqual(loadVariable)) {
        const dnode = new DNode(storedValue, subTrace)
        this.node.childs.push(dnode)
        return true
      }
      if (storeVariable.partialEqual(loadVariable)) {
        const members = [
          ...loadVariable.getSymbolMembers(),
          ...storeVariable.getSymbolMembers(),
          storedValue,
        ]
        members.forEach(m => {
          const dnode = new DNode(m, subTrace)
          this.node.childs.push(dnode)
        })
      }
    })
  }

  expandStateVariable(loadVariable, subTrace) {
    this.node.alias = loadVariable.toString() 
    this.node.variable = loadVariable
    this.trace.eachStateVariable((storeVariable, storedValue) => {
      /// If it is exactEqual, return true to break forEach loop 
      if (storeVariable.exactEqual(loadVariable)) {
        const dnode = new DNode(storedValue, subTrace)
        this.node.childs.push(dnode)
        return true
      }
      if (storeVariable.partialEqual(loadVariable)) {
        const members = [
          ...loadVariable.getSymbolMembers(),
          ...storeVariable.getSymbolMembers(),
          storedValue,
        ]
        members.forEach(m => {
          const dnode = new DNode(m, subTrace)
          this.node.childs.push(dnode)
        })
      }
    })
  }

  expand() {
    const { me, childs } = this.node 
    assert(!childs.length)
    switch (me[1]) {
      case 'MLOAD': {
        const subTrace = this.trace.sub(me[4][1].toNumber())
        const loadVariable = toLocalVariable(me[2], subTrace)
        assert(loadVariable)
        this.expandLocalVariable(loadVariable, subTrace)
        break
      }
      case 'SLOAD': {
        const subTrace = this.trace.sub(me[3][1].toNumber())
        const loadVariable = toStateVariable(me[2], subTrace) 
        assert(loadVariable)
        this.expandStateVariable(loadVariable, subTrace)
        break
      }
      default: {
        const symbols = findSymbol(me, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
        const hasMloadConst = symbols.find(isMloadConst)
        /// If has MloadConst => convert directly to a variable
        if (hasMloadConst) {
          const loadVariable = toLocalVariable(me, this.trace)
          assert(loadVariable)
          this.expandLocalVariable(loadVariable, this.trace)
        } else {
          symbols.forEach(symbol => {
            const traceSize = symbol[1] == 'SLOAD' ? symbol[3] : symbol[4]
            assert(isConst(traceSize))
            const dnode = new DNode(symbol, this.trace.sub(traceSize[1].toNumber()));
            childs.push(dnode)
          })
        }
      }
    }
  }

  findSloads() {
    const cond = (dnode) => {
      const { node: { me, childs } } = dnode
      return me[1] == 'SLOAD'
    }
    return this.traverse(cond)
  }

  traverse(cond) {
    assert(cond)
    const dnodes = []
    const stack = [this]
    while (stack.length > 0) {
      const dnode = stack.pop()
      if (cond(dnode)) dnodes.push(dnode)
      dnode.node.childs.forEach(dnode => stack.push(dnode))
    }
    return dnodes
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
