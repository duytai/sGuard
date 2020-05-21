const assert = require('assert')
const { prettify, logger, gb, findInheritance } = require('../shared')
const { random, uniqBy, sortBy, toPairs } = require('lodash')
const Template = require('./template')
const Integer = require('./integer')
const Disorder = require('./disorder')
const Freezing = require('./freezing')
const Reentrancy = require('./reentrancy')

class Scanner {
  constructor(cache, srcmap, ast) {
    this.srcmap = srcmap
    this.template = new Template() 
    this.ast = ast
    this.vuls = {
      integer: new Integer(cache, srcmap, ast),
      disorder: new Disorder(cache, srcmap, ast),
      freezing: new Freezing(cache, srcmap, ast),
      reentrancy: new Reentrancy(cache, srcmap, ast),
    }
  }

  keyByLen(len) {
    return Array(len).fill(0).map(x => String.fromCharCode(random(33, 126))).join('')
  }

  scan() {
    let uncheckOperands = []
    for (const k in this.vuls) {
      uncheckOperands = [
        ...uncheckOperands,
        ...(this.vuls[k].scan() || [])
      ]
    }
    uncheckOperands = [
      ...uncheckOperands,
      ...toPairs(findInheritance(this.srcmap, this.ast)),
    ]
    return uncheckOperands
  }

  fix({ bugFixes, source, wrappers }) {
    for (const _ in bugFixes) {
      for (const key in bugFixes) {
        source = source.replace(key, bugFixes[key])
      }
    }
    const check = this.template.loads([...wrappers]).join('\n\n')
    const lines = check.split('\n').map(l => `  ${l}`).join('\n')
    const safeCheck = ['contract sGuard{\n', lines, '\n}'].join('')
    const guard = [safeCheck, source].join('\n')
    return guard
  }

  generateBugFixes(pairs) {
    let source = this.srcmap.source
    const bugFixes = {}
    const wrappers = new Set()
    const ranges = uniqBy(pairs.map(pair => pair[1].range), x => x.join(':'))
    const sortedRanges = []
    while (ranges.length) {
      for (const idx in ranges) {
        const outerRange = ranges[idx]
        let containOtherRange = false
        for (const pidx in ranges) {
          if (idx == pidx) continue
          const range = ranges[pidx]
          if (outerRange[0] <= range[0] && range[1] <= outerRange[1]) {
            containOtherRange = true
            break
          }
        }
        if (!containOtherRange) {
          sortedRanges.push(outerRange)
          ranges.splice(idx, 1)
        }
      }
    }
    sortedRanges.forEach(range => {
      let sortedPairs = pairs.filter(x => x[1].range.join(':') == range.join(':'))
      sortedPairs = sortBy(sortedPairs, x => {
        if (x[1].operator.startsWith('lock:')) return 2
        if (x[1].operator.endsWith(':disorder')) return 1
        return 0
      })
      sortedPairs.forEach(pair => {
        const [pc, { range, operands, operator, resultType }] = pair
        let ops = []
        let check = ''
        let name = ''
        const pivot = operands.find(operand => {
          const len = operand.type.split(' ').length
          const isUint = operand.type.startsWith('uint')
          const isInt = operand.type.startsWith('int')
          return len == 1 && (isUint || isInt)
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
            ops = `${ops} ${name}() `
            check = ops
            break
          }
          case 'inheritance:multiple': {
            ops = source.slice(range[0], range[1])
            check = `${ops} sGuard,`
            break
          }
          case 'inheritance:single': {
            ops = source.slice(range[0], range[1])
            check = `${ops} is sGuard` 
            break
          }
          case 'number':
          case 'timestamp':
          case 'delegate': {
            // Do nothing
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
        name && wrappers.add(name)
      })
    })
    return { bugFixes, source, wrappers }
  }
} 

module.exports = { Scanner }
