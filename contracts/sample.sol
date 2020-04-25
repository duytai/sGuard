contract Fund {
  mapping(address => uint) balances;
  function transfer(uint amount) public {
    require(block.timestamp > 1000);
    require(block.number > 1000);
    msg.sender.delegatecall(abi.encode("setN(uint256)"));
  }
}
