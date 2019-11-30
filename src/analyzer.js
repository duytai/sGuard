const { prettify } = require('./shared')

const analyze = (value, traces) => {
  prettify([value])
  console.log('----')
  prettify(traces)
}

module.exports = {
  analyze,
} 
