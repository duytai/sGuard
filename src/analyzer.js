const assert = require('assert')
const { reverse, last, first } = require('lodash')
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
/*
 * Compare two symbols
 * */
const equal = (s1, s2) => format(s1) == format(s2)
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
/*
 * Traverse the symbol and return their posible paths which
 * do not includes const at the end
 * */
const traverse = (symbol, path = [], indexes = [], paths = []) => {
  const [type, name, ...params] = symbol
  if (type == 'const')  {
    const key = indexes.slice(0, -1).join(':')
    const hasKey = paths.find(({ key: otherKey, path }) => key == otherKey)
    if (!hasKey) {
      paths.push({ key, path })
    }
  } else {
    path.push(symbol)
    params.forEach((param, index) => {
      traverse(param, [...path], [...indexes, index], paths)
    })
  }
  return paths
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
      const validTraces = reverse(traces.slice(0, traceSize[1].toNumber()))
      const allMatches = traverse(me).filter(({ key, path }) => {
        if (path.length < 2) return false
        return first(path)[1] == 'MLOAD' && last(path)[1] == 'MLOAD'
      })
      allMatches.forEach(({ key: loadKey, path })=> {
        const loadSignature = last(path)
        const [type, name, ...loadParams] = loadSignature
        assert(isConstWithValue(loadParams[0], 0x40))
        assert(isConstWithValue(loadParams[1], 0x20))
        assert(isConst(loadParams[2]))
        validTraces.forEach((trace, idx) => {
          const allMatches = traverse(trace).filter(({ key: storeKey, path }) => {
            if (path.length < 2) return false
            if (first(path)[1] != 'MSTORE' || last(path)[1] != 'MLOAD') return false
            return loadKey == storeKey 
          })
          allMatches.forEach(({ path }) => {
            const storeSignature = last(path)
            if (equal(loadSignature, storeSignature)) {
              const [type, name, storeOffset, value] = trace
              const newNode = { me: value, childs: [] }
              buildDependencyTree(newNode, traces)
              childs.push(newNode)
            }
          })
        })
      })
      break
    }
    case 'SLOAD': {
      const [loadOffset, traceSize] = me.slice(2)
      assert(isConst(traceSize))
      if (isConst(loadOffset)) {
        /*
         * For static address, storage location is statically assigned
         * We can not deconstruct variable location
         * Example:
         * uint[10] balances;
         * uint[10] photos;
         * {
         *   balances[0] = block.number;
         *   photos[0] = block.timestamp;
         *   msg.sender.send(balances[9] + photos[9]);
         * }
         * We can not distinguish between photos and balances. However a variable is primitive type
         * or indexAccess of load and store is the same then we can detect
         * */
        const validTraces = reverse(traces.slice(0, traceSize[1].toNumber()))
        for (let i = 0; i < validTraces.length; i ++) {
          const trace = validTraces[i]
          const [type, name, ...params] = trace
          if (name == 'SSTORE') {
            const [storeOffset, value, traceSize] = params
            if (isConst(storeOffset)) {
              if (storeOffset[1].toNumber() == loadOffset[1].toNumber()) {
                const newNode = { me: value, childs: [] }
                buildDependencyTree(newNode, traces)
                childs.push(newNode)
              }
            }
          }
        }
      } else {
        const validTraces = reverse(traces.slice(0, traceSize[1].toNumber()))
        const allMatches = traverse(me).filter(({ key, path }) => {
          if (path.length < 3) return false
          return first(path)[1] == 'SLOAD' && path[path.length - 2][1] == 'SHA3'
        })
        assert(allMatches.length == 1)
        const [loadSignature] = validTraces
        allMatches.forEach(({ key: loadKey, path })=> {
          validTraces.forEach((trace, idx) => {
            const allMatches = traverse(trace).filter(({ key: storeKey, path }) => {
              if (path.length < 3) return false
              if (first(path)[1] != 'SSTORE') return false
              if (last(path)[1] != 'MLOAD') return false
              if (path[path.length - 2][1] != 'SHA3') return false
              return loadKey == storeKey
            })
            allMatches.forEach(({ path }) => {
              const [type, name, ...loadParams] = last(path)
              assert(isConstWithValue(loadParams[0], 0x00))
              assert(isConstWithValue(loadParams[1], 0x20) || isConstWithValue(loadParams[1], 0x40))
              assert(isConst(loadParams[2]))
              const storeSignature = validTraces[idx + 1]
              if (equal(loadSignature, storeSignature)) {
                const [type, name, storeOffset, value] = trace
                const newNode = { me: value, childs: [] }
                buildDependencyTree(newNode, traces)
                childs.push(newNode)
              }
            })
          })
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
