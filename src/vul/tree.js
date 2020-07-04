const assert = require('assert')
const { toPairs } = require('lodash')
const { DNode } = require('../analyzer')

class Tree {

  constructor(cache) {
    this.root = new DNode(['symbol', 'root'], 0, 0, 0)
    this.cache = cache
  }

  toKey(endPointIdx, epIdx) {
    assert(endPointIdx >= 0 && epIdx >= 0)
    return [endPointIdx, epIdx].join(':')
  }

  build(endPointIdx, epIdx, value) {
    const stack = [
      { 
        directParent: this.root,
        endPointIdx,
        epIdx,
        value,
      }
    ]
    const visited = new Set()
    while (stack.length) {
      const { directParent, endPointIdx, epIdx, value } = stack.pop()
      const { expression, sloads, mloads, links } = value
      const { mem: { branches, mstores, sstores } } = this.cache
      const { pc } = this.cache.endPoints[endPointIdx].ep[epIdx]
      const dnode = new DNode(expression, pc, endPointIdx, epIdx)
      const branch = branches[endPointIdx]
      const bug = { stack: stack.length, visited: visited.size }
      process.send && process.send({ bug })
      directParent.node.childs.push(dnode)
      links.forEach(epIdx => {
        const key = this.toKey(endPointIdx, epIdx)
        if (!visited.has(key)) {
          visited.add(key)
          stack.push({ 
            directParent: dnode,
            endPointIdx,
            epIdx,
            value: branch[epIdx],
          })
        }
      })
      const mstore = mstores[endPointIdx]
      const mloadStack = [...mloads]
      while (mloadStack.length) {
        const mload = mloadStack.pop()
        const pairs = toPairs(mstore).reverse()
        for (let i = 0; i < pairs.length; i++) {
          const [mstoreEpIdx, value] = pairs[i]
          if (parseInt(mstoreEpIdx) < parseInt(epIdx)) {
            if (mload.eq(value.key)) {
              const key = this.toKey(endPointIdx, mstoreEpIdx)
              if (!visited.has(key)) {
                visited.add(key)
                stack.push({ 
                  directParent: dnode,
                  endPointIdx,
                  epIdx: mstoreEpIdx,
                  value,
                })
              }
              if (
                mload.locs.length == 1
                && value.key.locs.length == 1
              ) break
            }
          }
        }
      }
      sstores.forEach((sstore, endPointIdx) => {
        toPairs(sstore).forEach(([sstoreEpIdx, value]) => {
          sloads.forEach(sload => {
            if (sload.eq(value.key)) {
              const key = this.toKey(endPointIdx, sstoreEpIdx)
              if (!visited.has(key)) {
                visited.add(key)
                stack.push({ 
                  directParent: dnode,
                  endPointIdx,
                  epIdx: sstoreEpIdx,
                  value,
                })
              }
            }
          })
        })
      })
    }
  }
}

module.exports = Tree
