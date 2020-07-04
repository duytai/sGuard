const assert = require('assert')
const { random, isEmpty } = require('lodash')
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
      reentrancy: new Reentrancy(cache, srcmap, ast),
    }
  }

  keyByLen(len) {
    return Array(len).fill(0).map(x => String.fromCharCode(random(33, 126))).join('')
  }

  findInheritance() {
    const stack = [this.ast]
    const fragments = [] 
    while (stack.length) {
      const item = stack.pop()
      const children = item.children || []
      if (item.name == 'ContractDefinition') {
        if (item.attributes.contractKind == 'contract') {
          const [s, l] = item.src.split(':').map(x => parseInt(x))
          const code = this.srcmap.source.slice(s, s + l).split('{')[0]
          const parts = code.trim().split(' ')
          let frag = {}
          if (parts[2] == 'is') {
            // multiple
            const len = parts[0].length + parts[1].length + parts[2].length + 2
            frag = {
              range: [s, s + len],
              operands: [],
              operator: 'inheritance:multiple'
            }
          } else {
            // single
            frag = {
              range: [s, s + code.length],
              operands: [],
              operator: 'inheritance:single'
            }
          }
          fragments.push(frag)
        }
      }
      children.forEach(c => stack.push(c))
    }
    return fragments
  }

  scan() {
    let operands = []
    let nvuls = Object.keys(this.vuls).length
    const bug = { nvuls: 3, cvuls: 1 }
    for (const k in this.vuls) {
      process.send && process.send({ bug })
      operands = operands.concat(this.vuls[k].scan(bug))
      bug.cvuls ++
    }
    process.send && process.send({ bug })
    if (operands.length) {
      operands = operands.concat(this.findInheritance())
    }
    return operands
  }

  fix({ bugFixes, source, wrappers }) {
    if (isEmpty(bugFixes)) return this.srcmap.source
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
    const sortedPairs = []
    while (pairs.length) {
      for (const idx in pairs) {
        const outerRange = pairs[idx].range
        let containOtherRange = false
        for (const pidx in pairs) {
          if (idx == pidx) continue
          const range = pairs[pidx].range
          if (outerRange[0] <= range[0] && range[1] <= outerRange[1]) {
            containOtherRange = true
            break
          }
        }
        if (!containOtherRange) {
          sortedPairs.push(pairs[idx])
          pairs.splice(idx, 1)
        }
      }
    }
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
          name = 'nonReentrant_'
          ops = source.slice(range[0], range[1])
          ops = ` ${ops} ${name} `
          check = ops
          break
        }
        case 'inheritance:multiple': {
          ops = source.slice(range[0], range[1])
          check = `${ops} sGuard, `
          break
        }
        case 'inheritance:single': {
          ops = source.slice(range[0], range[1])
          check = `${ops} is sGuard ` 
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
    return { bugFixes, source, wrappers }
  }
} 

module.exports = { Scanner }
