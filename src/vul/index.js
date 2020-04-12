const assert = require('assert')
const { prettify, logger, gb } = require('../shared')
const { random } = require('lodash')
const Integer = require('./integer')
const Disorder = require('./disorder')

class Scanner {
  constructor(cache, srcmap, ast) {
    this.srcmap = srcmap
    this.vuls = {
      integer: new Integer(cache, srcmap, ast),
      disorder: new Disorder(cache, srcmap, ast),
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

  fix({ bugFixes, source }) {
    for (const _ in bugFixes) {
      for (const key in bugFixes) {
        source = source.replace(key, bugFixes[key])
      }
    }
    console.log('--------')
    console.log(this.srcmap.source)
    console.log('++++++++')
    console.log(source)
  }

  generateBugFixes(pairs) {
    let source = this.srcmap.source
    const bugFixes = {}
    while (pairs.length) {
      for (const idx in pairs) {
        const outerRange = pairs[idx][1].range
        let containOtherRange = false 
        for (const pidx in pairs) {
          if (idx == pidx) continue
          const range = pairs[pidx][1].range
          if (outerRange[0] <= range[0] && range[1] <= outerRange[1]) {
            containOtherRange = true
            break
          }
        }
        if (!containOtherRange) {
          const [pc, { range, operands, operator }] = pairs[idx]
          let ops = []
          let check = ''
          switch (operator) {
            case '--': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `(${ops[0]} = sub(${ops[0]}, 1))`
              break
            }
            case '-=': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${ops[0]} = sub(${ops.join(', ')})`
              break
            }
            case '-': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `sub(${ops.join(', ')})`
              break
            }
            case '++': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `(${ops[0]} = add(${ops[0]}, 1))`
              break
            }
            case '+=': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${ops[0]} = add(${ops.join(', ')})`
              break
            }
            case '+': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `add(${ops.join(', ')})`
              break
            }
            case '*': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `mul(${ops.join(', ')})`
              break
            }
            case '*=': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${ops[0]} = mul(${ops.join(', ')})`
              break
            }
            case '/': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `div(${ops.join(', ')})`
              break
            }
            case '/=': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `${ops[0]} = div(${ops.join(', ')})`
              break
            }
            case '**': {
              ops = operands.map(({ range }) => source.slice(range[0], range[1])) 
              check = `pow(${ops.join(', ')})`
              break
            }
            case 'single:disorder': {
              ops = source.slice(range[0], range[1])
              check = `check(${ops})`
              break
            }
            case 'double:disorder': {
              ops = source.slice(range[0], range[1])
              check = `check(${ops})`
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
        }
      }
    }
    return { bugFixes, source }
  }
} 

module.exports = { Scanner }
