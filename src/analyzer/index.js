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
      const [loc, loadSize, traceSize] = me.slice(2)
      const loadVariable = Memory.toVariable(loc)
      assert(loadVariable)
      const mstores = traces
        .slice(0, traceSize[1].toNumber())
        .filter(([type, name]) => name == 'MSTORE')
      mstores.forEach(mstore => {
        const [loc, storedValue] = mstore.slice(2)
        const storeVariable = Memory.toVariable(loc)
        assert(storeVariable)
        // TODO: Need to analyze aliasing
        if (loadVariable.equal(storeVariable)) {
          if (loadVariable.toString() != 'm_40') {
            const newNode = { me: storedValue, childs: [] }
            buildDependencyTree(newNode, traces)
            childs.push(newNode)
          }
        }
      })
      break
    }
    case 'SLOAD': {
      const [loc, traceSize] = me.slice(2)
      const loadVariable = Storage.toVariable(loc, traces)
      assert(loadVariable)
      const sstores = traces
        .slice(0, traceSize[1].toNumber())
        .filter(([type, name]) => name == 'SSTORE')
      sstores.forEach(sstore => {
        const [loc, storedValue] = sstore.slice(2)
        const storeVariable = Storage.toVariable(loc, traces)
        assert(storeVariable)
        // TODO: Need to analyze aliasing
        if (loadVariable.equal(storeVariable)) {
          const newNode = { me: storedValue, childs: [] }
          buildDependencyTree(newNode, traces)
          childs.push(newNode)
        }
      })
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
  traces.forEach(trace => {
    const [type, name, loc] = trace
    prettify([trace])
    if (name == 'MSTORE') {
      const m = Memory.toVariable(loc)
      console.log(chalk.green(m.toString()))
    } else {
      const s = Storage.toVariable(loc, traces)
      console.log(chalk.green(s.toString()))
    }
  })
  prettify([symbol])
  console.log('//////')
  buildDependencyTree(root, traces)
  prettifyTree(root)
  // TODO: REMOVE IT LATER
  // process.exit(0)
}

module.exports = {
  analyze,
} 
