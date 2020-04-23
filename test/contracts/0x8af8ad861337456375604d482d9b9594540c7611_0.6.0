/**
 *Submitted for verification at Etherscan.io on 2020-03-22
*/

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

interface ManagerLike {
    function ilks(uint) external view returns (bytes32);
    function owns(uint) external view returns (address);
    function urns(uint) external view returns (address);
    function vat() external view returns (address);
}

interface CdpsLike {
    function getCdpsAsc(address, address) external view returns (uint[] memory, address[] memory, bytes32[] memory);
}

interface VatLike {
    function ilks(bytes32) external view returns (uint, uint, uint, uint, uint);
    function dai(address) external view returns (uint);
    function urns(bytes32, address) external view returns (uint, uint);
    function gem(bytes32, address) external view returns (uint);
}

interface JugLike {
    function ilks(bytes32) external view returns (uint, uint);
    function base() external view returns (uint);
}

interface PotLike {
    function dsr() external view returns (uint);
    function pie(address) external view returns (uint);
    function chi() external view returns (uint);
}

interface SpotLike {
    function ilks(bytes32) external view returns (PipLike, uint);
}

interface PipLike {
    function peek() external view returns (bytes32, bool);
}

interface InstaMcdAddress {
    function manager() external view returns (address);
    function vat() external view returns (address);
    function jug() external view returns (address);
    function spot() external view returns (address);
    function pot() external view returns (address);
    function getCdps() external view returns (address);
}


contract DSMath {

    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, "math-not-safe");
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        z = x - y <= x ? x - y : 0;
    }

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, "math-not-safe");
    }

    uint constant WAD = 10 ** 18;
    uint constant RAY = 10 ** 27;

    function rmul(uint x, uint y) internal pure returns (uint z) {
        z = add(mul(x, y), RAY / 2) / RAY;
    }

    function wmul(uint x, uint y) internal pure returns (uint z) {
        z = add(mul(x, y), WAD / 2) / WAD;
    }

    function rdiv(uint x, uint y) internal pure returns (uint z) {
        z = add(mul(x, RAY), y / 2) / y;
    }

    function wdiv(uint x, uint y) internal pure returns (uint z) {
        z = add(mul(x, WAD), y / 2) / y;
    }

}


contract Helpers is DSMath {
    /**
     * @dev get MakerDAO MCD Address contract
     */
    function getMcdAddresses() public pure returns (address) {
        return 0xF23196DF1C440345DE07feFbe556a5eF0dcD29F0;
    }

    struct VaultData {
        uint id;
        address owner;
        bytes32 ilk;
        uint collateral;
        uint art;
        uint debt;
        uint liquidatedCol;
        uint stabiltyRate;
        uint price;
        uint liquidationRatio;
        address urn;
    }

    struct IlkData {
        uint fee;
        uint price;
        uint ratio;
    }
}


contract Resolver is Helpers {
    function getVaultsByAddress(address owner) external view returns (VaultData[] memory) {
        address manager = InstaMcdAddress(getMcdAddresses()).manager();

        (uint[] memory ids, address[] memory urns, bytes32[] memory ilks) = CdpsLike(InstaMcdAddress(getMcdAddresses()).getCdps()).getCdpsAsc(manager, owner);
        VaultData[] memory vaults = new VaultData[](ids.length);

        for (uint i = 0; i < ids.length; i++) {
            (uint ink, uint art) = VatLike(ManagerLike(manager).vat()).urns(ilks[i], urns[i]);
            (,uint rate, uint priceMargin,,) = VatLike(ManagerLike(manager).vat()).ilks(ilks[i]);
            uint mat = getIlkRatio(ilks[i]);
            uint price = rmul(priceMargin, mat);

            vaults[i] = VaultData(
                ids[i],
                owner,
                ilks[i],
                ink,
                art,
                rmul(art,rate),
                VatLike(ManagerLike(manager).vat()).gem(ilks[i], urns[i]),
                getFee(ilks[i]),
                price,
                mat,
                urns[i]
            );
        }
        return vaults;
    }

    function getVaultById(uint id) external view returns (VaultData memory) {
        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        address urn = ManagerLike(manager).urns(id);
        bytes32 ilk = ManagerLike(manager).ilks(id);
        address owner = ManagerLike(manager).owns(id);

        (uint ink, uint art) = VatLike(ManagerLike(manager).vat()).urns(ilk, urn);
        (,uint rate, uint priceMargin,,) = VatLike(ManagerLike(manager).vat()).ilks(ilk);

        uint mat = getIlkRatio(ilk);
        uint price = rmul(priceMargin, mat);

        uint feeRate = getFee(ilk);
        VaultData memory vault = VaultData(
            id,
            owner,
            ilk,
            ink,
            art,
            rmul(art,rate),
            VatLike(ManagerLike(manager).vat()).gem(ilk, urn),
            feeRate,
            price,
            mat,
            urn
        );
        return vault;
    }

    function getIlkData(bytes32[] memory ilks) public view returns (IlkData[] memory) {
        IlkData[] memory ilkData = new IlkData[](ilks.length);

        for (uint i = 0; i < ilks.length; i++) {
            ilkData[i] = IlkData(
                getFee(ilks[i]),
                getIlkPrice(ilks[i]),
                getIlkRatio(ilks[i])
            );
        }
        return ilkData;
    }

    function getFee(bytes32 ilk) public view returns (uint fee) {
        address jug = InstaMcdAddress(getMcdAddresses()).jug();
        (uint duty,) = JugLike(jug).ilks(ilk);
        uint base = JugLike(jug).base();
        fee = add(duty, base);
    }

    function getIlkPrice(bytes32 ilk) public view returns (uint price) {
        address spot = InstaMcdAddress(getMcdAddresses()).spot();
        address vat = InstaMcdAddress(getMcdAddresses()).vat();
        (, uint mat) = SpotLike(spot).ilks(ilk);
        (,,uint spotPrice,,) = VatLike(vat).ilks(ilk);
        price = rmul(mat, spotPrice);
    }

    function getIlkRatio(bytes32 ilk) public view returns (uint ratio) {
        address spot = InstaMcdAddress(getMcdAddresses()).spot();
        (, ratio) = SpotLike(spot).ilks(ilk);
    }
}


contract DsrResolver is Resolver {
    function getDsrRate() external view returns (uint dsr) {
        address pot = InstaMcdAddress(getMcdAddresses()).pot();
        dsr = PotLike(pot).dsr();
    }

    function getDaiDeposited(address owner) external view returns (uint amt) {
        address pot = InstaMcdAddress(getMcdAddresses()).pot();
        uint chi = PotLike(pot).chi();
        uint pie = PotLike(pot).pie(owner);
        amt = rmul(pie,chi);
    }
}


contract InstaMakerMcdResolver is DsrResolver {
    string public constant name = "Maker-MCD-Resolver-v1";
}