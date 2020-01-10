const Dep = require('./dep')

class TimeDep extends Dep {
  constructor(analyzer) {
    super(analyzer)
    this.name = 'TIME_DEP'
  }
}

module.exports = TimeDep
