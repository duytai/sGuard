const fs = require('fs')
const { toPairs } = require('lodash')
const path = require('path')
const mustache = require('mustache')

class Template {
  constructor() {
    const file = path.join(__dirname, './safecheck.txt') 
    this.safecheck = fs.readFileSync(file, 'utf8')
  }

  loads(wrappers) {
    const ret = []
    for (const idx in wrappers) {
      const wrapper = wrappers[idx]
      const [name, type = ''] = wrapper.split('_')
      const isUint = type.startsWith('uint')
      const isInt = type.startsWith('int')
      const view = {
        [name]: true,
        type,
        isUint,
        isInt,
      }
      const output = mustache.render(this.safecheck, view).trim()
      output && ret.push(output)
    }
    return ret
  }
}

module.exports = Template
