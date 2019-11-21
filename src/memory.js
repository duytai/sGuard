class Memory {
  constructor() {
    this._m = []
  }

  write(offset, len, value) {
    this._m.push({ offset, len, value })
  }

  read() {
  }
}

module.exports = Memory
