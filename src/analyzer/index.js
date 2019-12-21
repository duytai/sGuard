const assert = require('assert')
const { reverse, last, first } = require('lodash')
const { prettify, logger, findSymbol } = require('../shared')
const Memory = require('./memory')
const Storage = require('./storage')

const buildDependencyTree = (node, traces) => {
  const { me, childs } = node
  assert(!childs.length)
  switch (me[1]) {
    case 'MLOAD': {
      const memory = new Memory(me)
      memory.findMatches(traces)
      break
    }
    case 'SLOAD': {
      const storage = new Storage(me, traces)
      // storage.findMatches(traces)
      // storage.matches().forEach(symbol => {
        // const newNode = { me: symbol, childs: [] }
        // buildDependencyTree(newNode, traces)
        // childs.push(newNode)
      // })
      break
    }
    default: {
      const symbols = findSymbol(me, ([type, name]) => ['SLOAD', 'MLOAD'].includes(name))
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
      const foundSymbols = findSymbol(symbol, ([type, name]) => type == 'symbol' && name == 'NUMBER')
      if (foundSymbols.length > 0) {
        logger.info(`Number dependency since wei is ${JSON.stringify(symbol)}`)
      } else {
        const root = { me: symbol, childs: [] }
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
