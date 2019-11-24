class Contract {
  constructor(state) {
    this.state = state
  }

  execute() {
    const { blocks, context } = this.state
    console.log(blocks[context.bid])
  }
}

module.exports = Contract 
