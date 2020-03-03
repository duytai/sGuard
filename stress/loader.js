const rp = require('request-promise')
const cheerio = require('cheerio')
const Web3 = require('web3')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const { parsed : { etherscanFrom, etherscanTo } } = dotenv.config() 
const from = parseInt(etherscanFrom)
const to = parseInt(etherscanTo)

const main = async() => {
  const web3 = new Web3('https://mainnet.infura.io/v3/6f9974d98d0941629d72a2c830f47ecd')
  const binFolder = path.join(__dirname, 'bin')
  if (!fs.existsSync(binFolder)) fs.mkdirSync(binFolder)
  let counter = 1; 
  for (let i = from; i < to; i ++) {
    const pageURL = `https://etherscan.io/contractsVerified/${i + 1}`
    const htmlString = await rp.get(pageURL)
    const $ = cheerio.load(htmlString)
    const links = $('.hash-tag')
    for (let j = 0; j < links.length; j++) {
      const address = links.eq(j).text()
      const code = await web3.eth.getCode(address)
      const saveTo = path.join(__dirname, 'bin', address)
      fs.writeFileSync(saveTo, code, 'utf8')
      console.log(`${counter}\t${address}`)
      counter ++
    }
  }
}

main().then(() => {
  console.log('>> DONE')
})
