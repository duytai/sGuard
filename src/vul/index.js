const assert = require('assert')
const { prettify, logger, gb } = require('../shared')
const { random } = require('lodash')
const Template = require('./template')
const Integer = require('./integer')
const Disorder = require('./disorder')
const Freezing = require('./freezing')
const Reentrancy = require('./reentrancy')

class Scanner {
  constructor(cache, srcmap, ast) {
    this.srcmap = srcmap
    this.template = new Template() 
    this.vuls = {
      integer: new Integer(cache, srcmap, ast),
      disorder: new Disorder(cache, srcmap, ast),
      freezing: new Freezing(cache, srcmap, ast),
      reentrancy: new Reentrancy(cache, srcmap, ast),
    }
  }

  keyByLen(len) {
    return Array(len).fill(0).map(x => random(0, 9)).join('')
  }

  scan() {
    let uncheckOperands = []
    for (const k in this.vuls) {
      uncheckOperands = [
        ...uncheckOperands,
        ...(this.vuls[k].scan() || [])
      ]
    }
    const bugFixes = this.generateBugFixes(uncheckOperands)
    this.fix(bugFixes)
  }

  fix({ bugFixes, source, wrappers }) {
    for (const _ in bugFixes) {
      for (const key in bugFixes) {
        source = source.replace(key, bugFixes[key])
      }
    }
    const check = this.template.loads([...wrappers]).join('\n\n')
    const lines = check.split('\n').map(l => `  ${l}`).join('\n')
    const safeCheck = ['contract SafeCheck {\n', lines, '\n}'].join('')
    const guard = [safeCheck, source].join('\n')
    console.log(guard)
  }

  generateBugFixes(pairs) {
    let source = this.srcmap.source
    const bugFixes = {}
    const wrappers = new Set()
    // make sure: add lock before disorder 
    pairs.sort(x => {
      console.log(x[1].operator)
      if (x[1].operator.startsWith('lock:')) return -1 
      if (x[1].operator.endsWith(':disorder')) return 1
      return 0
    })
    console.log(pairs)
    while (pairs.length) {
      for (const idx in pairs) {
        const outerRange = pairs[idx][1].range
        let containOtherRange = false 
        for (const pidx in pairs) {
          if (idx == pidx) continue
          const range = pairs[pidx][1].range
          if (outerRange[0] < range[0] && range[1] < outerRange[1]) {
            containOtherRange = true
            break
          }
        }
        if (!containOtherRange) {
          const [pc, { range, operands, operator }] = pairs[idx]
          let ops = []
          let check = ''
          let name = ''
          const pivot = operands.find(operand => {
            const isUint = operand.type.startsWith('uint')
            const isInt = operand.type.startsWith('int') 
            return isUint || isInt
          }) || {}
          const { type } = pivot
          switch (operator) {
            case '--': {
              name = `sub_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `(${ops[0]} = ${name}(${ops[0]}, 1))`
              break
            }
            case '-=': {
              name = `sub_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${ops[0]} = ${name}(${ops.join(', ')})`
              break
            }
            case '-': {
              name = `sub_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${name}(${ops.join(', ')})`
              break
            }
            case '++': {
              name = `add_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `(${ops[0]} = ${name}(${ops[0]}, 1))`
              break
            }
            case '+=': {
              name = `add_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${ops[0]} = ${name}(${ops.join(', ')})`
              break
            }
            case '+': {
              name = `add_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${name}(${ops.join(', ')})`
              break
            }
            case '*': {
              name = `mul_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${name}(${ops.join(', ')})`
              break
            }
            case '*=': {
              name = `mul_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${ops[0]} = ${name}(${ops.join(', ')})`
              break
            }
            case '/': {
              name = `div_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${name}(${ops.join(', ')})`
              break
            }
            case '/=': {
              name = `div_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${ops[0]} = ${name}(${ops.join(', ')})`
              break
            }
            case '**': {
              name = `pow_${type}`
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${name}(${ops.join(', ')})`
              break
            }
            case 'single:disorder': {
              name = `check_bool`
              ops = source.slice(range[0], range[1])
              check = `${name}(${ops})`
              break
            }
            case 'double:disorder': {
              name = `check_bool`
              let preRange = range[0]
              while (source[preRange - 1] == ' ') {
                preRange --
              }
              const distance = Array(range[0] - preRange).fill(0).map(x => ' ').join('')
              ops = source.slice(range[0], range[1])
              check = `(bool _, ) = ${ops};\n${distance}${name}(_)`
              break
            }
            case 'payable': {
              check = ''
              break
            }
            case 'msg:value': {
              check = '0'
              break
            }
            case 'lock:tuple': {
              let preRange = range[0]
              while (source[preRange - 1] == ' ') {
                preRange --
              }
              const distance = Array(range[0] - preRange).fill(0).map(x => ' ').join('')
              ops = source.slice(range[0], range[1])
              check = `locked = true;\n${distance}${ops};\n${distance}locked = false`
              break
            }
            case 'lock:function': {
              name = 'nonReentrant'
              ops = source.slice(range[0], range[1])
              ops = `${ops}${name}() `
              check = ops
              break
            }
            default: {
              assert(false, `Unknown operator: ${operator}`)
            }
          }
          const first = source.slice(0, range[0])
          const middle = source.slice(range[0], range[1])
          const last = source.slice(range[1])
          const key = this.keyByLen(middle.length)
          source = [first, key, last].join('')
          bugFixes[key] = check
          pairs.splice(idx, 1)
          name && wrappers.add(name)
        }
      }
    }
    return { bugFixes, source, wrappers }
  }
} 

module.exports = { Scanner }
