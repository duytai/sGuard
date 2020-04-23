/**
 *Submitted for verification at Etherscan.io on 2020-03-26
*/

pragma solidity ^0.5.0;

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;

        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

library Address {
    function isContract(address account) internal view returns (bool) {
        bytes32 codehash;
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        assembly { codehash := extcodehash(account) }
        return (codehash != accountHash && codehash != 0x0);
    }

    function toPayable(address account) internal pure returns (address payable) {
        return address(uint160(account));
    }
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call.value(amount)("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }
}

contract ReentrancyGuard {
    bool private _notEntered;

    constructor () internal {
        _notEntered = true;
    }

    modifier nonReentrant() {
        require(_notEntered, "ReentrancyGuard: reentrant call");

        _notEntered = false;

        _;

        _notEntered = true;
    }
}

contract Context {
    constructor () internal { }

    function _msgSender() internal view returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view returns (bytes memory) {
        this;
        return msg.data;
    }
}

contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    function isOwner() public view returns (bool) {
        return _msgSender() == _owner;
    }

    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

interface IERC1820Registry {
    function setManager(address account, address newManager) external;

    function getManager(address account) external view returns (address);

    function setInterfaceImplementer(address account, bytes32 interfaceHash, address implementer) external;

    function getInterfaceImplementer(address account, bytes32 interfaceHash) external view returns (address);

    function interfaceHash(string calldata interfaceName) external pure returns (bytes32);

    function updateERC165Cache(address account, bytes4 interfaceId) external;

    function implementsERC165Interface(address account, bytes4 interfaceId) external view returns (bool);

    function implementsERC165InterfaceNoCache(address account, bytes4 interfaceId) external view returns (bool);

    event InterfaceImplementerSet(address indexed account, bytes32 indexed interfaceHash, address indexed implementer);

    event ManagerChanged(address indexed account, address indexed newManager);
}

interface IERC777Recipient {
    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external;
}

interface IERC777 {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function granularity() external view returns (uint256);

    function decimals() external view returns (uint8);

    function totalSupply() external view returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function send(address recipient, uint256 amount, bytes calldata data) external;

    function transfer(address recipient, uint256 amount) external returns (bool);

    function mint(address account, uint256 amount, bytes calldata data) external;

    function burn(uint256 amount, bytes calldata data) external;

    function isOperatorFor(address operator, address tokenHolder) external view returns (bool);

    function authorizeOperator(address operator) external;

    function revokeOperator(address operator) external;

    function defaultOperators() external view returns (address[] memory);

    function operatorSend(
        address sender,
        address recipient,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    function operatorBurn(
        address account,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external;

    event Sent(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    event Minted(address indexed operator, address indexed to, uint256 amount, bytes data, bytes operatorData);

    event Burned(address indexed operator, address indexed from, uint256 amount, bytes data, bytes operatorData);

    event AuthorizedOperator(address indexed operator, address indexed tokenHolder);

    event RevokedOperator(address indexed operator, address indexed tokenHolder);
}

interface ISmartexOracle {
  function currentETHPrice() external view returns (uint256);
  function lastETHPriceUpdate() external view returns (uint256);

  function currentTokenPrice() external view returns (uint256);
  function lastTokenPriceUpdate() external view returns (uint256);

  function setETHPrice(uint256 price) external;
  function updateTokenPrice() external;

  event ETHPriceUpdated(uint256 price, uint256 timestamp);
  event TokenPriceUpdated(uint256 price, uint256 timestamp);
}

contract SmartexExchange is Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  using Address for address;

  mapping (address => bool) public authorizedCallers;

  struct OrderStruct {
    bool exists;
    address owner;
    uint256 amount;
  }

  mapping (uint256 => OrderStruct) public orders;

  IERC1820Registry constant internal ERC1820_REGISTRY = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);


  address payable private _wallet;
  address payable private _secondWallet;

  uint256 private _currentOrderID;

  uint256 private _orderUSDMinAmount;

  IERC777 private _token;
  ISmartexOracle private _oracle;

  bytes32 constant private TOKENS_RECIPIENT_INTERFACE_HASH =
        0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b;

  event Order(address indexed owner, uint256 indexed id, uint256 amount, uint256 price, uint256 time);
  event Cancel(address indexed owner, uint256 indexed id, uint256 time);
  event Close(address indexed owner, uint256 indexed id, uint256 time);
  event Trade(address indexed buyer, address indexed seller, uint256 indexed orderID, uint256 amount, uint256 price, uint256 time);

  modifier onlyAuthorizedCaller() {
    require(_msgSender() == owner() || authorizedCallers[_msgSender()], "SmartexExchange: caller is not authorized");
    _;
  }

  constructor(address payable wallet, address payable secondWallet, IERC777 token) public {
    _wallet = wallet;
    _secondWallet = secondWallet;
    _token = token;

    _orderUSDMinAmount = 20 * (10 ** 8);

    ERC1820_REGISTRY.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
  }

  function setOracle(ISmartexOracle oracle) public onlyOwner {
    _oracle = oracle;
  }

  function oracle() public view returns (ISmartexOracle) {
    return _oracle;
  }

  function token() public view returns (IERC777) {
    return _token;
  }

  function wallet() public view returns (address payable) {
    return _wallet;
  }

  function secondWallet() public view returns (address payable) {
    return _secondWallet;
  }

  function setOrderUSDMinAmount(uint256 amount) public onlyOwner {
    _orderUSDMinAmount = amount;
  }

  function setAuthorizedCaller(address caller, bool allowed) public onlyOwner {
    authorizedCallers[caller] = allowed;
  }

  function tokensReceived(address operator, address from, address to, uint256 amount, bytes calldata userData, bytes calldata operatorData) external {
    require(address(_token) == _msgSender(), "Invalid sender");
    require(operator == from, "Transfers from operators are not allowed");
    require(!from.isContract(), "Transfers from contracts are not allowed");

    require(amount >= getOrderTokenMinAmount(), "Amount is less than the minimum");

    _currentOrderID++;

    OrderStruct memory order = OrderStruct({
      exists: true,
      owner: from,
      amount: amount
    });

    orders[_currentOrderID] = order;

    emit Order(from, _currentOrderID, amount, _oracle.currentTokenPrice(), now);
  }

  function cancelOrder(uint256 id) public {
    OrderStruct storage order = orders[id];

    require(order.exists, "Unknown order");
    require(order.amount > 0, "The order is already filled/cancelled");
    require(order.owner == _msgSender(), "You are not the owner of this order");

    uint256 remaining = order.amount;

    order.amount = 0;

    _token.transfer(_msgSender(), remaining);

    emit Cancel(_msgSender(), id, now);
  }

  function buyOrder(uint256 id, uint256 tokens) public nonReentrant payable {
    OrderStruct storage order = orders[id];

    require(order.exists, "Unknown order");
    require(order.amount > 0, "The order is already filled/cancelled");
    require(order.amount >= tokens, "The order has insufficient funds");

    address payable buyer = _msgSender();

    if (order.owner.isContract()) {
      order.amount = 0;
      emit Close(order.owner, id, now);

      bool result = buyer.send(msg.value);

      return;
    }

    uint256 weiAmount = msg.value;
    uint256 weiToSend = getWeiAmount(tokens);

    require(weiToSend > 100, "Minimum trade wei amount 100");

    if (tokens >= order.amount) {
      tokens = order.amount;
      order.amount = 0;
    } else {
      order.amount = order.amount.sub(tokens);
    }

    if (_isDust(order.amount)) {
      uint256 remaining = order.amount;

      order.amount = 0;

      emit Close(order.owner, id, now);

      if (remaining > 0) {
        _token.transfer(order.owner, remaining);
      }
    }

    uint256 change = weiAmount.sub(weiToSend);
    uint256 fee = weiToSend.div(100);
    weiToSend = weiToSend.sub(fee);

    bool result;

    if (order.owner == owner()) {
      _splitAndSendWei(weiToSend);
    } else {
      result = order.owner.toPayable().send(weiToSend);
    }

    _token.transfer(buyer, tokens);
    result = owner().toPayable().send(fee);

    emit Trade(buyer, order.owner, id, tokens, _oracle.currentTokenPrice(), now);

    if (change > 0) {
      result = buyer.send(change);
    }
  }

  function _splitAndSendWei(uint256 weiAmount) internal {
    uint256 ownerPayment = weiAmount.mul(70).div(100);
    uint256 walletsPayment = weiAmount.sub(ownerPayment);

    owner().toPayable().transfer(ownerPayment);

    if (walletsPayment > 0) {
      uint256 firstWalletPayment = walletsPayment.div(2);
      uint256 secondWalletPayment = walletsPayment.sub(firstWalletPayment);

      wallet().transfer(firstWalletPayment);
      secondWallet().transfer(secondWalletPayment);
    }
  }

  function getWeiAmount(uint256 tokens) public view returns (uint256) {
    return tokens.mul(_oracle.currentTokenPrice()).div(_oracle.currentETHPrice());
  }

  function getTokenAmount(uint256 weiAmount) public view returns (uint256) {
    return weiAmount.mul(_oracle.currentETHPrice()).div(_oracle.currentTokenPrice());
  }

  function getOrderTokenMinAmount() public view returns (uint256) {
    return _orderUSDMinAmount.mul(10 ** uint256(_token.decimals())).div(_oracle.currentTokenPrice());
  }


  function _isDust(uint256 tokens) internal view returns (bool) {
    return tokens.mul(_oracle.currentTokenPrice()).div(10 ** uint256(_token.decimals())) < (10 ** 6);
  }
}