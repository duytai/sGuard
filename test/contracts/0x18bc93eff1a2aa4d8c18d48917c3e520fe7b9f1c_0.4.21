/**
 *Submitted for verification at Etherscan.io on 2020-03-24
*/

pragma solidity >=0.4.21 <0.6.0;

contract TransferableToken{
    function balanceOf(address _owner) public returns (uint256 balance) ;
    function transfer(address _to, uint256 _amount) public returns (bool success) ;
    function transferFrom(address _from, address _to, uint256 _amount) public returns (bool success) ;
}


contract TokenClaimer{

    event ClaimedTokens(address indexed _token, address indexed _to, uint _amount);
    /// @notice This method can be used by the controller to extract mistakenly
    ///  sent tokens to this contract.
    /// @param _token The address of the token contract that you want to recover
    ///  set to 0 in case you want to extract ether.
  function _claimStdTokens(address _token, address payable to) internal {
        if (_token == address(0x0)) {
            to.transfer(address(this).balance);
            return;
        }
        TransferableToken token = TransferableToken(_token);
        uint balance = token.balanceOf(address(this));

        (bool status,) = _token.call(abi.encodeWithSignature("transfer(address,uint256)", to, balance));
        require(status, "call failed");
        emit ClaimedTokens(_token, to, balance);
  }
}


library SafeMath {
    function safeAdd(uint a, uint b) public pure returns (uint c) {
        c = a + b;
        require(c >= a, "add");
    }
    function safeSub(uint a, uint b) public pure returns (uint c) {
        require(b <= a, "sub");
        c = a - b;
    }
    function safeMul(uint a, uint b) public pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b, "mul");
    }
    function safeDiv(uint a, uint b) public pure returns (uint c) {
        require(b > 0, "div");
        c = a / b;
    }
}



contract ERC20TokenBankInterface{
  function balance() public view returns(uint);
  function token() public view returns(address, string memory);
  function issue(address _to, uint _amount) public returns (bool success);
}

contract ERC20Payment{
  using SafeMath for uint;

  string public payment_info;
  ERC20TokenBankInterface public bank;
  address public account;
  uint public total_amount;
  uint public remain;

  event ClaimedPayment(address account, address to, uint amount);
  event ChangedBank(address old_bank, address new_bank);

  modifier only_owner{
    require(account == msg.sender, "only owner can call this");
    _;
  }
  constructor(string memory _info, address _bank, address _account, uint _amount) public {
    require(_bank != address(0x0), "invalid address");
    require(_account != address(0x0), "invalid address");
    payment_info = _info;
    bank = ERC20TokenBankInterface(_bank);
    account = _account;
    total_amount = _amount;
    remain = _amount;
  }

  function change_token_bank(address _addr) public only_owner returns(bool){
    require(_addr != address(0x0), "invalid address");
    require(_addr != address(bank), "same as old bank");

    address old =address(bank);
    bank = ERC20TokenBankInterface(_addr);
    emit ChangedBank(old, address(bank));
    return true;
  }

  function bank_balance() public view returns(uint){
    return bank.balance();
  }
  function bank_token() public view returns(address, string memory){
    return bank.token();
  }

  function claim_payment(address to, uint amount) public only_owner returns(bool){
    require(to != address(0x0), "invalid address");
    require(amount <= remain, "not enough remain");
    require(amount <= bank_balance(), "bank doesn't have enough token");
    remain = remain.safeSub(amount);
    bank.issue(to, amount);
    emit ClaimedPayment(msg.sender, to, amount);
    return true;
  }

}

contract ERC20PaymentFactory{
  event CreateERC20Payment(address addr);

  function newPayment(string memory info, address bank, address account, uint amount)
  public returns (ERC20Payment){
    ERC20Payment addr = new ERC20Payment(info, bank, account, amount);
    emit CreateERC20Payment(address(addr));
    return addr;
  }
}