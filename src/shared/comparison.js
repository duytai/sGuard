const isConst = symbol => symbol[0] == 'const'
const isSymbol = symbol => symbol[0] == 'symbol'
const isConsts = symbols => symbols.reduce((agg, symbol) => agg && isSymbol(symbol), true) 
const isConstWithValue = (symbol, value) => symbol[0] == 'const' && symbol[1].toNumber() == value

const isOpcode = (t, opcodeName) => t[1] == opcodeName 

const isVariable = (t) => {
  if (isConst(t)) return false
  const [type, name, loc] = t
  if (name == 'SSTORE') return true
  if (name == 'MSTORE') return (isConst(loc) && loc[1].toNumber() >= 0x80) || !isConst(loc)
  return false
}

const isStateVariable = (t) => {
  if (!isVariable(t)) return false
  return t[1] == 'SSTORE'
} 

const isLocalVariable = (t) => {
  if (!isVariable(t)) return false
  return t[1] == 'MSTORE'
} 

const isMload40 = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MLOAD') return false
  return isConstWithValue(t[2], 0x40)
}

const isMstore40 = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MSTORE') return false
  return isConstWithValue(t[2], 0x40)
}

const isMload0 = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MLOAD') return false
  return isConstWithValue(t[2], 0x00)
}

const isMloadConst = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MLOAD') return false
  return isConst(t[2])
}

const isMstoreConst = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MSTORE') return false
  return isConst(t[2])
}

const isMstore0 = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MSTORE') return false
  return isConstWithValue(t[2], 0x00)
}

const isMstore20 = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MSTORE') return false
  return isConstWithValue(t[2], 0x20)
}

const isSha3Mload0 = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'SHA3') return false
  return isMload0(t[2])
}

const isSha3Mload = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'SHA3') return false
  return isOpcode(t[2], 'MLOAD')
}

const isSstoreConst = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'SSTORE') return false
  const [type, name, loc] = t
  return isConst(loc)
}

const isMstoreGte80 = (t) => {
  if (t[0] == 'const') return false
  if (t[1] != 'MSTORE') return false
  const [type, name, loc] = t
  if (!isConst(loc)) return false
  return loc[1].toNumber() >= 0x80
}

module.exports = {
  isConst,
  isSymbol,
  isConsts,
  isConstWithValue,
  isVariable,
  isStateVariable,
  isLocalVariable,
  isMload40,
  isMload0,
  isMloadConst,
  isMstoreConst,
  isMstore40,
  isMstore20,
  isMstore0,
  isSha3Mload0,
  isSha3Mload,
  isOpcode,
  isSstoreConst,
  isMstoreGte80,
}


