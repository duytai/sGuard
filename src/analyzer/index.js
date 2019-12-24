const assert = require('assert')
const { reverse, last, first } = require('lodash')
const chalk = require('chalk')
const { prettify, logger, findSymbol } = require('../shared')
const Memory = require('./memory')
const Storage = require('./storage')

const buildDependencyTree = (node, traces) => {
  const { me, childs } = node
  assert(!childs.length)
  switch (me[1]) {
    case 'MLOAD': {
      break
    }
    case 'SLOAD': {
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
  const root = { me: symbol, childs: [] }
  const [type, name, ...params] = symbol
  buildDependencyTree(root, traces)
  prettifyTree(root)
}

// const analyze = (symbol, traces) => {
  // const [type, name] = symbol
  // switch (name) {
    // case 'MLOAD': {
      // console.log('///////')
      // prettify([symbol])
      // const [loc, loadSize, traceSize] = symbol.slice(2)
      // const loadVariable = Memory.toVariable(loc)
      // assert(loadVariable)
      // console.log(chalk.green(loadVariable.toString()))
      // const mstores = traces
        // .filter(trace => ([type, name]) => name == 'MSTORE')
        // .filter(mstore => {
          // const [loc] = mstore.slice(2)
          // const storeVariable = Memory.toVariable(loc)
          // assert(storeVariable)
          // return loadVariable.equal(storeVariable)
        // })
      // break
    // }
    // case 'SLOAD': {
      // console.log('///////')
      // prettify([symbol])
      // const [loc] = symbol.slice(2)
      // const variable = Storage.toVariable(loc, traces)
      // assert(variable)
      // console.log(chalk.green(variable.toString()))
      // break
    // }
  // }
// }

module.exports = {
  analyze,
} 
