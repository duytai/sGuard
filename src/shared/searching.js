const assert = require('assert')
const { uniqBy, lastIndexOf } = require('lodash')
const ethutil = require('ethereumjs-util')
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

const firstMeet = (dnode, cond) => {
  assert(dnode && cond)
  if (cond(dnode)) return [dnode]
  return dnode.node
    .childs
    .reduce((all, next) => [...all, ...firstMeet(next, cond)], [])
}

const findOperands = (pc, srcmap, ast) => {
  const { s, l } = srcmap.toSL(pc)
  const key = [s, l, 0].join(':')
  const response = jp.query(ast, `$..children[?(@.src=="${key}")]`)
  if (!response.length) return { operator: null }
  const { children, name, attributes } = response[response.length - 1]
  const { operator } = attributes
  const validOperators = ['--', '-=', '-', '++', '+=', '+', '*', '*=', '/', '/=', '**']
  if (!validOperators.includes(operator)) return { operator: null }
  const ret = { range: [s, s + l], operands: [], operator }
  if (!children) return { operator: null }
  if (children.length > 2) return { operator: null }
  children.forEach(({ src, attributes }) => {
    const { type } = attributes 
    const [s, l] = src.split(':').map(x => parseInt(x))
    const id = srcmap.source.slice(s, s + l)
    ret.operands.push({ id, type, range: [s, s + l]})
  })
  return ret
}

const findMsgValues = (srcmap, ast) => {
  const selector = `$..children[?(@.name=="MemberAccess" && @.attributes.member_name=="value")]`
  const response = jp.query(ast, selector)
  const ret = []
  for (const idx in response) {
    const ma = response[idx]
    const maSrc = ma.src.split(':').map(x => parseInt(x))
    const snippet = srcmap.source.slice(maSrc[0], maSrc[0] + maSrc[1])
    if (snippet == 'msg.value') {
      ret.push({
        range: [maSrc[0], maSrc[0] + maSrc[1]],
        operands: [],
        operator: 'msg:value',
      })
    }
  }
  return ret
}

const findPayables = (srcmap, ast) => {
  const selector = `$..children[?(@.name=="FunctionDefinition" && @.attributes.stateMutability=="payable")]`
  const response = jp.query(ast, selector)
  const ret = []
  for (const idx in response) {
    const func = response[idx]
    assert(func.name == 'FunctionDefinition')
    const block = func.children[func.children.length - 1]
    assert(block.name == 'Block')
    const blockSrc = block.src.split(':').map(x => parseInt(x))
    const source = srcmap.source.slice(0, blockSrc[0])
    const s = source.lastIndexOf('payable')
    assert(s != -1)
    ret.push({
      range: [s, s + 'payable'.length],
      operands: [],
      operator: 'payable'
    })
  }
  return ret
}

const findFunctions = (srcmap, ast, selectors) => {
  const ret = []
  for (const idx in selectors) {
    const selector = selectors[idx]
    const responses = jp.query(ast, `$..children[?(@.attributes.functionSelector=="${selector}")]`)
    if (!responses.length) continue
    const [response] = responses
    const { src, children, attributes: { name } } = response
    const block = children[children.length - 1]
    assert(block.name == 'Block')
    let [s, l] = src.split(':').map(x => parseInt(x))
    const [blockS, blockL] = block.src.split(':').map(x => parseInt(x))
    l = blockS - s
    const elems = srcmap.source.slice(s, s + l).split('returns(')
    l = l - (elems[1] ? elems[1].length + 'returns('.length : 0)
    ret.push({ range: [s, s + l], operands: [], operator: 'lock:function' })
  }
  return ret
} 

const findReturnType = (pc, srcmap, ast) => {
  const { s, l } = srcmap.toSL(pc)
  const key = [s, l, 0].join(':')
  const response = jp.query(ast, `$..children[?(@.src=="${key}")]`)
  if (!response.length) return null
  const { children, name, attributes: { type } } = response[response.length - 1]
  return type
}

const findInheritance = (srcmap, ast)  => {
  const ret = []
  const responses = jp.query(ast, `$..children[?(@.attributes.contractKind=="contract")]`)
  responses.forEach(({ src, attributes }) => {
    const [s] = src.split(':').map(x => parseInt(x))
    if (attributes.linearizedBaseContracts.length > 1) {
      let l = 3
      while (srcmap.source.slice(s + l - 3, s + l) != ' is') l++
      ret.push({ range: [s, s + l], operands: [], operator: 'inheritance:multiple' })
    } else {
      let l = 0
      while (srcmap.source[s + l + 1] != '{') l++
      ret.push({ range: [s, s + l], operands: [], operator: 'inheritance:single' })
    }
  })
  return ret
}

const addFunctionSelector = (ast) => {
  const responses = jp.query(ast, `$..children[?(@.name=="FunctionDefinition")]`)
  responses.forEach(({ children, attributes }) => {
    const { name: functionName } = attributes
    const params = children.find(({ name }) => name == 'ParameterList')
    assert(params)
    const d = params.children.map(c => c.attributes.type)
    const functionSignature = `${functionName}(${d.join(',')})`
    const functionSelector = functionName
      ? ethutil.keccak(functionSignature).toString('hex').slice(0, 8)
      : 'fallback'
    attributes.functionSelector = functionSelector
  })
}

module.exports = {
  findSymbol,
  findSymbols,
  findOperands,
  findPayables,
  findMsgValues,
  firstMeet,
  findFunctions,
  findReturnType,
  findInheritance,
  addFunctionSelector,
}

