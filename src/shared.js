const assert = require('assert')
const winston = require('winston')

const { createLogger, format, transports } = winston
const { combine, timestamp, label, printf, prettyPrint } = format

const prettify = values => {
  const format = ([type, name, ...params]) => {
    if (type == 'const') return name.toString(16) 
    if (!params.length) return name
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
/*
 * + Is const 
 * + value equal to ...
 * */
const isConst = symbol => symbol[0] == 'const'
const isSymbol = symbol => symbol[0] == 'symbol'
const isConsts = symbols => symbols.reduce((agg, symbol) => agg && isSymbol(symbol), true) 
const isConstWithValue = (symbol, value) => symbol[0] == 'const' && symbol[1].toNumber() == value


module.exports = {
  isConstWithValue,
  logger,
  prettify,
  isSymbol,
  isConsts,
  isConst,
  isConstWithValue,
}
