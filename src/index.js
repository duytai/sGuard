const assert = require('assert')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const dotenv = require('dotenv')
const { Evm } = require('./evm')
const { logger, gb, prettify } = require('./shared')
const { forEach } = require('lodash')
const { Condition, Cache } = require('./analyzer')
const { Scanner } = require('./vul')
const SRCMap = require('./srcmap')

const { parsed: { contract, conversion, vulnerabilities } } = dotenv.config()
assert(contract, 'require contract in .env')
const pwd = shell.pwd().toString()
const contractFile = path.join(pwd, contract)
assert(fs.existsSync(contractFile), 'contract must exist')
const jsonFile = `${contractFile}.json`

logger.info(`display compiler version`)
shell.exec(`solc --version`)
logger.info(`compile ${gb(contract)} by using env compiler`)
shell.exec(`solc --combined-json bin-runtime,srcmap-runtime,ast ${contractFile} > ${jsonFile}`)
assert(fs.existsSync(jsonFile), 'json must exist')

const source = fs.readFileSync(contractFile, 'utf8')
const output = fs.readFileSync(jsonFile, 'utf8')
const jsonOutput = JSON.parse(output)
assert(jsonOutput.sourceList.length == 1)
const sourceIndex = jsonOutput.sourceList[0]
const { AST } = jsonOutput.sources[sourceIndex]
const { children } = AST
const { attributes: { name } } = children[children.length - 1]
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
  const { endPoints, coverage } = evm.start()
  logger.info(`----------------------------------------------`)
  logger.info(`|\tEndpoints  : ${gb(endPoints.length)}`)
  logger.info(`|\tCoverage   : ${gb(coverage + '%')}`)
  logger.info(`----------------------------------------------`)
  if (conversion) {
    endPoints.forEach(ep => ep.showTrace(srcmap))
  } else {
    const condition = new Condition(endPoints)
    const cache = new Cache(condition, endPoints, srcmap)
    const scanner = new Scanner(cache, srcmap, AST)
    scanner.scan()
  }
})
