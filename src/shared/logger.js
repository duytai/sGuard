const winston = require('winston')

const { createLogger, format, transports } = winston
const { combine, timestamp, label, printf, prettyPrint } = format
const logger = createLogger({
  format: combine(
    format.colorize(),
    label({ label: 'symEvm' }),
    timestamp(),
    printf(({ level, message, label }) => {
      return `[${label}] ${level}: ${message}`
    }),
  ),
  transports: [
    new (winston.transports.Console)({ level: 'debug' }),
    // new winston.transports.File({ filename: 'logs/combined.log', level: 'debug' })
  ]
})

module.exports = logger
