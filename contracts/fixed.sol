contract sGuard{
  bool internal locked = false;
  modifier nonReentrant() {
    require(!locked, "ReentrancyGuard: reentrant call");
    locked = true;
    _;
    locked = false;
  }
}
/// @notice Modified from DappHub (https://git.io/fpwrq)

pragma solidity 0.6.1;

abstract contract DSAuthority is sGuard {
    function canCall(
        address src, address dst, bytes4 sig
    ) public view virtual returns (bool);
}

contract DSAuthEvents is sGuard {
    event LogSetAuthority (address indexed authority);
    event LogSetOwner     (address indexed owner);
}

contract DSAuth is sGuard, DSAuthEvents {
    DSAuthority  public  authority;
    address      public  owner;

    constructor() public {
        owner = msg.sender;
        emit LogSetOwner(msg.sender);
    }

    function setOwner(address owner_)
        public
        auth
     nonReentrant() {
        owner = owner_;
        emit LogSetOwner(owner);
    }

    function setAuthority(DSAuthority authority_)
        public
        auth
    {
        authority = authority_;
        emit LogSetAuthority(address(authority));
    }

    modifier auth {
        require(isAuthorized(msg.sender, msg.sig), "ds-auth-unauthorized");
        _;
    }

    function isAuthorized(address src, bytes4 sig) internal view returns (bool) {
        if (src == address(this)) {
            return true;
        } else if (src == owner) {
            return true;
        } else if (authority == DSAuthority(0)) {
            return false;
        } else {
            locked = true;
            return authority.canCall(src, address(this), sig);
            locked = false;
        }
    }
}
