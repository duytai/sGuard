const BN = require('bn.js')
const { assign } = require('lodash')
const { prettify, isConst } = require('../shared')

const TWO_POW256 = new BN('10000000000000000000000000000000000000000000000000000000000000000', 16)

const traverse = (symbol) => {
  const [type, name, ...params] = symbol 
  if (type == 'symbol') {
    switch (name) {
      case 'SUB': {
        const [left, right] = params
        if (isConst(left) || isConst(right)) {
          const x = isConst(left) ? right : left
          const y = isConst(left) ? left : right
          const [type, name, ...params] = x
          if (name == 'ADD') {
            const [subLeft, subRight] = params
            if (isConst(subLeft) || isConst(subRight)) {
              const subX = isConst(subLeft) ? subRight : subLeft
              const subY = isConst(subLeft) ? subLeft : subRight
              symbol.length = 0
              const r = subY[1].sub(y[1]).toTwos(256)
              assign(symbol, [type, name, ['const', r], subX])
              return traverse(symbol)
            }
          }
        }
        break
      }
      case 'ADD': {
        const [left, right] = params
        if (isConst(left) || isConst(right)) {
          const x = isConst(left) ? right : left
          const y = isConst(left) ? left : right
          const [type, name, ...params] = x
          if (name == 'ADD') {
            const [subLeft, subRight] = params
            if (isConst(subLeft) || isConst(subRight)) {
              const subX = isConst(subLeft) ? subRight : subLeft
              const subY = isConst(subLeft) ? subLeft : subRight
              symbol.length = 0
              const r = y[1].add(subY[1]).mod(TWO_POW256)
              assign(symbol, [type, name, ['const', r], subX])
              return traverse(symbol)
            }
          }
        }
        break
      }
    }
    params.forEach(traverse)
  }
}

const simplify = (traces) => {
  traces.forEach(trace => traverse(trace))
  console.log('///NEW TRACES')
  prettify(traces)
}


module.exports = simplify
