const assert = require('assert')
const { toPairs, sortBy } = require('lodash')
const { prettify, logger, gb } = require('../shared')
const Subtract = require('./subtract')
const Addition = require('./addition')

class Scanner {
  constructor(cache, srcmap, ast) {
    this.srcmap = srcmap
    this.vuls = {
      subtract: new Subtract(cache, srcmap, ast),
      addition: new Addition(cache, srcmap, ast),
    }
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

  generateBugFixes(uncheckOperands) {
    const bugFixes = []
    const pairs = sortBy(uncheckOperands, [
      (x) => x[1].range[0],
      (y) => - y[1].range[1],
    ])
    for (const idx in pairs) {
      const [pc, { range, operands, type }] = pairs[idx]
      switch (type) {
        case 'ADD':
        case 'SUB': {
          const [from, to] = range
          const func = type.toLowerCase()
          const check = `${func}(${operands.map(x => x.id).join(', ')})`
          const diff = check.length - (to - from)
          const [left, right] = operands 
          for (let next = parseInt(idx) + 1; next < pairs.length; next ++) {
            const nextRange = pairs[next][1].range
            let isModified = false 
            // Left operand
            if (nextRange[0] >= left.range[0] && nextRange[1] <= left.range[1] && !isModified) {
              nextRange[0] += 4 
              nextRange[1] += 4 
              isModified = true
            }
            // Right operand
            if (nextRange[0] >= right.range[0] && nextRange[1] <= right.range[1] && !isModified) {
              nextRange[0] += 2 - (right.range[0] - left.range[1]) + 4
              nextRange[1] += 2 - (right.range[0] - left.range[1]) + 4
              isModified = true
            }
            // After both operands
            if (nextRange[0] >= to && !isModified) {
              nextRange[0] += diff
              nextRange[1] += diff
              isModified = true
            }
          }
          bugFixes.push({ from, to, check })
          break
        }
      }
    }
    return bugFixes
  }


  fix(bugFixes) {
    let source = this.srcmap.source
    console.log(source)
    for (const idx in bugFixes) {
      const { from, to, check } = bugFixes[idx]
      const first = source.slice(0, from)
      const second = source.slice(to)
      source = [first, check, second].join('')
    }
    console.log('----')
    console.log(source)
  }

} 

module.exports = { Scanner }
