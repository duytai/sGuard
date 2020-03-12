const assert = require('assert')
const { uniqBy } = require('lodash')
const { formatSymbol } = require('../shared')
const Oracle = require('./oracle')
const Analyzer = require('../analyzer')
const Condition = require('../analyzer/condition')
const Register = require('../analyzer/register')

class Disorder extends Oracle {
  startFinding() {
    const foundCalls = uniqBy(this.dictionary.findBuilds(['EP/CALL']),({ node: { id }}) => id)
    const calls = foundCalls.map(({ node: { me } }) => formatSymbol(me))
    const dnodes = this.dictionary.findBuilds(['EP/LAST'])
    const usedCalls = this.dictionary.treeSearch(dnodes,
      (me) => calls.find(call => formatSymbol(me).includes(call))
    ).map(({ node: { me }}) => formatSymbol(me))

    return foundCalls.filter(dnode => {
      const call = formatSymbol(dnode.node.me)
      return !usedCalls.find(usedCall => usedCall.includes(call))
    })
  }
}

module.exports = Disorder
