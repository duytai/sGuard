const fs = require('fs')
const path = require('path')
const Contract = require('../src/contract')

const binFolder = path.join(__dirname, 'bin/')
const binFiles = fs.readdirSync(binFolder).sort()
const allowedContract = 1
binFiles.forEach((binFile, idx) => {
  if (idx != allowedContract) return
  console.log(`binFile ${binFile}`)
  const bin = fs.readFileSync(path.join(binFolder, binFile), 'utf8')
  console.log(`binLengh: ${bin.length}`)
  const contract = new Contract(Buffer.from(bin, 'hex'))
  contract.execute()
})
