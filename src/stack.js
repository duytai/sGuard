const assert = require('assert')

class Stack {
  constructor() {
    this.st = []
  }

  push(v) {
    this.st.push(v)
  }

  top() {
    assert(this.st.length > 0)
    return this.st[this.st.length - 1]
  }

  pop() {
    this.st.pop()
  }

  popN(n) {
    assert(n <= this.st.length)
    if (!n) return []
    return this.st.splice(-n).reverse()
  }
}

module.exports = Stack
