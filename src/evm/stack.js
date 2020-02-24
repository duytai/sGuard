const assert = require('assert')
const { reverse } = require('lodash') 
const { prettify, logger } = require('../shared')

class Stack {
  constructor() {
    this.st = []
  }

  clear() {
    this.st.length = 0
  }

  push(t) {
    this.st.push(t)
  }

  pop() {
    assert(this.st.length > 0)
    return this.st.pop()
  }

  popN(n) {
    assert(n > 0)
    assert(this.st.length >= n)
    return this.st.splice(-n).reverse()
  }

  swapN(n) {
    const target = this.st.length - 1 - n 
    const tmp = this.st[target]
    assert(target >= 0)
    this.st[target] = this.st[this.st.length - 1]
    this.st[this.st.length - 1] = tmp
  }

  dupN(n) {
    const target = this.st.length - n 
    assert(target >= 0)
    this.st.push(this.st[target])
  }

  clone() {
    const stack = new Stack()
    stack.st = [...this.st]
    return stack
  }

  filter(cond) {
    assert(cond)
    return reverse([...this.st]).filter(t => cond(t))
  }

  find(cond) {
    assert(cond)
    return reverse([...this.st]).find(t => cond(t))
  }

  size() {
    return this.st.length
  }

  get(idx) {
    assert(idx >= 0 && idx <= this.st.length)
    return this.st[idx]
  }

  last() {
    assert(this.st.length > 0)
    return this.st[this.st.length - 1]
  }

  prettify(space = 0) {
    logger.info(`>> Full stack ${this.st.length}`)
    prettify(this.st, space)
  }

}

module.exports = Stack
