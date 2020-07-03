const assert = require('assert')
const { findInheritance } = require('../shared')
const { random, uniqBy, sortBy, toPairs } = require('lodash')
const Template = require('./template')
const Integer = require('./integer')
const Reentrancy = require('./reentrancy')

class Scanner {
  constructor(cache, srcmap, ast) {
    this.srcmap = srcmap
    this.template = new Template() 
    this.ast = ast
    this.vuls = {
      integer: new Integer(cache, srcmap, ast),
      // reentrancy: new Reentrancy(cache, srcmap, ast),
    }
  }

  keyByLen(len) {
    return Array(len).fill(0).map(x => String.fromCharCode(random(33, 126))).join('')
  }

  scan() {
    let uncheckOperands = []
    let nvuls = Object.keys(this.vuls).length
    const bug = { nvuls: 6, cvuls: 0 }
    process.send && process.send({ bug })
    for (const k in this.vuls) {
      uncheckOperands = [
        ...uncheckOperands,
        ...(this.vuls[k].scan(bug) || [])
      ]
    }
    uncheckOperands = [
      ...uncheckOperands,
      // ...toPairs(findInheritance(this.srcmap, this.ast)),
    ]
    return uncheckOperands
  }

  fix({ bugFixes, source, wrappers }) {
    let noFix = true
    for (const _ in bugFixes) {
      for (const key in bugFixes) {
        noFix = noFix && ((key == '' && bugFixes[key] == '') || bugFixes[key].startsWith('contract'))
        source = source.replace(key, bugFixes[key])
      }
    }
    if (noFix) return this.srcmap.source
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
    const ranges = uniqBy(pairs.map(({ range })=> range), x => x.join(':'))
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
      let sortedPairs = pairs.filter(x => x.range.join(':') == range.join(':'))
      sortedPairs.forEach(pair => {
        const { range, operands, operator, resultType } = pair
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
