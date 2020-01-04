const { uniq, findIndex } = require('lodash')
const assert = require('assert')
const {
  formatSymbol,
  isMstore0,
  isMstore40,
  isSstoreConst,
  isMstoreGte80,
} = require('../shared')

class NameAllocator {
  allocate(base) {
    assert(base)
    const baseStr = formatSymbol(base)
    const idx = findIndex(this.dict, (it) => it == baseStr)
    assert(idx >= 0)
    return idx
  }
}

class StorageNameAllocator extends NameAllocator {
  constructor(trace) {
    super()
    assert(trace)
    const indirectStorageBase = trace
      .filter(isMstore0)
      .values()
      .map(formatSymbol)
    const directStorageBase = trace
      .filter(isSstoreConst)
      .keys()
      .map(formatSymbol)
    this.dict = uniq([
      ...directStorageBase,
      ...indirectStorageBase
    ]).sort((x, y) => x.length - y.length)
  }

  allocate(base) {
    const idx = super.allocate(base)
    return `s_${idx.toString(16)}`
  }
}

class MemoryNameAllocator extends NameAllocator {
  constructor(trace) {
    super()
    assert(trace)
    const indirectMemoryBase = trace
      .filter(isMstore40)
      .values()
      .map(formatSymbol)
    const directMemoryBase = trace
      .filter(isMstoreGte80)
      .keys()
      .map(formatSymbol)
    this.dict = uniq([
      ...directMemoryBase,
      ...indirectMemoryBase,
    ]).sort((x, y) => x.length - y.length)
  }

  allocate(base) {
    const idx = super.allocate(base)
    return `m_${idx.toString(16)}`
  }
}

const NameAllocatorFactory = {
  byName(name, trace) {
    switch (name) {
      case 'STORAGE': {
        return new StorageNameAllocator(trace)
      }
      case 'MEMORY': {
        return new MemoryNameAllocator(trace)
      }
      default: {
        assert(false, `${name} was not supported`)
      }
    }
  }
}

module.exports = NameAllocatorFactory
