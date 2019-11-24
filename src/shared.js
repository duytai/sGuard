const winston = require('winston')

const { createLogger, format, transports } = winston
const { combine, timestamp, label, printf, prettyPrint } = format

/* 
 * Split code into multiple code blocks
 * */
function splitIntoBlocks(code) {
  const { blocks } = code.reduce(({ tag, blocks }, { name, value }) => {
    if (name == 'tag') return { tag: value, blocks }
    !blocks[tag] && (blocks[tag] = [])
    if (value) {
      blocks[tag].push({
        name,
        value,
      })
    } else {
      blocks[tag].push({ name })
    }
    return { tag, blocks }
  }, { tag: '0', blocks: {} })
  return blocks
}
/*
 * Convert hex string to int
 * */
function hexToInt(v) {
  if (Buffer.isBuffer(v)) return hexToInt(v.toString('hex'))
  if (v.length % 2 != 0) v = `0${v}`
  if (v.startsWith('0x')) return parseInt(v)
  return parseInt(`0x${v}`)
} 
/*
 * Initialize logger 
 * */
const logger = createLogger({
  format: combine(
    format.colorize(),
    label({ label: 'symEvm' }),
    timestamp(),
    printf(({ level, message, timestamp, label }) => {
      return `${timestamp} [${label}] ${level}: ${message}`
    }),
  ),
  transports: [
    new (winston.transports.Console)({ level: 'debug' }),
  ]
})

module.exports = {
  splitIntoBlocks,
  hexToInt,
  logger,
}
