contract Fund {
  mapping(address => uint) balances;
  function transfer(uint amount) public {
    require(block.timestamp > 1000);
    msg.sender.send(amount);
  }
}
