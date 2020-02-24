const fs = require('fs')
const path = require('path')
const assert = require('assert')
const Web3 = require('web3')
const { Evm } = require('../src/evm')
const { logger } = require('../src/shared')
const Analyzer = require('../src/analyzer')

const binFolder = path.join(__dirname, 'bin/')
const binFiles = fs.readdirSync(binFolder).sort()
const allowedContract = process.env.CONTRACT

const main = async() => {
  if (allowedContract.startsWith('0x')) {
    const web3 = new Web3('https://mainnet.infura.io/v3/6f9974d98d0941629d72a2c830f47ecd')
    const code = await web3.eth.getCode(allowedContract)
    assert(code, 'Code must exist')
    const bin = code.slice(2)
    logger.info(`binLengh: ${bin.length}`)
    const evm = new Evm(Buffer.from(bin, 'hex'))
    logger.info('>> Start evm')
    const { checkPoints, endPoints } = evm.start()
    logger.info(`>> endPoints   : ${endPoints.length}`)
    logger.info(`>> checkPoints : ${checkPoints.length}`)
  } else {
    startFrom = parseInt(allowedContract)
    for (let i = startFrom; i < binFiles.length; i++) {
      const binFile = binFiles[i]
      assert(binFile, 'binFile must exist')
      logger.info(`binFile ${binFile}`)
      const bin = fs.readFileSync(path.join(binFolder, binFile), 'utf8').slice(2)
      logger.info(`binLengh: ${bin.length}`)
      logger.info(`idx: ${i}`)
      const evm = new Evm(Buffer.from(bin, 'hex'))
      logger.info('>> Start evm')
      const { checkPoints, endPoints } = evm.start()
      logger.info(`>> endPoints   : ${endPoints.length}`)
      logger.info(`>> checkPoints : ${checkPoints.length}`)
    }
  }
}

main().then(() => {
  console.log('>> Done')
})
