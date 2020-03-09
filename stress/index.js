const fs = require('fs')
const path = require('path')
const assert = require('assert')
const Web3 = require('web3')
const dotenv = require('dotenv')
const { Evm } = require('../src/evm')
const { logger, gb } = require('../src/shared')
const Analyzer = require('../src/analyzer')
const Vul = require('../src/vul')

const binFolder = path.join(__dirname, 'bin/')
const binFiles = fs.readdirSync(binFolder).sort()
const { parsed: { stressIgnore, stressAddress, conversion, vulnerabilities }} = dotenv.config()
assert(stressIgnore, 'update .evn file')

const main = async() => {
  if (stressAddress.startsWith('0x')) {
    const web3 = new Web3('https://mainnet.infura.io/v3/6f9974d98d0941629d72a2c830f47ecd')
    const code = await web3.eth.getCode(stressAddress)
    assert(code, 'Code must exist')
    const bin = code.slice(2)
    logger.info(`binLengh: ${bin.length}`)
    const evm = new Evm(Buffer.from(bin, 'hex'))
    logger.info('>> Start evm')
    const { checkPoints, endPoints, coverage } = evm.start()
    if (conversion) {
      endPoints.forEach(ep => {
        ep.showTrace()
      })
    } else {
      checkPoints.forEach(ep => {
        const analyzer = new Analyzer(ep, endPoints)
        const dnode = analyzer.getdnode()
        const vul = new Vul(dnode)
        const vulnames = vulnerabilities ? JSON.parse(vulnerabilities) : []
        /// Found pattern
        if (dnode.node.childs.length) {
          ep.showTrace()
          analyzer.prettify()
          vul.report(vulnames)
        }
      })
    }
    logger.info(`----------------------------------------------`)
    logger.info(`|\tCheckpoints: ${gb(checkPoints.length)}`)
    logger.info(`|\tEndpoints  : ${gb(endPoints.length)}`)
    logger.info(`|\tCoverage   : ${gb(coverage + '%')}`)
    logger.info(`----------------------------------------------`)
  } else {
    ignores = JSON.parse(stressIgnore)
    for (let i = 0; i < binFiles.length; i++) {
      const binFile = binFiles[i]
      if (ignores.includes(binFile)) continue
      assert(binFile, 'binFile must exist')
      logger.info(`binFile ${binFile}`)
      const bin = fs.readFileSync(path.join(binFolder, binFile), 'utf8').slice(2)
      logger.info(`binLengh: ${bin.length}`)
      logger.info(`idx: ${i}`)
      const evm = new Evm(Buffer.from(bin, 'hex'))
      logger.info('>> Start evm')
      const { checkPoints, endPoints, coverage } = evm.start()
      if (conversion) {
        endPoints.forEach(ep => {
          ep.showTrace()
        })
      } else {
        checkPoints.forEach(ep => {
          const analyzer = new Analyzer(ep, endPoints)
          analyzer.prettify()
        })
      }
      logger.info(`----------------------------------------------`)
      logger.info(`|\tCheckpoints: ${gb(checkPoints.length)}`)
      logger.info(`|\tEndpoints  : ${gb(endPoints.length)}`)
      logger.info(`|\tCoverage   : ${gb(coverage + '%')}`)
      logger.info(`----------------------------------------------`)
    }
  }
}

main().then(() => {
  console.log('>> Done')
})
