/**
 *Submitted for verification at Etherscan.io on 2020-03-02
*/

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

// A Stateless Distributed Hypergraph for Web3

contract Graph3 {
    // 0: ()
    event Node(
        string indexed _id,
        string indexed _class,
        string indexed _subclass
    );
    
    // 1: {}
    event Prop(
        string indexed _id,
        string indexed _prop,
        string indexed _value
    );
    
    // 2: ->
    event Link(
        string indexed _from,
        string indexed _to,
        string indexed _class
    );

    event Batch(
        uint256[] _events,
        string[3][] _args,
        bytes32[] _sig
    );
    
    // Create a node or change class (drop with empty class)
    function node(string memory _id, string memory _class, string memory _subclass) public {
        emit Node(_id, _class, _subclass);
    }
    
    // Add a property to a node or a link (drop with empty prop/value)
    function prop(string memory _id, string memory _prop, string memory _value) public {
        emit Prop(_id, _prop, _value);
    }
    
    // Link nodes & links or change class (unlink with empty class)
    function link(string memory _from, string memory _to, string memory _class) public {
        emit Link(_from, _to, _class);
    }
    
    // Signed batch transaction [[...eventNumbers], [...[arg0, arg1, arg2]], [...keccak256([...eventNumbers, ...args])]]
    function batch(uint256[] memory _events, string[3][] memory _args, bytes32[] memory _sig) public {
        emit Batch(_events, _args, _sig);
    }
}