/**
 *Submitted for verification at Etherscan.io on 2020-03-26
*/

pragma solidity ^0.6.0;

interface ListInterface {
    function accountID(address) external view returns (uint64);
}


contract InstaEvent {

    address public constant instaList = 0x4c8a1BEb8a87765788946D6B19C6C6355194AbEb;

    event LogEvent(uint64 connectorType, uint64 indexed connectorID, uint64 indexed accountID, bytes32 indexed eventCode, bytes eventData);

    function emitEvent(uint _connectorType, uint _connectorID, bytes32 _eventCode, bytes calldata _eventData) external {
        uint64 _ID = ListInterface(instaList).accountID(msg.sender);
        require(_ID != 0, "not-SA");
        emit LogEvent(uint64(_connectorType), uint64(_connectorID), _ID, _eventCode, _eventData);
    }

}