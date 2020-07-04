const assert = require('assert')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const { Evm, Decoder } = require('./evm')
const { logger, gb, prettify, addFunctionSelector } = require('./shared')
const { forEach } = require('lodash')
const { Condition, Cache } = require('./analyzer')
const { Scanner } = require('./vul')
const SRCMap = require('./srcmap')

let contractFile = 'contracts/sample.sol'
let fixedFile = 'contracts/fixed.sol'
let jsonFile = 'contracts/sample.sol.json'

if (process.send) {
  const d = JSON.parse(process.argv[2])
  contractFile = d.contractFile
  fixedFile = d.fixedFile
  jsonFile = d.jsonFile
} else {
  const { code } = shell.exec(`solc --combined-json bin-runtime,srcmap-runtime,ast,asm ${contractFile} > ${jsonFile}`)
  if (code != 0) {
    console.log(`[+] Failed to compile`)
    return
  } 
}
/* strip comments */
source = fs.readFileSync(contractFile, 'utf8')
const lines = source.split('\n').length
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
  const decoder = new Decoder(bin)
  const { sum: { nexts } } = decoder
  process.send && process.send({
    contract: { name },
    duration: { runAt: Date.now() },
  })
  if (nexts == 0) process.send && process.exit() 
  const evm = new Evm(bin, decoder)
  const srcmap = new SRCMap(contractJson['srcmap-runtime'] || '0:0:0:0', source, bin)
  const { endPoints, njumpis, cjumpis } = evm.start()
  process.send && process.send({ 
    contract: { name: contractName },
    sevm: { paths: endPoints.length, njumpis, cjumpis },
    duration: { sevmAt: Date.now() },
    patch : { origin: { bytecodes: rawBin.length, lines } } 
  })
  /* Dependency */
  const condition = new Condition(endPoints)
  const cache = new Cache(condition, endPoints, srcmap)
  process.send && process.send({ duration: { dependencyAt: Date.now() } })
  const scanner = new Scanner(cache, srcmap, AST)
  const uncheckOperands = scanner.scan()
  /* Bug found */
  const operators = uncheckOperands.map(({ operator }) => operator)
  const integer = !!operators.find(x => ['--', '-=', '-', '+', '++', '+=', '*', '*=', '/', '/=', '**'].includes(x))
  const reentrancy = !!operators.find(x => ['lock:function'].includes(x))
  process.send && process.send({ bug: { integer, reentrancy }})
  /* Patch */
  const bugFixes = scanner.generateBugFixes(uncheckOperands)
  process.send && process.send({ duration: { bugAt: Date.now() }})
  const guard = scanner.fix(bugFixes)
  fs.writeFileSync(fixedFile, guard, 'utf8')
  process.send && process.send({ duration: { patchAt: Date.now() }})
})
