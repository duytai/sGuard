const assert = require('assert')
const getLineFromPos = require('get-line-from-pos')

class SRCMap {
  constructor(srcmap, source, bin) {
    assert(source && srcmap && bin)
    this.source = source
    this.srcmap = this.decompress(srcmap)
    this.pcInst = this.pcToInst(bin)
  }

  toSL(pc) {
    const inst = this.pcInst[pc]
    if (!inst) return { txt: '', line: -1 }
    return this.srcmap[inst]
  }

  toSrc(pc) {
    const inst = this.pcInst[pc]
    if (!inst) return { txt: '', line: -1 }
    const { s, l } = this.srcmap[inst]
    return {
      txt: this.source.slice(s, s + l),
      line: getLineFromPos(this.source, s),
    }
  }

  pcToInst(bin) {
    let pc = 0
    let inst = 0
    const ret = {}
    while (pc < bin.length) {
      const opcode = bin[pc]
      ret[pc] = inst
      if (opcode >= 0x60 && opcode <= 0x7f) {
        pc += opcode - 0x5f
      }
      pc += 1
      inst += 1
    }
    return ret  
  }

  decompress(srcmap) {
    return srcmap
      .split(';')
      .reduce((result, slfj) => {
        const [s, l, f, j] = slfj.split(':')
        const [last] = result.slice(-1)
        return result.concat({
          s: s ? parseInt(s, 10) : last.s,
          l: l ? parseInt(l, 10) : last.l,
          f: f ? parseInt(f, 10) : last.f,
          j: j || last.j,
        })
      }, [])
  }
}

module.exports = SRCMap
