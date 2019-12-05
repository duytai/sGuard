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

const match = (symbol, xpath) => {
  const internalMatch = (symbol, pathNames) => {
    if (!pathNames.length) return []
    const [name, paramIndex] = pathNames.shift().split(':')
    if (name != symbol[1]) return []
    const params = symbol.slice(2)
    if (paramIndex) return [symbol, ...internalMatch(params[parseInt(paramIndex)], [...pathNames])]
    return [symbol, ...params.reduce((agg, n) => [...agg, ...internalMatch(n, [...pathNames])], [])]
  }
  const pathNames = xpath.split('/')
  const ret = internalMatch(symbol, [...pathNames])
  assert(ret.length <= pathNames.length)
  if (ret.length < pathNames.length) return []
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
      const arrayMatches = match(me, 'MLOAD:0/ADD:1/MLOAD')
      if (arrayMatches.length) {
        const loadSignature = last(arrayMatches)
        const [type, name, ...loadParams] = loadSignature
        assert(isConstWithValue(loadParams[0], 0x40))
        assert(isConstWithValue(loadParams[1], 0x20))
        assert(isConst(loadParams[2]))
        const validTraces = reverse(traces.slice(0, traceSize[1].toNumber()))
        validTraces.forEach((trace, idx) => {
          const arrayMatches = match(trace, 'MSTORE:0/ADD:1/MLOAD')
          if (arrayMatches.length) {
            const storeSignature = last(arrayMatches)
            if (equal(loadSignature, storeSignature)) {
              const [type, name, storeOffset, value] = trace
              const newNode = { me: value, childs: [] }
              buildDependencyTree(newNode, traces)
              childs.push(newNode)
            }
          }
        })
      }
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
        /*
         * For dynamic array 
         * */
        const arrayMatches = match(me, 'SLOAD:0/ADD:0/SHA3:0/MLOAD')
        if (arrayMatches.length) {
          const [type, name, ...params] = last(arrayMatches)
          assert(isConstWithValue(params[0], 0x00))
          assert(isConstWithValue(params[1], 0x20))
          assert(isConst(params[2]))
          const validTraces = reverse(traces.slice(0, params[2][1].toNumber()))
          const [loadSignature] = validTraces
          /* Search for similar SSTORE */
          validTraces.forEach((trace, idx) => {
            const arrayMatches = match(trace, 'SSTORE:0/ADD:0/SHA3:0/MLOAD')
            if (arrayMatches.length) {
              const storeSignature = validTraces[idx + 1]
              assert(storeSignature)
              if (equal(loadSignature, storeSignature)) {
                const [type, name, storeOffset, value] = trace
                const newNode = { me: value, childs: [] }
                buildDependencyTree(newNode, traces)
                childs.push(newNode)
              }
            }
          })
        }
        /*
         * For dynamic mapping
         * */
        const mappingMatches = match(me, 'SLOAD:0/SHA3:0/MLOAD')
        if (mappingMatches.length) {
          const [type, name, ...params] = mappingMatches.pop()
          assert(isConstWithValue(params[0], 0x00))
          assert(isConstWithValue(params[1], 0x40))
          assert(isConst(params[2]))
          const validTraces = reverse(traces.slice(0, params[2][1].toNumber()))
          const [loadSignature] = validTraces
          /* Search for similar SSTORE */
          validTraces.forEach((trace, idx) => {
            const mappingMatches = match(trace, 'SSTORE:0/SHA3:0/MLOAD')
            if (mappingMatches.length) {
              const storeSignature = validTraces[idx + 1]
              assert(storeSignature)
              if (equal(loadSignature, storeSignature)) {
                const [type, name, storeOffset, value] = trace
                const newNode = { me: value, childs: [] }
                buildDependencyTree(newNode, traces)
                childs.push(newNode)
              }
            }
          })
        }
        /*
         * For dynamic mapping, but local storage (storage keyword in function)
         * */
        const localStorageMatches = match(me, 'SLOAD:0/ADD:1/ADD:1/SHA3:0/MLOAD')
        if (localStorageMatches.length) {
          const [type, name, ...params] = last(localStorageMatches)
          assert(isConstWithValue(params[0], 0x00))
          assert(isConstWithValue(params[1], 0x20))
          assert(isConst(params[2]))
          const loadSignature = last(localStorageMatches)
          const validTraces = reverse(traces.slice(0, traceSize[1].toNumber()))
          /* Search for similar SSTORE */
          validTraces.forEach((trace, idx) => {
            const localStorageMatches = match(trace, 'SSTORE:0/ADD:1/ADD:1/SHA3:0/MLOAD')
            console.log(`localStorageMatches: ${localStorageMatches.length}`)
            if (localStorageMatches.length) {
              const storeSignature = last(localStorageMatches)
              assert(storeSignature)
              if (equal(loadSignature, storeSignature)) {
                const [type, name, storeOffset, value] = trace
                const newNode = { me: value, childs: [] }
                buildDependencyTree(newNode, traces)
                childs.push(newNode)
              }
            }
          })
        }
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
