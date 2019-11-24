class Program {
  constructor(state) {
    this.state = state
  }

  execute() {
    // const { blocks, context } = this.state
    // console.log(blocks[context.bid])
    // while (context.pc < blocks[context.bid].length) {
      // const instruction = blocks[context.bid][context.pc]
      // const [name, tag] = instruction.name.split(' ')
      // const [_, opcode, offset = 0]= /([^0-9]+)([0-9]*)/.exec(name)
      // evm[opcode](this.state, instruction.value, !!tag)
      // context.pc ++
      // if (context.pc > 6) {
        // logger.debug(`----------Lastest Stack----------`)
        // console.log(this.state.stack)
        // console.log(this.state.memory)
        // break
      // }
    // }
  }
}

module.exports = Program 
