const assert = require('assert')
const fs = require('fs')
const { Evm, Stack, ExecutionPath } = require('./evm')
const { Trace } = require('./trace')
const { logger } = require('./shared')
const { forEach } = require('lodash')

assert(process.env.COMPILED)
const compiled = fs.readFileSync(process.env.COMPILED, 'utf8')

forEach(JSON.parse(compiled).contracts, (contractJson, name) => {
  const bin = Buffer.from(contractJson['bin-runtime'], 'hex')
  const evm = new Evm(bin)
  console.log(`++++++++++ Analyzing contract: ${name} ++++++++++`)
  const stack = new Stack()
  const ep = new ExecutionPath()
  const trace = new Trace()
  const pc = 0
  evm.execute(pc, stack, ep, trace)
})
