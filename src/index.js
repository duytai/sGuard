const assert = require('assert')
const Stack = require('./stack')
const Memory = require('./memory')
const Program = require('./program')
const { forEach } = require('lodash')
const { splitIntoBlocks } = require('./shared')

const { ASM } = process.env
forEach(JSON.parse(ASM).contracts, (contract, name) => {
  forEach(contract.asm, (asm, name) => {
    switch (name) {
      case '.code': {
        break
      }
      case '.data': {
        const blocks = splitIntoBlocks(asm['0']['.code'])
        const context = { pc: 0, bid: '0' }
        const state = {
          stack: new Stack(),
          memory: new Memory(),
          storage: [],
          blocks,
          context,
        }
        new Program(state).execute()
        break
      }
      default: {
        assert(`Unknown property ${name}`)
      }
    }
  })
})
