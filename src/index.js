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

const config = process.argv[2]
const { contractFile, fixedFile, jsonFile } = JSON.parse(config)
console.log(contractFile)
console.error(contractFile)
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
  process.send({
    contract: { name },
    duration: { runAt: Date.now() },
  })
  if (nexts == 0) process.exit() 
  const evm = new Evm(bin, decoder)
  const srcmap = new SRCMap(contractJson['srcmap-runtime'] || '0:0:0:0', source, bin)
  const { endPoints, njumpis, cjumpis, mvb } = evm.start()
  process.send({ 
    contract: { name: contractName },
    sevm: { paths: endPoints.length, njumpis, cjumpis, loopbound: mvb },
    duration: { sevmAt: Date.now() },
    patch : { origin: { bytecodes: rawBin.length, lines } } 
  })
  /* Dependency */
  const condition = new Condition(endPoints)
  const cache = new Cache(condition, endPoints, srcmap)
  process.send({ duration: { dependencyAt: Date.now() } })
  const scanner = new Scanner(cache, srcmap, AST)
  const uncheckOperands = scanner.scan()
  /* Bug found */
  const operators = uncheckOperands.map(op => op[1].operator)
  const integer = !!operators.find(x => ['--', '-=', '-', '+', '++', '+=', '*', '*=', '/', '/=', '**'].includes(x))
  const exception = !!operators.find(x => ['single:disorder', 'double:disorder'].includes(x))
  const freezing = !!operators.find(x => ['payable', 'msg:value'].includes(x))
  const reentrancy = !!operators.find(x => ['lock:tuple', 'lock:nontuple', 'lock:function'].includes(x))
  const block = !!operators.find(x => ['timestamp', 'number'].includes(x))
  const delegate = !!operators.find(x => ['delegate'].includes(x))
  process.send({ bug: { integer, exception, freezing, reentrancy, block, delegate }})
  /* Patch */
  const bugFixes = scanner.generateBugFixes(uncheckOperands)
  process.send({ duration: { bugAt: Date.now() }})
  const guard = scanner.fix(bugFixes)
  fs.writeFileSync(fixedFile, guard, 'utf8')
  process.send({ duration: { patchAt: Date.now() }})
})
