const RegisterAnalyzer = require('./register')

class Analyzer {
  constructor(data, endPoints) {
    this.register = new RegisterAnalyzer(data, endPoints)
  }

  prettify() {
    this.register.prettify()
  }

  getdnode() {
    return this.register.dnode
  }
}

module.exports = Analyzer
