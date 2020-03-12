const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const { Register } = require('../analyzer')
const Oracle = require('./oracle')

class Block extends Oracle {
  startFinding() {
    let ret = []
    this.endPoints.forEach(end => {
      const { ep } = end
      ep.forEach(({ opcode: { name }, stack }, idx) => {
        if (name == 'CALL') {
          const trackingPos = stack.size() - 3
          const symbol = stack.get(trackingPos)
          if (isConst(symbol) && symbol[1].isZero()) return
          const subEp = end.sub(idx + 1)
          const register = new Register(symbol, trackingPos, subEp, this.endPoints)
          const founds = this.treeSearch([register.dnode], (me) => {
            const txt = formatSymbol(me)
            return txt.includes('NUMBER') || txt.includes('TIMESTAMP')
          })
          ret = [...ret, ...founds]
        }
      })
    })
    return ret
  }
}

module.exports = Block
