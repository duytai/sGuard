const assert = require('assert')
const winston = require('winston')

const { createLogger, format, transports } = winston
const { combine, timestamp, label, printf, prettyPrint } = format

const prettify = values => {
  const format = ([type, name, ...params]) => {
    if (type == 'const') return name.toString(16) 
    return `${name}(${params.map(p => format(p)).join(',')})`
  }
  values.forEach(v => console.log(format(v)))
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
  logger,
  prettify,
}
