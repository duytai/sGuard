/**
 *Submitted for verification at Etherscan.io on 2020-03-02
*/

pragma solidity >=0.6.0;
pragma experimental ABIEncoderV2;


contract UnstructuredStorage {
    function set_uint256(bytes32 pos, uint256 value) internal {
        // solium-disable-next-line
        assembly {
            sstore(pos, value)
        }
    }

    function get_uint256(bytes32 pos) internal view returns(uint256 value) {
        // solium-disable-next-line
        assembly {
            value:=sload(pos)
        }
    }

    function set_address(bytes32 pos, address value) internal {
        // solium-disable-next-line
        assembly {
            sstore(pos, value)
        }
    }

    function get_address(bytes32 pos) internal view returns(address value) {
        // solium-disable-next-line
        assembly {
            value:=sload(pos)
        }
    }


    function set_bool(bytes32 pos, bool value) internal {
        // solium-disable-next-line
        assembly {
            sstore(pos, value)
        }
    }

    function get_bool(bytes32 pos) internal view returns(bool value) {
        // solium-disable-next-line
        assembly {
            value:=sload(pos)
        }
    }

    function set_bytes32(bytes32 pos, bytes32 value) internal {
        // solium-disable-next-line
        assembly {
            sstore(pos, value)
        }
    }

    function get_bytes32(bytes32 pos) internal view returns(bytes32 value) {
        // solium-disable-next-line
        assembly {
            value:=sload(pos)
        }
    }


    function set_uint256(bytes32 pos, uint256 offset, uint256 value) internal {
        // solium-disable-next-line
        assembly {
            sstore(add(pos, offset), value)
        }
    }

    function get_uint256(bytes32 pos, uint256 offset) internal view returns(uint256 value) {
        // solium-disable-next-line
        assembly {
            value:=sload(add(pos, offset))
        }
    }

    function set_uint256_list(bytes32 pos, uint256[] memory list) internal {
        uint256 sz = list.length;
        set_uint256(pos, sz);
        for(uint256 i = 0; i<sz; i++) {
            set_uint256(pos, i+1, list[i]);
        }
    }

    function get_uint256_list(bytes32 pos) internal view returns (uint256[] memory list) {
        uint256 sz = get_uint256(pos);
        list = new uint256[](sz);
        for(uint256 i = 0; i < sz; i++) {
            list[i] = get_uint256(pos, i+1);
        }
    }
}



contract Proxy is UnstructuredStorage {
    bytes32 constant PTR_ADMIN = 0x5efc91c2d380347780169c7ab26c240567a20526b30a717ec31dd9612a38a828; // zeropool.proxy.admin
    bytes32 constant PTR_MAINTENANCE = 0xa28fd2c18c6d991da3007d79a4849662f0e1bbda92b900a933c69ba747eaad66; // zeropool.proxy.maintenance
    bytes32 constant PTR_IMPLEMENTATION = 0x3211d1e0eae510fb358ab4a50deb1494201412f1a5fc234fc4bf3430b8b4b768; // zeropool.proxy.implementation

    function set_admin(address value) internal {
        set_address(PTR_ADMIN, value);
    }

    function get_admin() internal view returns(address value) {
        value = get_address(PTR_ADMIN);
    }

    function set_maintenance(bool value) internal {
        set_bool(PTR_MAINTENANCE, value);
    }

    function get_maintenance() internal view returns(bool value) {
        value = get_bool(PTR_MAINTENANCE);
    }

    function set_implementation(address value) internal {
        set_address(PTR_IMPLEMENTATION, value);
    }

    function get_implementation() internal view returns(address value) {
        value = get_address(PTR_IMPLEMENTATION);
    }

    function admin() external view returns(address) {
        return get_admin();
    }

    function maintenance() external view returns(bool) {
        return get_maintenance();
    }

    function implementation() external view returns(address) {
        return get_implementation();
    }

    modifier onlyAdmin() {
        require(msg.sender == get_admin());
        _;
    }

    function hardfork(address new_impl, bytes calldata init_call) external onlyAdmin returns(bool) {
        set_implementation(new_impl);
        if (init_call.length>0) {

            assembly {
                let ptr := mload(0x40)
                let sz := calldatasize()
                calldatacopy(ptr, 0x64,sz)
                let result := delegatecall(gas(), new_impl, ptr, sub(sz, 0x64), 0, 0)
                let size := returndatasize()
                returndatacopy(ptr, 0, size)

                switch result
                case 0 { revert(ptr, size) }
                default { return(ptr, size) }
            }

        }
        return true;
    }

    function updateAdmin(address new_admin) external onlyAdmin returns(bool) {
        set_admin(new_admin);
        return true;
    }

    function publishRelease() external onlyAdmin returns(bool) {
        set_admin(address(0));
        set_maintenance(false);
        return true;
    }

    function released() external view returns(bool) {
        return get_admin() == address(0);
    }

    function setMaintenance(bool value) external onlyAdmin returns(bool) {
        set_maintenance(value);
        return true;
    }

    constructor() public {
        set_admin(msg.sender);
    }

    fallback() external payable {
        require(!get_maintenance() || msg.sender==get_admin(), "contract is under maintenance");
        address impl = get_implementation();
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            let result := delegatecall(gas(), impl, ptr, calldatasize(), 0, 0)
            let size := returndatasize()
            returndatacopy(ptr, 0, size)

            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }

}

contract MainnetProxy is Proxy {}