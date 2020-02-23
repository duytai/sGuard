const assert = require('assert')
const fs = require('fs')
const { Evm } = require('./evm')
const { logger } = require('./shared')
const { forEach } = require('lodash')
const Analyzer = require('./analyzer')
const Oracle = require('./oracle')

assert(process.env.COMPILED)
const compiled = fs.readFileSync(process.env.COMPILED, 'utf8')

forEach(JSON.parse(compiled).contracts, (contractJson, name) => {
  const bin = Buffer.from(contractJson['bin-runtime'], 'hex')
  const evm = new Evm(bin)
  console.log(`++++++++++ Analyzing contract: ${name} ++++++++++`)
  evm.start()
  const { checkPoints, endPoints } = evm
  // checkPoints.forEach(data => {
    // const analyzer = new Analyzer(data, endPoints)
    // const oracle = new Oracle(analyzer)
    // analyzer.prettify()
    // const bugNames = ['BLOCK_DEP', 'TIME_DEP']
    // oracle.findBugs(bugNames).forEach(dep => {
      // dep.report()
    // })
  // })
})
