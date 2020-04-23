/**
 *Submitted for verification at Etherscan.io on 2020-03-20
*/

pragma solidity ^0.6.0;

abstract contract IDaiBackstopSyndicateV {
  function enterAuction(uint256 auctionId) external virtual;
}

contract Syndicate {
  IDaiBackstopSyndicateV backstopSyndicate;

  constructor() public {
    backstopSyndicate = IDaiBackstopSyndicateV(0x00000000357646e36Fe575885Bb3e1A0772E64Cc);
  }

  function enter(uint256 id) public {
    backstopSyndicate.enterAuction(id);
  }
}