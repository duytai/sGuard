/**
 *Submitted for verification at Etherscan.io on 2020-01-03
*/

// File: @openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol

pragma solidity ^0.5.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see {ERC20Detailed}.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// File: @openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol

pragma solidity ^0.5.0;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     *
     * _Available since v2.4.0._
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

// File: @openzeppelin/upgrades/contracts/Initializable.sol

pragma solidity >=0.4.24 <0.6.0;


/**
 * @title Initializable
 *
 * @dev Helper contract to support initializer functions. To use it, replace
 * the constructor with a function that has the `initializer` modifier.
 * WARNING: Unlike constructors, initializer functions must be manually
 * invoked. This applies both to deploying an Initializable contract, as well
 * as extending an Initializable contract via inheritance.
 * WARNING: When used with inheritance, manual care must be taken to not invoke
 * a parent initializer twice, or ensure that all initializers are idempotent,
 * because this is not dealt with automatically as with constructors.
 */
contract Initializable {

  /**
   * @dev Indicates that the contract has been initialized.
   */
  bool private initialized;

  /**
   * @dev Indicates that the contract is in the process of being initialized.
   */
  bool private initializing;

  /**
   * @dev Modifier to use in the initializer function of a contract.
   */
  modifier initializer() {
    require(initializing || isConstructor() || !initialized, "Contract instance has already been initialized");

    bool isTopLevelCall = !initializing;
    if (isTopLevelCall) {
      initializing = true;
      initialized = true;
    }

    _;

    if (isTopLevelCall) {
      initializing = false;
    }
  }

  /// @dev Returns true if and only if the function is running in the constructor
  function isConstructor() private view returns (bool) {
    // extcodesize checks the size of the code stored in an address, and
    // address returns the current address. Since the code is still not
    // deployed when running a constructor, any checks on its code size will
    // yield zero, making it an effective way to detect if a contract is
    // under construction or not.
    uint256 cs;
    assembly { cs := extcodesize(address) }
    return cs == 0;
  }

  // Reserved storage space to allow for layout changes in the future.
  uint256[50] private ______gap;
}

// File: @openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol

pragma solidity ^0.5.0;


/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with GSN meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
contract Context is Initializable {
    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal { }
    // solhint-disable-previous-line no-empty-blocks

    function _msgSender() internal view returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

// File: @openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol

pragma solidity ^0.5.0;



/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be aplied to your functions to restrict their use to
 * the owner.
 */
contract Ownable is Initializable, Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    function initialize(address sender) public initializer {
        _owner = sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return _msgSender() == _owner;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * > Note: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    uint256[50] private ______gap;
}

// File: @openzeppelin/contracts-ethereum-package/contracts/access/Roles.sol

pragma solidity ^0.5.0;

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev Give an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0), "Roles: account is the zero address");
        return role.bearer[account];
    }
}

// File: @openzeppelin/contracts-ethereum-package/contracts/access/roles/PauserRole.sol

pragma solidity ^0.5.0;




contract PauserRole is Initializable, Context {
    using Roles for Roles.Role;

    event PauserAdded(address indexed account);
    event PauserRemoved(address indexed account);

    Roles.Role private _pausers;

    function initialize(address sender) public initializer {
        if (!isPauser(sender)) {
            _addPauser(sender);
        }
    }

    modifier onlyPauser() {
        require(isPauser(_msgSender()), "PauserRole: caller does not have the Pauser role");
        _;
    }

    function isPauser(address account) public view returns (bool) {
        return _pausers.has(account);
    }

    function addPauser(address account) public onlyPauser {
        _addPauser(account);
    }

    function renouncePauser() public {
        _removePauser(_msgSender());
    }

    function _addPauser(address account) internal {
        _pausers.add(account);
        emit PauserAdded(account);
    }

    function _removePauser(address account) internal {
        _pausers.remove(account);
        emit PauserRemoved(account);
    }

    uint256[50] private ______gap;
}

// File: @openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol

pragma solidity ^0.5.0;




/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
contract Pausable is Initializable, Context, PauserRole {
    /**
     * @dev Emitted when the pause is triggered by a pauser (`account`).
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by a pauser (`account`).
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state. Assigns the Pauser role
     * to the deployer.
     */
    function initialize(address sender) public initializer {
        PauserRole.initialize(sender);

        _paused = false;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    /**
     * @dev Called by a pauser to pause, triggers stopped state.
     */
    function pause() public onlyPauser whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Called by a pauser to unpause, returns to normal state.
     */
    function unpause() public onlyPauser whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }

    uint256[50] private ______gap;
}

// File: contracts/storage/EthicHubStorageInterface.sol

pragma solidity 0.5.13;


/**
 * Interface for the eternal storage.
 * Thanks RocketPool!
 * https://github.com/rocket-pool/rocketpool/blob/master/contracts/interface/RocketStorageInterface.sol
 */
contract EthicHubStorageInterface {

    //modifier for access in sets and deletes
    modifier onlyEthicHubContracts() {_;}

    // Setters
    function setAddress(bytes32 _key, address _value) external;
    function setUint(bytes32 _key, uint _value) external;
    function setString(bytes32 _key, string calldata _value) external;
    function setBytes(bytes32 _key, bytes calldata _value) external;
    function setBool(bytes32 _key, bool _value) external;
    function setInt(bytes32 _key, int _value) external;
    // Deleters
    function deleteAddress(bytes32 _key) external;
    function deleteUint(bytes32 _key) external;
    function deleteString(bytes32 _key) external;
    function deleteBytes(bytes32 _key) external;
    function deleteBool(bytes32 _key) external;
    function deleteInt(bytes32 _key) external;

    // Getters
    function getAddress(bytes32 _key) external view returns (address);
    function getUint(bytes32 _key) external view returns (uint);
    function getString(bytes32 _key) external view returns (string memory);
    function getBytes(bytes32 _key) external view returns (bytes memory);
    function getBool(bytes32 _key) external view returns (bool);
    function getInt(bytes32 _key) external view returns (int);
}

// File: contracts/EthicHubBase.sol

pragma solidity 0.5.13;



contract EthicHubBase is Initializable {

    uint8 public version;

    EthicHubStorageInterface public ethicHubStorage;

    function initialize(address _ethicHubStorage, uint8 _version) public initializer {
        require(address(_ethicHubStorage) != address(0), "Storage address cannot be zero address");
        ethicHubStorage = EthicHubStorageInterface(_ethicHubStorage);
        version = _version;
    }
}

// File: contracts/lending/EthicHubLending.sol

pragma solidity 0.5.13;







contract EthicHubLending is Pausable, Ownable {
    using SafeMath for uint256;

    enum LendingState {
        Uninitialized,
        AcceptingContributions,
        ExchangingToFiat,
        AwaitingReturn,
        ProjectNotFunded,
        ContributionReturned,
        Default
    }

    uint8 public version;
    EthicHubStorageInterface public ethicHubStorage;

    IERC20 public stableCoin;

    mapping(address => Investor) public investors;

    uint256 public investorCount;
    uint256 public reclaimedContributions;
    uint256 public fundingStartTime; // Start time of contribution period in UNIX time
    uint256 public fundingEndTime; // End time of contribution period in UNIX time
    uint256 public totalContributed;

    bool public capReached;

    LendingState public state;

    uint256 public annualInterest;
    uint256 public totalLendingAmount;
    uint256 public lendingDays;
    uint256 public borrowerReturnDays;
    uint256 public initialStableCoinPerFiatRate;
    uint256 public totalLendingFiatAmount;

    address public borrower;
    address public localNode;
    address public ethicHubTeam;

    address public depositManager;

    uint256 public borrowerReturnStableCoinPerFiatRate;
    uint256 public ethichubFee;
    uint256 public localNodeFee;

    // Interest rate is using base uint 100 and 100% 10000, this means 1% is 100
    // this guarantee we can have a 2 decimal presicion in our calculation
    uint256 public constant interestBaseUint = 100;
    uint256 public constant interestBasePercent = 10000;

    bool public localNodeFeeReclaimed;
    bool public ethicHubTeamFeeReclaimed;

    uint256 public returnedAmount;

    struct Investor {
        uint256 amount;
        bool isCompensated;
    }

    // Events
    event CapReached(uint endTime);
    event Contribution(uint totalContributed, address indexed investor, uint amount, uint investorsCount);
    event Compensated(address indexed contributor, uint amount);
    event StateChange(uint state);
    event InitalRateSet(uint rate);
    event ReturnRateSet(uint rate);
    event ReturnAmount(address indexed borrower, uint amount);
    event BorrowerChanged(address indexed newBorrower);
    event InvestorChanged(address indexed oldInvestor, address indexed newInvestor);
    event Reclaim(address indexed target, uint256 amount);

    modifier checkIfArbiter() {
        address arbiter = ethicHubStorage.getAddress(keccak256(abi.encodePacked("arbiter", this)));
        require(arbiter == msg.sender, "Sender not authorized");
        _;
    }

    modifier onlyOwnerOrLocalNode() {
        require(localNode == msg.sender || owner() == msg.sender,"Sender not authorized");
        _;
    }

    constructor(
        uint256 _fundingStartTime,
        uint256 _fundingEndTime,
        uint256 _annualInterest,
        uint256 _totalLendingAmount,
        uint256 _lendingDays,
        uint256 _ethichubFee,
        uint256 _localNodeFee,
        address _borrower,
        address _localNode,
        address _ethicHubTeam,
        address _depositManager,
        address _ethicHubStorage,
        address _stableCoin
        ) public {
        require(address(_ethicHubStorage) != address(0), "Storage address cannot be zero address");

        ethicHubStorage = EthicHubStorageInterface(_ethicHubStorage);
        version = 8;

        require(_fundingEndTime > fundingStartTime, "fundingEndTime should be later than fundingStartTime");
        require(_borrower != address(0), "No borrower set");
        require(ethicHubStorage.getBool(keccak256(abi.encodePacked("user", "representative", _borrower))), "Borrower not registered representative");
        require(_localNode != address(0), "No Local Node set");
        require(_ethicHubTeam != address(0), "No EthicHub Team set");
        require(ethicHubStorage.getBool(keccak256(abi.encodePacked("user", "localNode", _localNode))), "Local Node is not registered");
        require(_totalLendingAmount > 0, "_totalLendingAmount must be > 0");
        require(_lendingDays > 0, "_lendingDays must be > 0");
        require(_annualInterest > 0 && _annualInterest < 100, "_annualInterest must be between 0 and 100");

        reclaimedContributions = 0;
        borrowerReturnDays = 0;

        fundingStartTime = _fundingStartTime;
        fundingEndTime = _fundingEndTime;
        annualInterest = _annualInterest;
        totalLendingAmount = _totalLendingAmount;
        lendingDays = _lendingDays;
        ethichubFee = _ethichubFee;
        localNodeFee = _localNodeFee;

        borrower = _borrower;
        localNode = _localNode;
        ethicHubTeam = _ethicHubTeam;

        depositManager = _depositManager;

        stableCoin = IERC20(_stableCoin);

        state = LendingState.Uninitialized;

        Ownable.initialize(msg.sender);
        Pausable.initialize(msg.sender);
    }

    function saveInitialParametersToStorage(
        uint256 _maxDelayDays,
        uint256 _communityMembers,
        address _community
        ) external onlyOwnerOrLocalNode {
        require(_maxDelayDays != 0, "_maxDelayDays must be > 0");
        require(state == LendingState.Uninitialized, "State must be Uninitialized");
        require(_communityMembers > 0, "_communityMembers must be > 0");
        require(ethicHubStorage.getBool(keccak256(abi.encodePacked("user", "community", _community))), "Community is not registered");

        ethicHubStorage.setUint(keccak256(abi.encodePacked("lending.maxDelayDays", this)), _maxDelayDays);
        ethicHubStorage.setAddress(keccak256(abi.encodePacked("lending.community", this)), _community);
        ethicHubStorage.setAddress(keccak256(abi.encodePacked("lending.localNode", this)), localNode);
        ethicHubStorage.setUint(keccak256(abi.encodePacked("lending.communityMembers", this)), _communityMembers);

        changeState(LendingState.AcceptingContributions);
    }

    function setBorrower(address _borrower) external checkIfArbiter {
        require(_borrower != address(0), "No borrower set");
        require(ethicHubStorage.getBool(keccak256(abi.encodePacked("user", "representative", _borrower))), "Borrower not registered representative");

        borrower = _borrower;

        emit BorrowerChanged(borrower);
    }

    function changeInvestorAddress(address oldInvestor, address newInvestor) external checkIfArbiter {
        require(newInvestor != address(0));
        require(ethicHubStorage.getBool(keccak256(abi.encodePacked("user", "investor", newInvestor))));
        require(investors[oldInvestor].amount != 0, "OldInvestor should have invested in this project");
        require(
            investors[newInvestor].amount == 0,
            "newInvestor should not have invested anything"
        );

        investors[newInvestor].amount = investors[oldInvestor].amount;
        investors[newInvestor].isCompensated = investors[oldInvestor].isCompensated;

        delete investors[oldInvestor];

        emit InvestorChanged(oldInvestor, newInvestor);
    }

    function deposit(address contributor, uint256 amount) external {
        require(
            msg.sender == depositManager,
            "Caller is not a deposit manager"
        );
        require(
            state == LendingState.AcceptingContributions ||
            state == LendingState.AwaitingReturn,
            "Can't contribute in this state"
        );

        if(state == LendingState.AcceptingContributions) {
            contributeWithAddress(contributor, amount);
        } else {
            require(contributor == borrower, "In state AwaitingReturn only borrower can contribute");
            returnBorrowed(amount);
        }
    }

    /**
     * After the contribution period ends unsuccesfully, this method enables the contributor
     *  to retrieve their contribution
     */
    function declareProjectNotFunded() external onlyOwnerOrLocalNode {
        require(totalContributed < totalLendingAmount);
        require(state == LendingState.AcceptingContributions);
        require(now > fundingEndTime);

        changeState(LendingState.ProjectNotFunded);
    }

    function declareProjectDefault() external onlyOwnerOrLocalNode {
        require(state == LendingState.AwaitingReturn);
        uint maxDelayDays = getMaxDelayDays();
        require(getDelayDays(now) >= maxDelayDays);

        ethicHubStorage.setUint(keccak256(abi.encodePacked("lending.delayDays", this)), maxDelayDays);

        changeState(LendingState.Default);
    }

    function setborrowerReturnStableCoinPerFiatRate(uint256 _borrowerReturnStableCoinPerFiatRate) external onlyOwnerOrLocalNode {
        require(state == LendingState.AwaitingReturn, "State is not AwaitingReturn");

        borrowerReturnStableCoinPerFiatRate = _borrowerReturnStableCoinPerFiatRate;

        emit ReturnRateSet(borrowerReturnStableCoinPerFiatRate);
    }

    /**
    * Marks the initial exchange period as over (the ETH collected amount has been exchanged for local Fiat currency)
    * Sets the local currency to return, on the basis of which the interest will be calculated
    * @param _initialStableCoinPerFiatRate the rate with 2 decimals. i.e. 444.22 is 44422 , 1245.00 is 124500
    */
    function finishInitialExchangingPeriod(uint256 _initialStableCoinPerFiatRate) external onlyOwnerOrLocalNode {
        require(capReached == true, "Cap not reached");
        require(state == LendingState.ExchangingToFiat, "State is not ExchangingToFiat");

        initialStableCoinPerFiatRate = _initialStableCoinPerFiatRate;
        totalLendingFiatAmount = totalLendingAmount.mul(initialStableCoinPerFiatRate);

        emit InitalRateSet(initialStableCoinPerFiatRate);

        changeState(LendingState.AwaitingReturn);
    }

    /**
     * Method to reclaim contribution after project is declared default (% of partial funds)
     * @param  beneficiary the contributor
     *
     */
    function reclaimContributionDefault(address beneficiary) external {
        require(state == LendingState.Default);
        require(!investors[beneficiary].isCompensated);

        // contribution = contribution * partial_funds / total_funds
        uint256 contribution = checkInvestorReturns(beneficiary);

        require(contribution > 0);

        investors[beneficiary].isCompensated = true;
        reclaimedContributions = reclaimedContributions.add(1);

        doReclaim(beneficiary, contribution);
    }

    /**
     * Method to reclaim contribution after a project is declared as not funded
     * @param  beneficiary the contributor
     *
     */
    function reclaimContribution(address beneficiary) external {
        require(state == LendingState.ProjectNotFunded, "State is not ProjectNotFunded");
        require(!investors[beneficiary].isCompensated, "Contribution already reclaimed");
        uint256 contribution = investors[beneficiary].amount;
        require(contribution > 0, "Contribution is 0");

        investors[beneficiary].isCompensated = true;
        reclaimedContributions = reclaimedContributions.add(1);

        doReclaim(beneficiary, contribution);
    }

    function reclaimContributionWithInterest(address beneficiary) external {
        require(state == LendingState.ContributionReturned, "State is not ContributionReturned");
        require(!investors[beneficiary].isCompensated, "Lender already compensated");
        uint256 contribution = checkInvestorReturns(beneficiary);
        require(contribution > 0, "Contribution is 0");

        investors[beneficiary].isCompensated = true;
        reclaimedContributions = reclaimedContributions.add(1);

        doReclaim(beneficiary, contribution);
    }

    function reclaimLocalNodeFee() external {
        require(state == LendingState.ContributionReturned, "State is not ContributionReturned");
        require(localNodeFeeReclaimed == false, "Local Node's fee already reclaimed");
        uint256 fee = totalLendingFiatAmount.mul(localNodeFee).mul(interestBaseUint).div(interestBasePercent).div(borrowerReturnStableCoinPerFiatRate);
        require(fee > 0, "Local Node's team fee is 0");

        localNodeFeeReclaimed = true;

        doReclaim(localNode, fee);
    }

    function reclaimEthicHubTeamFee() external {
        require(state == LendingState.ContributionReturned, "State is not ContributionReturned");
        require(ethicHubTeamFeeReclaimed == false, "EthicHub team's fee already reclaimed");
        uint256 fee = totalLendingFiatAmount.mul(ethichubFee).mul(interestBaseUint).div(interestBasePercent).div(borrowerReturnStableCoinPerFiatRate);
        require(fee > 0, "EthicHub's team fee is 0");

        ethicHubTeamFeeReclaimed = true;

        doReclaim(ethicHubTeam, fee);
    }

    function reclaimLeftover() external checkIfArbiter {
        require(state == LendingState.ContributionReturned || state == LendingState.Default, "State is not ContributionReturned or Default");
        require(localNodeFeeReclaimed, "Local Node fee is not reclaimed");
        require(ethicHubTeamFeeReclaimed, "Team fee is not reclaimed");
        require(investorCount == reclaimedContributions, "Not all investors have reclaimed their share");

        doReclaim(ethicHubTeam, stableCoin.balanceOf(address(this)));
    }

    function doReclaim(address target, uint256 amount) internal {
        uint256 contractBalance = stableCoin.balanceOf(address(this));
        uint256 reclaimAmount = (contractBalance < amount) ? contractBalance : amount;

        require(stableCoin.transfer(target, reclaimAmount), "transfer stable token method failed");

        emit Reclaim(target, reclaimAmount);
    }

    function returnBorrowed(uint256 amount) internal {
        require(state == LendingState.AwaitingReturn, "State is not AwaitingReturn");
        require(borrowerReturnStableCoinPerFiatRate > 0, "Second exchange rate not set");

        bool projectRepayed = false;
        uint excessRepayment = 0;
        uint newReturnedAmount = 0;

        emit ReturnAmount(borrower, amount);

        (newReturnedAmount, projectRepayed, excessRepayment) = calculatePaymentGoal(borrowerReturnAmount(), returnedAmount, amount);

        returnedAmount = newReturnedAmount;

        if (projectRepayed == true) {
            borrowerReturnDays = getDaysPassedBetweenDates(fundingEndTime, now);
            changeState(LendingState.ContributionReturned);
        }

        if (excessRepayment > 0) {
            require(stableCoin.transfer(borrower, excessRepayment), "transfer stable token method failed");
        }
    }

    // @notice Function to participate in contribution period
    //  Amounts from the same address should be added up
    //  If cap is reached, end time should be modified
    //  Funds should be transferred into multisig wallet
    // @param contributor Address
    function contributeWithAddress(address contributor, uint256 amount) internal whenNotPaused {
        require(state == LendingState.AcceptingContributions, "state is not AcceptingContributions");
        require(isContribPeriodRunning(), "can't contribute outside contribution period");

        uint oldTotalContributed = totalContributed;
        uint newTotalContributed = 0;
        uint excessContribAmount = 0;

        (newTotalContributed, capReached, excessContribAmount) = calculatePaymentGoal(totalLendingAmount, oldTotalContributed, amount);

        totalContributed = newTotalContributed;

        if (capReached) {
            fundingEndTime = now;
            emit CapReached(fundingEndTime);
        }

        if (investors[contributor].amount == 0) {
            investorCount = investorCount.add(1);
        }

        if (excessContribAmount > 0) {
            require(stableCoin.transfer(contributor, excessContribAmount), "transfer stable token method failed");
            investors[contributor].amount = investors[contributor].amount.add(amount).sub(excessContribAmount);
            emit Contribution(newTotalContributed, contributor, amount.sub(excessContribAmount), investorCount);
        } else {
            investors[contributor].amount = investors[contributor].amount.add(amount);
            emit Contribution(newTotalContributed, contributor, amount, investorCount);
        }
    }

    /**
     * Calculates if a target value is reached after increment, and by how much it was surpassed.
     * @param goal the target to achieve
     * @param oldTotal the total so far after the increment
     * @param contribValue the increment
     * @return (the incremented count, not bigger than max), (goal has been reached), (excess to return)
     */
    function calculatePaymentGoal(uint goal, uint oldTotal, uint contribValue) internal pure returns(uint, bool, uint) {
        uint newTotal = oldTotal.add(contribValue);
        bool goalReached = false;
        uint excess = 0;
        if (newTotal >= goal && oldTotal < goal) {
            goalReached = true;
            excess = newTotal.sub(goal);
            contribValue = contribValue.sub(excess);
            newTotal = goal;
        }
        return (newTotal, goalReached, excess);
    }

    function sendFundsToBorrower() external onlyOwnerOrLocalNode {
        // Waiting for Exchange
        require(state == LendingState.AcceptingContributions, "State has to be AcceptingContributions");
        require(capReached, "Cap is not reached");

        changeState(LendingState.ExchangingToFiat);

        stableCoin.transfer(borrower, totalContributed);
    }

    /**
    * Calculates days passed after defaulting
    * @param date timestamp to calculate days
    * @return day number
    */
    function getDelayDays(uint date) public view returns(uint) {
        uint lendingDaysSeconds = lendingDays * 1 days;
        uint defaultTime = fundingEndTime.add(lendingDaysSeconds);

        if (date < defaultTime) {
            return 0;
        } else {
            return getDaysPassedBetweenDates(defaultTime, date);
        }
    }

    /**
    * Calculates days passed between two dates in seconds
    * @param firstDate timestamp
    * @param lastDate timestamp
    * @return days passed
    */
    function getDaysPassedBetweenDates(uint firstDate, uint lastDate) public pure returns(uint) {
        require(firstDate <= lastDate, "lastDate must be bigger than firstDate");
        return lastDate.sub(firstDate).div(60).div(60).div(24);
    }

    // lendingInterestRate with 2 decimal
    // 15 * (lending days)/ 365 + 4% local node fee + 3% LendingDev fee
    function lendingInterestRatePercentage() public view returns(uint256){
        return annualInterest.mul(interestBaseUint)
            // current days
            .mul(getDaysPassedBetweenDates(fundingEndTime, now)).div(365)
            .add(localNodeFee.mul(interestBaseUint))
            .add(ethichubFee.mul(interestBaseUint))
            .add(interestBasePercent);
    }

    // lendingInterestRate with 2 decimal
    function investorInterest() public view returns(uint256){
        return annualInterest.mul(interestBaseUint).mul(borrowerReturnDays).div(365).add(interestBasePercent);
    }

    function borrowerReturnFiatAmount() public view returns(uint256) {
        return totalLendingFiatAmount.mul(lendingInterestRatePercentage()).div(interestBasePercent);
    }

    function borrowerReturnAmount() public view returns(uint256) {
        return borrowerReturnFiatAmount().div(borrowerReturnStableCoinPerFiatRate);
    }

    function isContribPeriodRunning() public view returns(bool) {
        return fundingStartTime <= now && fundingEndTime > now && !capReached;
    }

    function checkInvestorContribution(address investor) public view returns(uint256){
        return investors[investor].amount;
    }

    function checkInvestorReturns(address investor) public view returns(uint256) {
        uint256 investorAmount = 0;
        if (state == LendingState.ContributionReturned) {
            investorAmount = investors[investor].amount;
            return investorAmount.mul(initialStableCoinPerFiatRate).mul(investorInterest()).div(borrowerReturnStableCoinPerFiatRate).div(interestBasePercent);
        } else if (state == LendingState.Default){
            investorAmount = investors[investor].amount;
            // contribution = contribution * partial_funds / total_funds
            return investorAmount.mul(returnedAmount).div(totalLendingAmount);
        } else {
            return 0;
        }
    }

    function getMaxDelayDays() public view returns(uint256){
        return ethicHubStorage.getUint(keccak256(abi.encodePacked("lending.maxDelayDays", this)));
    }

    function getUserContributionReclaimStatus(address userAddress) public view returns(bool isCompensated){
        return investors[userAddress].isCompensated;
    }

    function changeState(LendingState newState) internal {
        state = newState;
        emit StateChange(uint(newState));
    }
}