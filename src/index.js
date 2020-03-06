const assert = require('assert')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const dotenv = require('dotenv')
const chalk = require('chalk')
const { Evm } = require('./evm')
const { logger } = require('./shared')
const { forEach } = require('lodash')
const Analyzer = require('./analyzer')
const SRCMap = require('./srcmap')
const Vul = require('./vul')

const { parsed: { contract, conversion, vulnerabilities } } = dotenv.config()
assert(contract, 'require contract in .env')
const pwd = shell.pwd().toString()
const contractFile = path.join(pwd, contract)
assert(fs.existsSync(contractFile), 'contract must exist')
const jsonFile = `${contractFile}.json`

logger.info(`display compiler version`)
shell.exec(`solc --version`)
logger.info(`compile ${chalk.green.bold(contract)} by using env compiler`)
shell.exec(`solc --combined-json bin-runtime,srcmap-runtime ${contractFile} > ${jsonFile}`)
assert(fs.existsSync(jsonFile), 'json must exist')

const source = fs.readFileSync(contractFile, 'utf8')
const output = fs.readFileSync(jsonFile, 'utf8')
forEach(JSON.parse(output).contracts, (contractJson, name) => {
  const rawBin = contractJson['bin-runtime']
    .split('_').join('0')
    .split('$').join('0')
  const bin = Buffer.from(rawBin, 'hex')
  const evm = new Evm(bin)
  const srcmap = new SRCMap(contractJson['srcmap-runtime'] || '0:0:0:0', source, bin)
  logger.info(`Start Analyzing Contract: ${chalk.green.bold(name.split(':')[1])}`)
  const { checkPoints, endPoints } = evm.start()
  logger.info(`Checkpoints: ${checkPoints.length}`)
  logger.info(`Endpoints  : ${endPoints.length}`)
  if (conversion) {
    endPoints.forEach(ep => ep.showTrace(srcmap))
  } else {
    checkPoints.forEach(ep => {
      ep.showTrace(srcmap)
      const analyzer = new Analyzer(ep, endPoints)
      const vul = new Vul(analyzer.getdnode())
      const vulnames = vulnerabilities ? JSON.parse(vulnerabilities) : []
      analyzer.prettify(srcmap)
      vul.report(vulnames, srcmap)
    })
  }
})
