const winston = require('winston')

const { createLogger, format, transports } = winston
const { combine, timestamp, label, printf, prettyPrint } = format

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
}
