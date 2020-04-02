const assert = require('assert')
const { uniqBy } = require('lodash')
const { prettify, formatSymbol } = require('./prettify')
const BN = require('bn.js')
const jp = require('jsonpath')

const findSymbol = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (cond(symbol)) return [symbol]
  return params.reduce(
    (agg, symbol) => [...agg, ...findSymbol(symbol, cond)],
    [],
  )
}

const findSymbols = (symbol, cond) => {
  const [type, name, ...params] = symbol
  if (type == 'const') return []
  return params.reduce(
    (agg, symbol) => [...agg, ...findSymbols(symbol, cond)],
    cond(symbol) ? [symbol] : [],
  )
}

const findInsertLoc = (source, s) => {
  assert(source && s >= 0)
  const seps = [';', '{', '}']
  while (!seps.includes(source[s])) s -= 1
  const config = {
    newline: true,
    start: s,
    spaces: 0,
    tabs: 0,
  }
  for (; config.start < source.length - 1; config.start ++) {
    const c = source[config.start + 1]
    if (c == '\n') {
      config.newline = true
      config.tabs = 0
      config.spaces = 0
    } else if (c == '\t') {
      config.tabs ++
    } else if (c == ' ') {
      config.spaces ++
    } else {
      break
    }
  }
  if (config.newline) {
    config.start = config.start - config.tabs - config.spaces
  }
  return config
}

const insertLoc = (srcmap, ast, pc) => {
  assert(srcmap && ast && pc >= 0)
  const { s, l } = srcmap.toSL(pc)
  const forStatements = jp.query(ast, `$..children[?(@.name=="ForStatement")]`)
  const ret = []
  forStatements.forEach(({ children, src }) => {
    const [forS, forL] = src.split(':').map(x => parseInt(x))
    if (s >= forS && s + l <= forS + forL) {
      if (children.length > 0 && children[0].name != 'Block') {
        const { name, src } = children[0]
        const [varDeclareS, varDeclareL] = src.split(':').map(x => parseInt(x))
        if (s >= varDeclareS && s + l <= varDeclareS + varDeclareL) {
          /// Before ForLoop
          const r = findInsertLoc(srcmap.source, forS)
          ret.push(r)
        } else {
          /// The end of ForLoop
          const block = children.find(({ name }) => name == 'Block')
          if (block) {
            const { src } = block
            const [blockS, blockL] = src.split(':').map(x => parseInt(x))
            const r = findInsertLoc(srcmap.source, blockS + blockL - 2)
            ret.push(r)
          }
        }
      }
    }
  })
  assert(ret.length == 1)
  return ret[0]
}

const extractOperands = (pc, srcmap, ast) => {
  const { s, l } = srcmap.toSL(pc)
  const key = [s, l, 0].join(':')
  const response = jp.query(ast, `$..children[?(@.src=="${key}")]`) 
  assert(response.length >= 1)
  const { children } = response[response.length - 1]
  const operands = []
  children.forEach(({ src }) => {
    const [s, l] = src.split(':').map(x => parseInt(x))
    const operand = srcmap.source.slice(s, s + l)
    operands.push(operand)
  })
  return operands
}


module.exports = {
  findSymbol,
  findSymbols,
  insertLoc,
  extractOperands,
}

