const Contract = require('./contract')
const { opcodes } = require('./evm')
const { forEach } = require('lodash')

const { COMPILED } = process.env

forEach(JSON.parse(COMPILED).contracts, (contract, name) => {
  const bin = contract['bin-runtime']
  console.log(opcodes)
})
