const rp = require('request-promise')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

const toPageURL = ({ page, count }) => {
  return `https://contract-library.com/api/contracts?n=Ethereum&q=&s=ether&o=desc&p=${page}&c=${count}&w=`
}

const toContractURL = (address) => {
  return `https://contract-library.com/api/contracts/Ethereum/${address}`
}

const main = async () => {
  const bin = path.join(__dirname, 'bin/')
  const jsonString = await rp(toPageURL({ page: 1, count: 1 }))
  const json = JSON.parse(jsonString)
  for (let i = 0; i < json.contracts.length; i++) {
    const { address } = json.contracts[i]
    const binPath = path.join(bin, address)
    if (!fs.existsSync(binPath)) {
      console.log(chalk.green(address))
      const jsonString = await rp(toContractURL(address))
      const { bytecode } = JSON.parse(jsonString)
      fs.writeFileSync(binPath, bytecode)
    }
  }
}

main().then(() => {
  console.log('>> Done')
})


