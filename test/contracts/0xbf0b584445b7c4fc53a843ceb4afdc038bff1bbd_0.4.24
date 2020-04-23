/**
 *Submitted for verification at Etherscan.io on 2020-02-18
*/

pragma solidity 0.4.24;

/**
 * @title AggregatorInterface represents the old Chainlink aggregator
 * contract's interface for obtaining the latest stored answer.
 */
interface AggregatorInterface {
  function currentAnswer() external view returns (int256);
}

/**
 * @title AggregatorProxy is a proxy between the old aggregator interface
 * and the new one. It is deployed once and requires no ownership.
 */
contract AggregatorProxy {
  AggregatorInterface public aggregator;

  /**
   * @param _aggregator The address of the aggregator contract
   */
  constructor(address _aggregator) public {
    aggregator = AggregatorInterface(_aggregator);
  }

  /**
   * @notice Converts latestAnswer() to currentAnswer()
   * @return The latest stored answer of the aggregator
   */
  function latestAnswer() external view returns (int256) {
    return aggregator.currentAnswer();
  }
}