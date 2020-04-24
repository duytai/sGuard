const assert = require('assert')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const dotenv = require('dotenv')
const { Evm } = require('../src/evm')
const { logger, gb, prettify, addFunctionSelector } = require('../src/shared')
const { forEach } = require('lodash')
const { Condition, Cache } = require('../src/analyzer')
const { Scanner } = require('../src/vul')
const SRCMap = require('../src/srcmap')

const { SYM_CONTRACT_FILE: contractFile, SYM_JSON_FILE: jsonFile } = process.env
assert(contractFile)
assert(jsonFile)
assert(fs.existsSync(jsonFile), 'json must exist')
assert(fs.existsSync(contractFile), 'sol must exist')

const source = fs.readFileSync(contractFile, 'utf8')
const output = fs.readFileSync(jsonFile, 'utf8')
const jsonOutput = JSON.parse(output)
assert(jsonOutput.sourceList.length == 1)
const sourceIndex = jsonOutput.sourceList[0]
const { AST } = jsonOutput.sources[sourceIndex]
const { children } = AST
const { attributes: { name } } = children[children.length - 1]
addFunctionSelector(AST)
forEach(jsonOutput.contracts, (contractJson, full) => {
  const contractName = full.split(':')[1]
  if (name != contractName) return
  const rawBin = contractJson['bin-runtime']
    .split('_').join('0')
    .split('$').join('0')
  const bin = Buffer.from(rawBin, 'hex')
  const evm = new Evm(bin)
  const srcmap = new SRCMap(contractJson['srcmap-runtime'] || '0:0:0:0', source, bin)
  logger.info(`Start Analyzing Contract: ${gb(contractName)}`)
  const { endPoints, njumpis, cjumpis } = evm.start()
  logger.info(`----------------------------------------------`)
  logger.info(`|\tendpoints  : ${gb(endPoints.length)}`)
  logger.info(`|\tcjumpis    : ${gb(cjumpis)}`)
  logger.info(`|\tnjumpis    : ${gb(njumpis)}`)
  logger.info(`----------------------------------------------`)
    // const condition = new Condition(endPoints)
    // const cache = new Cache(condition, endPoints, srcmap)
    // const scanner = new Scanner(cache, srcmap, AST)
    // scanner.scan()
})
