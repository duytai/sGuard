const assert = require('assert')
const fs = require('fs')
const Evm = require('./evm')
const { logger } = require('./shared')
const { forEach } = require('lodash')

assert(process.env.COMPILED)
const compiled = fs.readFileSync(process.env.COMPILED, 'utf8')

forEach(JSON.parse(compiled).contracts, (contractJson, name) => {
  const bin = Buffer.from(contractJson['bin-runtime'], 'hex')
  const evm = new Evm(bin)
  console.log(`++++++++++ Analyzing contract: ${name} ++++++++++`)
  evm.execute()
})
