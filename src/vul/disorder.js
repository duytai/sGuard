const assert = require('assert')
const { formatSymbol } = require('../shared')
const Oracle = require('./oracle')
const Analyzer = require('../analyzer')
const Condition = require('../analyzer/condition')
const Register = require('../analyzer/register')

class Disorder extends Oracle {
  startFinding() {
    return []
    let founds = []
    this.endPoints.forEach(({ ep }) => {
      for (let i = 0; i < ep.length; i++) {
        const { opcode: { name }, pc } = ep[i]
        if (name == 'CALL') {
          const found = formatSymbol(ep[i + 1].stack.last())
          if (!founds.find(({ found: f }) => f == found)) {
            founds.push({ found, pc })
          }
        }
      }
    })
    this.endPoints.forEach(end => {
      const { ep } = end
      const { stack } = ep[ep.length - 1]
      const register = new Register(stack.last(), stack.size() - 1, end, this.endPoints)
      const loopStack = [register.dnode]
      while (loopStack.length) {
        const dnode = loopStack.pop()
        const { node: { me, childs } } = dnode
        const txt = formatSymbol(me)
        founds = founds.filter(({ found: f }) => !txt.includes(f))
        childs.forEach(child => loopStack.push(child))
      }
    })
    return founds.map(({ pc }) => Analyzer.fakeNode('CALL', pc))
  }
}

module.exports = Disorder
