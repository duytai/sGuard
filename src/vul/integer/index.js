const assert = require('assert')
const { toPairs } = require('lodash')
const Tree = require('../tree')
const Subtract = require('./subtract')
const Addition = require('./addition')
const Multiply = require('./multiply')
const Division = require('./division')
const Delegate = require('./delegate')
const Block = require('./block')
const Pow = require('./pow')

class Integer {
  constructor(cache, srcmap, ast) {
    this.cache = cache
    this.srcmap = srcmap
    this.ast = ast
  }

  scan(bug) {
    const { mem: { calls }, endPoints } = this.cache
    const tree = new Tree(this.cache, bug)
    calls.forEach((call, endPointIdx) => {
      toPairs(call).forEach(([epIdx, value]) => {
        tree.build(endPointIdx, epIdx, value)
      })
    })
    tree.root.prettify()
    const subtract = new Subtract(this.cache, this.srcmap, this.ast)
    const addition = new Addition(this.cache, this.srcmap, this.ast)
    const multiply = new Multiply(this.cache, this.srcmap, this.ast)
    const division = new Division(this.cache, this.srcmap, this.ast)
    const delegate = new Delegate(this.cache, this.srcmap, this.ast)
    const block = new Block(this.cache, this.srcmap, this.ast)
    const pow = new Pow(this.cache, this.srcmap, this.ast)
    return [
      ...subtract.scan(tree, bug),
      ...addition.scan(tree, bug),
      ...multiply.scan(tree, bug),
      ...division.scan(tree, bug),
      ...pow.scan(tree, bug),
      // ...delegate.scan(tree),
      // ...block.scan(tree),
    ]
  }
} 

module.exports = Integer 
