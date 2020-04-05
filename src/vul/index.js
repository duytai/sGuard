const assert = require('assert')
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
    const bugFixes = []
    for (const idx in uncheckOperands) {
      const [pc, { range, operands, type }] = uncheckOperands[idx]
      const func = type.toLowerCase()
      const check = { id: func, range , operands }
      console.log(check)
    }
  }

  // generateBugFixes(pairs) {
    // const bugFixes = []
    // const bugStack = pairs
    // while (bugStack.length) {
      // const [pc, { range, operands, type }] = bugStack.pop()
      // const [from, to] = range
      // const func = type.toLowerCase()
      // const check = `${func}(${operands.map(x => x.id).join(', ')})`
    // }
    // for (const idx in pairs) {
      // const [pc, { range, operands, type }] = pairs[idx]
      // switch (type) {
        // case 'ADD':
        // case 'SUB': {
          // const [from, to] = range
          // const func = type.toLowerCase()
          // const check = `${func}(${operands.map(x => x.id).join(', ')})`
          // const diff = check.length - (to - from)
          // const [left, right] = operands
          // console.log(`check: ${check}`)
          // console.log(`diff: ${diff}`)
          // for (let next = 0; next < pairs.length; next ++) {
            // const { range: nextRange } = pairs[next][1]
            // if (nextRange[1] <= from) continue
            // if (nextRange[0] >= to) {
              // nextRange[0] += diff
              // nextRange[1] += diff
              // continue
            // }
          // }
          // bugFixes.push({ from, to, check })
          // break
        // }
      // }
    // }
    // return bugFixes
  // }


  // fix(bugFixes) {
    // let source = this.srcmap.source
    // console.log(source)
    // for (const idx in bugFixes) {
      // const { from, to, check } = bugFixes[idx]
      // const first = source.slice(0, from)
      // const second = source.slice(to)
      // source = [first, check, second].join('')
    // }
    // console.log('----')
    // console.log(source)
  // }

} 

module.exports = { Scanner }
