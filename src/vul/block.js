const assert = require('assert')
const { formatSymbol, isConst } = require('../shared')
const { Register } = require('../analyzer')
const Oracle = require('./oracle')

class Block extends Oracle {
  startFinding() {
    const dnodes = []
    this.endPoints.forEach(end => {
      const { ep } = end
      ep.forEach(({ opcode: { name }, stack }, idx) => {
        if (name == 'CALL') {
          const subEp = end.sub(idx + 1)
          /// Send Value
          {
            const trackingPos = stack.size() - 3
            const symbol = stack.get(trackingPos)
            if (isConst(symbol) && symbol[1].isZero()) return
            const register = new Register(symbol, trackingPos, subEp, this.endPoints)
            dnodes.push(register.dnode)
          }
          /// Send address
          {
            const trackingPos = stack.size() - 2
            const symbol = stack.get(trackingPos)
            const register = new Register(symbol, trackingPos, subEp, this.endPoints)
            dnodes.push(register.dnode)
          }
        }
      })
    })
    return this.treeSearch(dnodes, (me) => {
      const txt = formatSymbol(me)
      return txt.includes('NUMBER') || txt.includes('TIMESTAMP')
    })
  }
}

module.exports = Block
