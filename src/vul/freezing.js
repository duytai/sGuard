const assert = require('assert')
const Oracle = require('./oracle')
const Analyzer = require('../analyzer')
const { findSymbol, prettify } = require('../shared')

class Freezing extends Oracle {
  startFinding() {
    return []
    const ret = []
    const foundTransfer = !!this.endPoints.find(({ ep }) => {
      return !!ep.find(({ opcode: { name } }) => ['CALL', 'DELEGATECALL', 'CALLCODE'].includes(name))
    })
    if (!foundTransfer) {
      const flags = []
      this.endPoints.find(({ ep }) => {
        const flag = ep.map(({ opcode: { name } }) => name)[3]
        if (!flags.includes(flag)) flags.push(flag)
      })
      assert(flags.length == 1)
      const [flag] = flags
      assert(['PUSH', 'CALLVALUE'].includes(flag))
      if (flag == 'PUSH') ret.push(Analyzer.fakeNode('No Info'))
    }
    return ret
  }
}

module.exports = Freezing 
