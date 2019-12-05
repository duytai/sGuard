const assert = require('assert')
const { reverse, last } = require('lodash')
const {
  prettify,
  logger,
  isConstWithValue,
  isConst,
  isSymbol,
} = require('./shared')

const format = ([type, name, ...params]) => {
  if (type == 'const') return name.toString(16) 
  if (!params.length) return name
  return `${name}(${params.map(p => format(p)).join(',')})`
}

const equal = (s1, s2) => format(s1) == format(s2)

const find = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (cond(symbol)) return [symbol]
  return params.reduce(
    (agg, symbol) => [...agg, ...find(symbol, cond)],
    [],
  )
}

const match = (symbol, pathNames) => {
  const internalMatch = (symbol, pathNames) => {
    if (!pathNames.length) return []
    const [name, paramIndex] = pathNames.shift().split(':')
    if (name != symbol[1]) return []
    const params = symbol.slice(2)
    if (paramIndex) return [symbol, ...internalMatch(params[parseInt(paramIndex)], [...pathNames])]
    return [symbol, ...params.reduce((agg, n) => [...agg, ...internalMatch(n, [...pathNames])], [])]
  }
  const pathLen = pathNames.length
  const ret = internalMatch(symbol, pathNames)
  assert(ret.length <= pathLen)
  if (ret.length < pathLen) return []
  return ret
}

const buildDependencyTree = (node, traces) => {
  const { me, childs } = node
  assert(!childs.length)
  switch (me[1]) {
    case 'MLOAD': {
      const [loadOffset, dataLen, traceSize] = me.slice(2) 
      assert(isConst(traceSize))
      assert(isConst(dataLen))
      assert(!isConst(loadOffset))
      const arrayMatches = match(me, ['MLOAD:0/ADD:1/MLOAD'])
      console.log('>>>>>>MATCHES')
      prettify(arrayMatches)
      // if (arrayMatches.length) {
        // const loadSignature = arrayMatches.pop()
        // const [type, name, ...loadParams] = loadSignature
        // assert(isConstWithValue(loadParams[0], 0x40))
        // assert(isConstWithValue(loadParams[1], 0x20))
        // assert(isConst(loadParams[2]))
        // const validTraces = reverse(traces.slice(0, traceSize[1].toNumber()))
        // validTraces.forEach((trace, idx) => {
          // const arrayMatches = match(trace, ['MSTORE', 'ADD', 'MLOAD'])
          // if (arrayMatches.length) {
            // const storeSignature = last(arrayMatches)
            // if (equal(loadSignature, storeSignature)) {
              // console.log('FOUND')
              // const [type, name, storeOffset, value] = trace
              // const newNode = { me: value, childs: [] }
              // buildDependencyTree(newNode, traces)
              // childs.push(newNode)
            // }
          // }
        // })
      // }
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
  prettify(traces)
  console.log('>>>>')
  prettify([symbol])
  console.log('<<<<')
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
        buildDependencyTree(root, traces)
        console.log('////TREE')
        prettifyTree(root)
      }
      break
    }
  }
}

module.exports = {
  analyze,
} 
