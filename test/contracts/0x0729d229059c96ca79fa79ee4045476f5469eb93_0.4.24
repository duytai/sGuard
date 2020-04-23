pragma solidity ^0.4.24;
import "./SafeMath.sol";

interface ERC20 {
    function balanceOf(address who) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract RockFlameBTC {
    using SafeMath for uint256;

    // BCNT token contract
    ERC20 public BCNTToken;

    // Roles
    address public bincentiveHot; // i.e., Platform Owner
    address public bincentiveCold;
    address[] public rockInvestors;

    uint256 public numMidwayQuitInvestors;
    uint256 public numAUMDistributedInvestors; // i.e., number of investors that already received AUM

    // Contract(Fund) Status
    // 0: not initialized
    // 1: initialized
    // 2: not enough fund came in in time
    // 3: fundStarted(skipped)
    // 4: running
    // 5: stoppped
    // 6: closed
    uint256 public fundStatus;

    // Money
    uint256 public totalRockInvestedAmount;
    mapping(address => uint256) public rockInvestedAmount;

    uint256 public BCNTLockAmount;

    uint256 public returnedBTCAmounts;

    // Events
    event Deposit(address indexed investor, uint256 amount);
    event StartFund(uint256 num_investors, uint256 totalInvestedAmount, uint256 BCNTLockAmount);
    event AbortFund(uint256 num_investors, uint256 totalInvestedAmount);
    event MidwayQuit(address indexed investor, uint256 investAmount, uint256 BCNTWithdrawAmount);
    event ReturnAUM(uint256 amountBTC);
    event DistributeAUM(address indexed to, uint256 amountBTC);


    // Modifiers
    modifier initialized() {
        require(fundStatus == 1);
        _;
    }

    // modifier fundStarted() {
    //     require(fundStatus == 3);
    //     _;
    // }

    modifier running() {
        require(fundStatus == 4);
        _;
    }

    modifier stopped() {
        require(fundStatus == 5);
        _;
    }

    // modifier afterStartedBeforeStopped() {
    //     require((fundStatus >= 3) && (fundStatus < 5));
    //     _;
    // }

    modifier closedOrAborted() {
        require((fundStatus == 6) || (fundStatus == 2));
        _;
    }

    modifier isBincentive() {
        require(
            (msg.sender == bincentiveHot) || (msg.sender == bincentiveCold)
        );
        _;
    }

    modifier isBincentiveCold() {
        require(msg.sender == bincentiveCold);
        _;
    }

    modifier isInvestor() {
        // bincentive is not investor
        require(msg.sender != bincentiveHot);
        require(msg.sender != bincentiveCold);
        require(rockInvestedAmount[msg.sender] > 0);
        _;
    }

    // Getter Functions


    // Investor Deposit
    function deposit(address[] investors, uint256[] depositBTCAmounts) initialized isBincentive public {
        require(investors.length > 0, "Must has at least one investor");
        require(investors.length == depositBTCAmounts.length, "Input not of the same length");

        address investor;
        uint256 depositBTCAmount;
        for(uint i = 0; i < investors.length; i++) {
            investor = investors[i];
            depositBTCAmount = depositBTCAmounts[i];

            require((investor != bincentiveHot) && (investor != bincentiveCold));

            totalRockInvestedAmount = totalRockInvestedAmount.add(depositBTCAmount);
            if(rockInvestedAmount[investor] == 0) {
                rockInvestors.push(investor);
            }
            rockInvestedAmount[investor] = rockInvestedAmount[investor].add(depositBTCAmount);

            emit Deposit(investor, depositBTCAmount);
        }
    }

    // Start Investing
    function start(uint256 _BCNTLockAmount) initialized isBincentive public {
        // Transfer and lock BCNT into the contract
        require(BCNTToken.transferFrom(bincentiveCold, address(this), _BCNTLockAmount));
        BCNTLockAmount = _BCNTLockAmount;

        // Run it
        fundStatus = 4;
        emit StartFund(rockInvestors.length, totalRockInvestedAmount, BCNTLockAmount);
    }

    // NOTE: might consider changing to withdrawal pattern
    // Not Enough Fund
    function notEnoughFund() initialized isBincentive public {
        fundStatus = 2;
        emit AbortFund(rockInvestors.length, totalRockInvestedAmount);
    }

    // Investor quit and withdraw
    function midwayQuitByAdmin(address _investor) running isBincentive public {
        require(_investor != bincentiveHot && _investor != bincentiveCold);
        uint256 investor_amount = rockInvestedAmount[_investor];
        rockInvestedAmount[_investor] = 0;

        // Subtract total invest amount and transfer investor's share to `bincentiveCold`
        uint256 totalAmount = totalRockInvestedAmount;
        totalRockInvestedAmount = totalRockInvestedAmount.sub(investor_amount);
        rockInvestedAmount[bincentiveCold] = rockInvestedAmount[bincentiveCold].add(investor_amount);

        uint256 BCNTWithdrawAmount = BCNTLockAmount.mul(investor_amount).div(totalAmount);
        BCNTLockAmount = BCNTLockAmount.sub(BCNTWithdrawAmount);
        require(BCNTToken.transfer(_investor, BCNTWithdrawAmount));

        numMidwayQuitInvestors = numMidwayQuitInvestors.add(1);
        // Close the contract if every investor has quit
        if(numMidwayQuitInvestors == rockInvestors.length) {
            fundStatus = 6;
        }

        emit MidwayQuit(_investor, investor_amount, BCNTWithdrawAmount);
    }


    // Investor quit and withdraw
    function midwayQuit() running isInvestor public {
        uint256 investor_amount = rockInvestedAmount[msg.sender];
        rockInvestedAmount[msg.sender] = 0;

        // Subtract total invest amount and transfer investor's share to `bincentiveCold`
        uint256 totalAmount = totalRockInvestedAmount;
        totalRockInvestedAmount = totalRockInvestedAmount.sub(investor_amount);
        rockInvestedAmount[bincentiveCold] = rockInvestedAmount[bincentiveCold].add(investor_amount);

        uint256 BCNTWithdrawAmount = BCNTLockAmount.mul(investor_amount).div(totalAmount);
        BCNTLockAmount = BCNTLockAmount.sub(BCNTWithdrawAmount);
        require(BCNTToken.transfer(msg.sender, BCNTWithdrawAmount));

        numMidwayQuitInvestors = numMidwayQuitInvestors.add(1);
        // Close the contract if every investor has quit
        if(numMidwayQuitInvestors == rockInvestors.length) {
            fundStatus = 6;
        }

        emit MidwayQuit(msg.sender, investor_amount, BCNTWithdrawAmount);
    }

    // Return AUM
    function returnAUM(uint256 BTCAmount) running isBincentiveCold public {

        returnedBTCAmounts = BTCAmount;

        emit ReturnAUM(BTCAmount);

        fundStatus = 5;
    }

    // Distribute AUM
    function distributeAUM(uint256 numInvestorsToDistribute) stopped isBincentive public {
        require(numAUMDistributedInvestors.add(numInvestorsToDistribute) <= rockInvestors.length, "Distributing to more than total number of rockInvestors");

        uint256 totalBTCReturned = returnedBTCAmounts;
        // Count `bincentiveCold`'s share in total amount when distributing AUM
        uint256 totalAmount = totalRockInvestedAmount.add(rockInvestedAmount[bincentiveCold]);

        uint256 BTCDistributeAmount;
        address investor;
        uint256 investor_amount;
        // Distribute BTC to rockInvestors
        for(uint i = numAUMDistributedInvestors; i < (numAUMDistributedInvestors.add(numInvestorsToDistribute)); i++) {
            investor = rockInvestors[i];
            if(rockInvestedAmount[investor] == 0) continue;
            investor_amount = rockInvestedAmount[investor];
            rockInvestedAmount[investor] = 0;

            BTCDistributeAmount = totalBTCReturned.mul(investor_amount).div(totalAmount);

            emit DistributeAUM(investor, BTCDistributeAmount);
        }

        numAUMDistributedInvestors = numAUMDistributedInvestors.add(numInvestorsToDistribute);
        // If all rockInvestors have received AUM,
        // distribute AUM and return BCNT stake to `bincentiveCold` then close the fund.
        if(numAUMDistributedInvestors >= rockInvestors.length) {
            returnedBTCAmounts = 0;
            totalRockInvestedAmount = 0;
            // Distribute BTC and BCNT to `bincentiveCold`
            if(rockInvestedAmount[bincentiveCold] > 0) {
                investor_amount = rockInvestedAmount[bincentiveCold];
                rockInvestedAmount[bincentiveCold] = 0;

                BTCDistributeAmount = totalBTCReturned.mul(investor_amount).div(totalAmount);

                emit DistributeAUM(bincentiveCold, BTCDistributeAmount);
            }

            // Transfer the BCNT stake left back to `bincentiveCold`
            uint256 _BCNTLockAmount = BCNTLockAmount;
            BCNTLockAmount = 0;
            require(BCNTToken.transfer(bincentiveCold, _BCNTLockAmount));

            fundStatus = 6;
        }
    }

    // Constructor
    constructor(
        address _BCNTToken,
        address _bincentiveHot,
        address _bincentiveCold) public {

        BCNTToken = ERC20(_BCNTToken);
        bincentiveHot = _bincentiveHot;
        bincentiveCold = _bincentiveCold;

        // Initialized the contract
        fundStatus = 1;
    }
}
