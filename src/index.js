const assert = require('assert')
const fs = require('fs')
const Contract = require('./contract')
const { logger } = require('./shared')
const { forEach } = require('lodash')

assert(process.env.COMPILED)
const compiled = fs.readFileSync(process.env.COMPILED, 'utf8')

forEach(JSON.parse(compiled).contracts, (contractJson, name) => {
  if (name.endsWith('EthicHubLending')) {
    const bin = Buffer.from(contractJson['bin-runtime'], 'hex')
    const contract = new Contract(bin)
    console.log(`++++++++++ Analyzing contract: ${name} ++++++++++`)
    contract.execute()
  }
})
