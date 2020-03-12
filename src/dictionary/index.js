const assert = require('assert')
const { uniqBy } = require('lodash')
const { Register } = require('../analyzer')
const { isConst } = require('../shared')

class Dictionary {
  constructor(endPoints) {
    assert(endPoints)
    this.endPoints = endPoints
    this.props = {
      transfer: false,
      payable: true,
    }
    this.hasTransfer = false
    this.hasPayable = false
    this.builds = this.prebuild()
  }

  prebuild() {
    const builds = {}
    this.endPoints.forEach(end => {
      const { ep } = end
      const flags = []
      ep.forEach(({ opcode: { name }, stack }, idx) => {
        switch (name) {
          case 'CALL': {
            const subEp = end.sub(idx + 1)
            /// Send Value
            {
              const trackingPos = stack.size() - 3
              const symbol = stack.get(trackingPos)
              if (isConst(symbol) && symbol[1].isZero()) return
              if (!builds['CALL/VALUE']) builds['CALL/VALUE'] = []
              const register = new Register(symbol, trackingPos, subEp, this.endPoints)
              builds['CALL/VALUE'].push(register.dnode)
            }
            /// Send address
            {
              const trackingPos = stack.size() - 2
              const symbol = stack.get(trackingPos)
              const register = new Register(symbol, trackingPos, subEp, this.endPoints)
              if (!builds['CALL/ADDRESS']) builds['CALL/ADDRESS'] = []
              builds['CALL/ADDRESS'].push(register.dnode)
            }
            break
          }
          case 'DELEGATECALL': {
            const subEp = end.sub(idx + 1)
            // Send address
            const trackingPos = stack.size() - 2
            const symbol = stack.get(trackingPos)
            const register = new Register(symbol, trackingPos, subEp, this.endPoints)
            if (!builds['DELEGATECALL/ADDRESS']) builds['DELEGATECALL/ADDRESS'] = []
            builds['DELEGATECALL/ADDRESS'].push(register.dnode)
            break
          }
        }
        this.props.transfer = this.props.transfer || ['CALL', 'DELEGATECALL', 'CALLCODE'].includes(name)
        if (idx == 3) this.props.payable = this.props.payable && name == 'PUSH'
      })
    })
    return builds
  }

  findBuilds(names) {
    assert(names && names.length > 0)
    return names.reduce((all, next) => {
      return [...all, ...(this.builds[next] || []) ]
    }, [])
  }

  treeSearch(stack, cond) {
    assert(stack && cond)
    const ret = []
    while (stack.length) {
      const dnode = stack.pop()
      const { node: { me, childs } } = dnode
      if (cond(me)) ret.push(dnode)
      childs.forEach(child => stack.push(child))
    }
    return uniqBy(ret, ({ node: { id }}) => id)
  }

}

module.exports = Dictionary 
