const assert = require('assert')
const { formatSymbol, findSymbols } = require('../../shared')

class TxOrigin {
  constructor(srcmap, ast) {
    this.srcmap = srcmap
    this.ast = ast
    this.fragments = this.findOperands()
  }

  findOperands() {
    const stack = [this.ast]
    const fragments = {}
    while (stack.length) {
      const item = stack.pop()
      const children = item.children || []
      if (item.attributes && item.attributes.contractKind == 'library') {
        continue
      }
      if (item.attributes && item.attributes.member_name == 'origin') {
        const [s, l] = item.src.split(':').map(x => parseInt(x))
        const frag = { range: [s, s + l], operands: [], operator: 'fix:origin' }
        fragments[`${s}:${l}`] = frag
      }
      children.forEach(c => stack.push(c))
    }
    return fragments
  }

  scan(tree, endPoints) {
    const targets = ['ORIGIN']
    const dnodes = tree.root.traverse(({ node: { me } }) => {
      const sy = formatSymbol(me)
      for (let i = 0; i < targets.length; i++) {
        if (sy.includes(`${targets[i]}(`)) return true
      }
      return false
    })
    dnodes.forEach(dnode => {
      const { node: { me, endPointIdx } } = dnode
      const nodes = findSymbols(me, ([_, name]) => targets.includes(name))
      nodes.forEach(node => {
        const epIdx = node[2][1].toNumber() - 1
        const endPoint = endPoints[endPointIdx]
        const { pc, opcode } = endPoint.get(epIdx)
        const { s, l } = this.srcmap.toSL(pc)
        const id = `${s}:${l}`
        if (this.fragments[id]) {
          this.fragments[id].selected = true
        }
      })
    })
    const fragments = Object.values(this.fragments)
      .filter(({ selected }) => selected)
    return fragments
  }
} 

module.exports = TxOrigin
