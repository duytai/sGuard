contract Fund {
  mapping(address => uint) balances;
  function transfer() public {
    msg.sender.send(balances[msg.sender]);
  }
}
