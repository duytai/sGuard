const { union } = require('lodash')
const assert = require('assert')
const chalk = require('chalk')
const Block = require('./block')
const Int = require('./int')
const Freezing = require('./freezing')
const Gasless = require('./gasless')
const Delegate = require('./delegate')
const Reentrancy = require('./reentrancy')
const Disorder = require('./disorder')
const { logger, formatSymbol } = require('../shared')

class Vul {
  constructor(endPoints) {
    assert(endPoints)
    this.endPoints = endPoints
    this.oracles = {
      number: Block,
      integer: Int, 
      freezing: Freezing,
      gasless: Gasless,
      delegate: Delegate,
      reentrancy: Reentrancy,
      disorder: Disorder,
    }
  }

  report(names, srcmap) {
    const supports = Object.keys(this.oracles)
    assert(union(supports, names).length == supports.length)
    const founds = names
      .map(name => new this.oracles[name](this.endPoints))
      .map((o, idx) => ({ name: names[idx], dnodes: o.startFinding() }))
    const c = chalk.green.bold
    const d = chalk.dim.italic
    if (founds.length) {
      logger.info('----------------------------------------------')
      founds.forEach(({ name, dnodes }) => {
        logger.info(`|\tBug: ${c(name)}, Found ${c(dnodes.length)}`)
        dnodes.forEach(dnode => {
          const { me, childs, alias, pc } = dnode.node
          logger.info(`|\t  ${formatSymbol(me)} ${c(alias)}`)
          if (srcmap) {
            const { txt, line } = srcmap.toSrc(pc)
            const firstLine = txt.split("\n")[0]
            if (firstLine) {
              logger.info(`|\t  ${d(`${line}:${pc}:${firstLine}`)}`)
            }
          }
        })
      })
      logger.info('----------------------------------------------')
    } else {
      logger.info(`Your smart contract is secure`)
    }
  }
}

module.exports = Vul
