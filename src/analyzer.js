const assert = require('assert')
const { reverse } = require('lodash')
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

const match = (symbol, pathNames= []) => {
  const pathLen = pathNames.length
  const ret = []
  while (pathNames.length) {
    if (symbol[1] == pathNames.shift()) {
      ret.push(symbol)
      symbol = symbol[2]
    } else {
      break
    }
  }
  if (pathLen != ret.length) return []
  return ret
}

const buildDependencyTree = (node, traces) => {
  const { me, childs } = node
  assert(isSymbol(me))
  assert(!childs.length)
  const [type, name, ...params] = me
  switch (name) {
    case 'MLOAD': {
      break
    }
    case 'SLOAD': {
      const [loadOffset, traceSize] = params
      assert(isConst(traceSize))
      /* Data is saved at const location */
      if (isConst(loadOffset)) {
        const validTraces = reverse(traces.slice(0, traceSize[1].toNumber()))
        for (let i = 0; i < validTraces.length; i ++) {
          const trace = validTraces[i]
          const [type, name, ...params] = trace
          if (name == 'SSTORE') {
            const [storeOffset, value, traceSize] = params
            if (isConst(storeOffset)) {
              if (storeOffset[1].toNumber() == loadOffset[1].toNumber()) {
                const newNode = { me: trace, childs: [] }
                buildDependencyTree(newNode, traces)
                childs.push(newNode)
              }
            }
          }
        }
      } else {
        /* Data is saved at symbolic location */
        const matches = match(loadOffset, ['ADD', 'SHA3', 'MLOAD'])
        assert(matches.length)
        const [type, name, ...params] = matches.pop()
        assert(isConstWithValue(params[0], 0x00))
        assert(isConstWithValue(params[1], 0x20))
        assert(isConst(params[2]))
        const validTraces = reverse(traces.slice(0, params[2][1].toNumber()))
        const [loadSignature] = validTraces
        /* Search for similar SSTORE */
        validTraces.forEach((trace, idx) => {
          const [type, name, ...params] = trace
          const [storeOffset, value, traceSize] = params
          if (name == 'SSTORE') {
            const matches = match(storeOffset, ['ADD', 'SHA3', 'MLOAD'])
            if (matches.length) {
              const storeSignature = validTraces[idx + 1] 
              assert(storeSignature)
              if (equal(loadSignature, storeSignature)) {
                const newNode = { me: value, childs: [] }
                buildDependencyTree(newNode, traces)
                childs.push(newNode)
              }
            }
          }
        })
      }
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
  prettify([symbol])
  console.log('----')
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
