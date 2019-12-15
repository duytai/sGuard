const assert = require('assert')
const { reverse, last, first } = require('lodash')
const {
  prettify,
  logger,
  formatSymbol
} = require('../shared')
const simplify = require('./simplify')
const Memory = require('./memory')

/*
 * Traverse the symbol and return only matched symbol 
 * */
const find = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (cond(symbol)) return [symbol]
  return params.reduce(
    (agg, symbol) => [...agg, ...find(symbol, cond)],
    [],
  )
}

const buildDependencyTree = (node, traces) => {
  const { me, childs } = node
  assert(!childs.length)
  switch (me[1]) {
    case 'MLOAD': {
      const [offset, size, stackLen] = me.slice(2)
      const memory = new Memory(me)
      const { base } = memory.memloc
      memory.match(traces).forEach(symbol => {
        const newNode = { me: symbol, childs: [] }
        buildDependencyTree(newNode, traces)
        childs.push(newNode)
      })
      break
    }
    case 'SLOAD': {
      break
    }
    default: {
      const symbols = find(me, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
      symbols.forEach(symbol => {
        const newNode = { me: symbol, childs: [] }
        buildDependencyTree(newNode, traces)
        childs.push(newNode)
      })
    }
  }
}

const prettifyTree = (root, level = 0) => {
  const { me, childs } = root
  prettify([me], level * 2)
  childs.forEach(child => {
    prettifyTree(child, level + 1)
  })
}

const analyze = (symbol, traces) => {
  const [type, name, ...params] = symbol 
  switch (type) {
    case 'const': {
      logger.info(`No dependency since wei is ${JSON.stringify(symbol)}`)
      break
    }
    case 'symbol': {
      const foundSymbols = find(symbol, ([type, name]) => type == 'symbol' && name == 'NUMBER')
      if (foundSymbols.length > 0) {
        logger.info(`Number dependency since wei is ${JSON.stringify(symbol)}`)
      } else {
        const root = { me: symbol, childs: [] }
        simplify([...traces, symbol])
        prettify(traces)
        console.log('>>>>')
        prettify([symbol])
        console.log('<<<<')
        buildDependencyTree(root, traces)
        console.log('////TREE')
        prettifyTree(root)
      }
      break
    }
  }
}

module.exports = { analyze } 
