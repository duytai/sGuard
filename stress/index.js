const fs = require('fs')
const path = require('path')
const Contract = require('../src/contract')

const binFolder = path.join(__dirname, 'bin/')
const binFiles = fs.readdirSync(binFolder)
binFiles.forEach(binFile => {
  console.log(`binFile ${binFile}`)
  let bin = fs.readFileSync(path.join(binFolder, binFile), 'utf8')
  bin = Buffer.from(bin, 'hex')
  const contract = new Contract(bin)
  contract.execute()
})
