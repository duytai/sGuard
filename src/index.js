const assert = require('assert')
const fs = require('fs')
const Contract = require('./contract')
const { splitIntoBlocks } = require('./shared')
const { forEach } = require('lodash')

assert(process.env.COMPILED)
const compiled = fs.readFileSync(process.env.COMPILED, 'utf8')

forEach(JSON.parse(compiled).contracts, (contractJson, name) => {
  const bin = Buffer.from(contractJson['bin-runtime'], 'hex')
  const asm = contractJson.asm['.data']['0']['.code']
  const contract = new Contract(bin, asm)
})
