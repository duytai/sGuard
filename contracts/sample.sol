/**
 *Submitted for verification at Etherscan.io on 2020-03-17
*/

pragma solidity ^0.5.4;

// https://github.com/ethereum/EIPs/issues/20
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract OwnAdminable {
    address private _owner;
    address private _admin;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor () internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @return the address of the owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @return the address of the admin.
     */
    function admin() public view returns (address) {
        return _admin;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwnerOrAdmin() {
        require(isOwnerOrAdmin());
        _;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @return true if `msg.sender` is the owner or admin of the contract.
     */
    function isOwnerOrAdmin() public view returns (bool) {
        return msg.sender == _owner || msg.sender == _admin;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     * @notice Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    function setAdmin(address newAdmin) public onlyOwner {
        _admin = newAdmin;
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

contract Pausable is OwnAdminable {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    constructor () internal {
        _paused = false;
    }

    /**
     * @return true if the contract is paused, false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused);
        _;
    }

    /**
     * @dev called by the owner to pause, triggers stopped state
     */
    function pause() public onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev called by the owner to unpause, returns to normal state
     */
    function unpause() public onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }
}

contract MasBurner is Pausable {
    string public name = "Midas Infinity Burner";

    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant BURN_START_TIME = 1584288000; // Monday, March 16, 2020 00:00:00 AM (GMT+8)
    uint256 public constant ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60;

    uint256[] public burnAmountArr;
    uint256[] public burnTimestampArr;

    uint256 public numOfBurns;
    uint256 public weeklyLimit;
    address public tokenAddress;

    uint256 public totalBurnAmount = 0;
    uint256 public totalReceivingMcashAmount = 0;
    uint256 public burningRate; // over 100
    uint256 public feeRate; // over 100

    event ChangeWeeklyLimit(uint256 weeklyLimit);
    event Burn(address indexed burner, address indexed mcashReceiver, uint256 burnAmount, uint256 receivingMcashAmount);
    event ChangeBurningRate(uint256 burningRate);
    event ChangeFeeRate(uint256 feeRate);

    constructor (address _tokenAddress, uint256 _weeklyLimit, uint256 _burningRate, uint256 _feeRate) public {
        tokenAddress = _tokenAddress;
        setWeeklyLimit(_weeklyLimit);
        setBurningRate(_burningRate);
        setFeeRate(_feeRate);
    }

    function setWeeklyLimit(uint256 _weeklyLimit) onlyOwnerOrAdmin public {
        weeklyLimit = _weeklyLimit;
        emit ChangeWeeklyLimit(weeklyLimit);
    }

    function setBurningRate(uint256 _burningRate) onlyOwnerOrAdmin public {
        burningRate = _burningRate;
        emit ChangeBurningRate(burningRate);
    }

    function setFeeRate(uint256 _feeRate) onlyOwnerOrAdmin public {
        feeRate = _feeRate;
        emit ChangeFeeRate(feeRate);
    }

    function getWeekIndex() public view returns (uint256) {
        return (now - BURN_START_TIME) / ONE_WEEK_IN_SECONDS;
    }

    function getThisWeekStartTime() public view returns (uint256) {
        return BURN_START_TIME + ONE_WEEK_IN_SECONDS * getWeekIndex();
    }

    function getThisWeekBurnedAmount() public view returns (uint256) {
        uint256 thisWeekStartTime = getThisWeekStartTime();
        uint256 total = 0;
        for (uint256 i = numOfBurns; i >= 1; i--) {
            if (burnTimestampArr[i - 1] < thisWeekStartTime) break;
            total += burnAmountArr[i - 1];
        }
        return total;
    }

    function getThisWeekBurnAmountLeft() public view returns (uint256) {
        return weeklyLimit - getThisWeekBurnedAmount();
    }

    function getMcashReceivingAmount(uint256 amount) public view returns (uint256) {
        uint256 amt = amount * burningRate / 100;
        uint256 fee = amt * feeRate / 100;
        return amt - fee;
    }

    function burn(uint256 amount, address mcashReceiver) external payable {
        require(amount <= getThisWeekBurnAmountLeft(), "Exceed burn amount weekly");
        require(IERC20(tokenAddress).transferFrom(msg.sender, BURN_ADDRESS, amount), "Cannot transfer token to burn");
        uint256 mcashReceivingAmount = getMcashReceivingAmount(amount);
        burnTimestampArr.push(now);
        burnAmountArr.push(amount);
        totalBurnAmount += amount;
        totalReceivingMcashAmount += mcashReceivingAmount;
        ++numOfBurns;
        emit Burn(msg.sender, mcashReceiver, amount, mcashReceivingAmount);
    }
}
