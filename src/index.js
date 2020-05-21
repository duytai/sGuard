const assert = require('assert')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const { Evm } = require('./evm')
const { logger, gb, prettify, addFunctionSelector } = require('./shared')
const { forEach } = require('lodash')
const strip = require('strip-comments');
const { Condition, Cache } = require('./analyzer')
const { Scanner } = require('./vul')
const SRCMap = require('./srcmap')

const config = process.argv[2]
const { contract, fixed } = JSON.parse(config)
assert(contract, 'require contract')
const pwd = shell.pwd().toString()
const contractFile = path.join(pwd, contract)
const fixedFile = path.join(pwd, fixed)
assert(fs.existsSync(contractFile), 'contract must exist')
const jsonFile = `${contractFile}.json`

logger.info(`strip comments from contract`)
let source = strip(fs.readFileSync(contractFile, 'utf8'))
fs.writeFileSync(contractFile, source)

logger.info(`display compiler version`)
shell.exec(`solc --version`)
logger.info(`compile ${gb(contract)} by using env compiler`)
const { code } = shell.exec(`solc --combined-json bin-runtime,srcmap-runtime,ast,asm ${contractFile} > ${jsonFile}`)
if (code != 0) {
  logger.error(`failed to compile ${gb(contract)}`)
  process.exit()
}
source = fs.readFileSync(contractFile, 'utf8')
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
  let rawBin = contractJson['bin-runtime']
    .split('_').join('0')
    .split('$').join('0')
  const auxdata = contractJson['asm']['.data'][0]['.auxdata']
  rawBin = rawBin.slice(0, -auxdata.length)
  const bin = Buffer.from(rawBin, 'hex')
  const evm = new Evm(bin)
  const srcmap = new SRCMap(contractJson['srcmap-runtime'] || '0:0:0:0', source, bin)
  logger.info(`Start Analyzing Contract: ${gb(contractName)}`)
  const { endPoints, njumpis, cjumpis } = evm.start()
  const coverage = Math.round((cjumpis + 1) / (njumpis + 1) * 100)
  logger.info(`----------------------------------------------`)
  logger.info(`|\tEndpoints  : ${gb(endPoints.length)}`)
  logger.info(`|\tcjumpis    : ${gb(cjumpis)}`)
  logger.info(`|\tnjumpis    : ${gb(njumpis)}`)
  logger.info(`|\tCoverage   : ${gb(coverage + '%')}`)
  logger.info(`----------------------------------------------`)
  const condition = new Condition(endPoints)
  const cache = new Cache(condition, endPoints, srcmap)
  const scanner = new Scanner(cache, srcmap, AST)
  const uncheckOperands = scanner.scan()
  const bugFixes = scanner.generateBugFixes(uncheckOperands)
  const guard = scanner.fix(bugFixes)
  fs.writeFileSync(fixedFile, guard, 'utf8')
  const result = shell.exec(`solc ${fixedFile}`)
  const { code } = result
  if (code) {
    logger.error(`[*] Failed to compile fixed contract`)
  } else {
    logger.info(`[*] Compile fixed contract successfully`)
  }
})
