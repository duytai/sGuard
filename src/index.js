const Contract = require('./contract')
const { forEach } = require('lodash')

const { COMPILED } = process.env

forEach(JSON.parse(COMPILED).contracts, (contractJson, name) => {
  const bin = Buffer.from(contractJson['bin-runtime'], 'hex')
  const contract = new Contract(bin)
})
