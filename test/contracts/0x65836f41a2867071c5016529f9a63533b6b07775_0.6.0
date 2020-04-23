/**
 *Submitted for verification at Etherscan.io on 2020-03-02
*/

pragma solidity >=0.6.0;
pragma experimental ABIEncoderV2;


interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


library AbstractERC20 {

    function abstractReceive(IERC20 token, uint256 amount) internal returns(uint256) {
        if (token == IERC20(0)) {
            require(msg.value == amount);
            return amount;
        } else {
            uint256 balance = abstractBalanceOf(token, address(this));
            token.transferFrom(msg.sender, address(this), amount);
            uint256 cmp_amount = abstractBalanceOf(token, address(this)) - balance;
            require(cmp_amount != 0);
            return cmp_amount;
        }
    }

    function abstractTransfer(IERC20 token, address to, uint256 amount) internal returns(uint256) {
        if (token == IERC20(0)) {
            payable(to).transfer(amount);
            return amount;
        } else {
            uint256 balance = abstractBalanceOf(token, address(this));
            token.transfer(to, amount);
            uint256 cmp_amount = balance - abstractBalanceOf(token, address(this));
            require(cmp_amount != 0);
            return cmp_amount;
        }
    }

    function abstractBalanceOf(IERC20 token, address who) internal view returns (uint256) {
        if (token == IERC20(0)) {
            return who.balance;
        } else {
            return token.balanceOf(who);
        }
    }
}


library Groth16Verifier {
  uint constant q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
  uint constant r = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

  struct G1Point {
    uint X;
    uint Y;
  }
  // Encoding of field elements is: X[0] * z + X[1]
  struct G2Point {
    uint[2] X;
    uint[2] Y;
  }

  /// @return the sum of two points of G1
  function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory) {
    G1Point memory t;
    uint[4] memory input;
    input[0] = p1.X;
    input[1] = p1.Y;
    input[2] = p2.X;
    input[3] = p2.Y;
    bool success;
    /* solium-disable-next-line */
    assembly {
      success := staticcall(sub(gas(), 2000), 6, input, 0xc0, t, 0x60)
      // Use "invalid" to make gas estimation work
      switch success case 0 { invalid() }
    }
    require(success);
    return t;
  }

  /// @return the product of a point on G1 and a scalar, i.e.
  /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
  function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory) {
    if(s==0) return G1Point(0,0);
    if(s==1) return p;
    G1Point memory t;
    uint[3] memory input;
    input[0] = p.X;
    input[1] = p.Y;
    input[2] = s;
    bool success;
    /* solium-disable-next-line */
    assembly {
      success := staticcall(sub(gas(), 2000), 7, input, 0x80, t, 0x60)
      // Use "invalid" to make gas estimation work
      switch success case 0 { invalid() }
    }
    require (success);
    return t;
  }


  function verify(uint[] memory input, uint[8] memory proof, uint[] memory vk) internal view returns (bool) {
    uint nsignals = (vk.length-16)/2;
    require((nsignals>0) && (input.length == nsignals) && (proof.length == 8) && (vk.length == 16 + 2*nsignals));

    for(uint i=0; i<input.length; i++)
      require(input[i]<r);


    uint[] memory p_input = new uint[](24);

    p_input[0] = proof[0];
    p_input[1] = q-(proof[1]%q);  //proof.A negation
    p_input[2] = proof[2];
    p_input[3] = proof[3];
    p_input[4] = proof[4];
    p_input[5] = proof[5];

    // alpha1 computation
    p_input[6] = vk[0];     //vk.alfa1 == G1Point(vk[0], vk[1])
    p_input[7] = vk[1];


    p_input[8] = vk[2];
    p_input[9] = vk[3];
    p_input[10] = vk[4];
    p_input[11] = vk[5];

    //vk_x computation
    G1Point memory t = G1Point(vk[14], vk[15]);  //vk.IC[0] == G1Point(vk[14], vk[15])
    for(uint j = 0; j < nsignals; j++)
      t = addition(t, scalar_mul(G1Point(vk[16+2*j], vk[17+2*j]), input[j]));  //vk.IC[j + 1] == G1Point(vk[16+2*j], vk[17+2*j])

    p_input[12] = t.X;
    p_input[13] = t.Y;

    p_input[14] = vk[6];
    p_input[15] = vk[7];
    p_input[16] = vk[8];
    p_input[17] = vk[9];

    //C computation
    p_input[18] = proof[6];   //proof.C == G1Point(proof[6], proof[7])
    p_input[19] = proof[7];

    p_input[20] = vk[10];
    p_input[21] = vk[11];
    p_input[22] = vk[12];
    p_input[23] = vk[13];


    uint[1] memory out;
    bool success;
    // solium-disable-next-line 
    assembly {
      success := staticcall(sub(gas(), 2000), 8, add(p_input, 0x20), 768, out, 0x20)
      // Use "invalid" to make gas estimation work
      switch success case 0 { invalid() }
    }

    require(success);
    return out[0] != 0;
  }

}



library MerkleProof {
    function keccak256MerkleProof(
        bytes32[8] memory proof,
        uint256 path,
        bytes32 leaf
    ) internal pure returns (bytes32) {
        bytes32 root = leaf;
        for (uint256 i = 0; i < 8; i++) {
            root = (path >> i) & 1 == 0
                ? keccak256(abi.encode(leaf, proof[i]))
                : keccak256(abi.encode(proof[i], leaf));
        }
        return root;
    }

    //compute merkle tree for up to 256 leaves
    function keccak256MerkleTree(bytes32[] memory buff)
        internal
        pure
        returns (bytes32)
    {
        uint256 buffsz = buff.length;
        bytes32 last_tx = buff[buffsz - 1];
        for (uint8 level = 1; level < 8; level++) {
            bool buffparity = (buffsz & 1 == 0);
            buffsz = (buffsz >> 1) + (buffsz & 1);

            for (uint256 i = 0; i < buffsz - 1; i++) {
                buff[i] = keccak256(abi.encode(buff[2 * i], buff[2 * i + 1]));
            }
            buff[buffsz - 1] = buffparity
                ? keccak256(
                    abi.encode(buff[2 * buffsz - 2], buff[2 * buffsz - 1])
                )
                : keccak256(abi.encode(buff[2 * buffsz - 2], last_tx));
            last_tx = keccak256(abi.encode(last_tx, last_tx));
        }
        return buff[0];
    }
}



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



contract OptimisticRollup is UnstructuredStorage {
    struct Message {
        uint256[4] data;
    }

    struct TxExternalFields {
        address owner;
        Message[2] message;
    }

    struct Proof {
        uint256[8] data;
    }

    struct VK {
        uint256[] data;
    }

    struct Tx {
        uint256 rootptr;
        uint256[2] nullifier;
        uint256[2] utxo;
        IERC20 token;
        uint256 delta;
        TxExternalFields ext;
        Proof proof;
    }

    struct BlockItem {
        Tx ctx;
        uint256 new_root;
        uint256 deposit_blocknumber;
    }
    struct BlockItemNote {
        bytes32[8] proof;
        uint256 id;
        BlockItem item;
    }

    struct UTXO {
        address owner;
        IERC20 token;
        uint256 amount;
    }

    struct PayNote {
        UTXO utxo;
        uint256 blocknumber;
        uint256 txhash;
    }

    bytes32 constant PTR_ROLLUP_BLOCK = 0xd790c52c075936677813beed5aa36e1fce5549c1b511bc0277a6ae4213ee93d8; // zeropool.instance.rollup_block
    bytes32 constant PTR_DEPOSIT_STATE = 0xc9bc9b91da46ecf8158f48c23ddba2c34e9b3dffbc3fcfd2362158d58383f80b; //zeropool.instance.deposit_state
    bytes32 constant PTR_WITHDRAW_STATE = 0x7ad39ce31882298a63a0da3c9e2d38db2b34986c4be4550da17577edc0078639; //zeropool.instance.withdraw_state

    bytes32 constant PTR_ROLLUP_TX_NUM = 0xeeb5c14c43ac322ae6567adef70b1c44e69fe064f5d4a67d8c5f0323c138f65e; //zeropool.instance.rollup_tx_num
    bytes32 constant PTR_ALIVE = 0x58feb0c2bb14ff08ed56817b2d673cf3457ba1799ad05b4e8739e57359eaecc8; //zeropool.instance.alive
    bytes32 constant PTR_TX_VK = 0x08cff3e7425cd7b0e33f669dbfb21a086687d7980e87676bf3641c97139fcfd3; //zeropool.instance.tx_vk
    bytes32 constant PTR_TREE_UPDATE_VK = 0xf0f9fc4bf95155a0eed7d21afd3dfd94fade350663e7e1beccf42b5109244d86; //zeropool.instance.tree_update_vk
    bytes32 constant PTR_VERSION = 0x0bf0574ec126ccd99fc2670d59004335a5c88189b4dc4c4736ba2c1eced3519c; //zeropool.instance.version
    bytes32 constant PTR_RELAYER = 0xa6c0702dad889760bc0a910159487cf57ece87c3aff39b866b8eaec3ef42f09b; //zeropool.instance.relayer

    function get_rollup_block(uint256 x) internal view returns(bytes32 value) {
        bytes32 pos = keccak256(abi.encodePacked(PTR_ROLLUP_BLOCK, x));
        value = get_bytes32(pos);
    }

    function set_rollup_block(uint256 x, bytes32 value) internal {
        bytes32 pos = keccak256(abi.encodePacked(PTR_ROLLUP_BLOCK, x));
        set_bytes32(pos, value);
    }

    function get_deposit_state(bytes32 x) internal view returns(uint256 value) {
        bytes32 pos = keccak256(abi.encodePacked(PTR_DEPOSIT_STATE, x));
        value = get_uint256(pos);
    }

    function set_deposit_state(bytes32 x, uint256 value) internal {
        bytes32 pos = keccak256(abi.encodePacked(PTR_DEPOSIT_STATE, x));
        set_uint256(pos, value);
    }



    function get_withdraw_state(bytes32 x) internal view returns(uint256 value) {
        bytes32 pos = keccak256(abi.encodePacked(PTR_WITHDRAW_STATE, x));
        value = get_uint256(pos);
    }

    function set_withdraw_state(bytes32 x, uint256 value) internal {
        bytes32 pos = keccak256(abi.encodePacked(PTR_WITHDRAW_STATE, x));
        set_uint256(pos, value);
    }



    function get_rollup_tx_num() internal view returns(uint256 value) {
        value = get_uint256(PTR_ROLLUP_TX_NUM);
    }

    function set_rollup_tx_num(uint256 value) internal {
        set_uint256(PTR_ROLLUP_TX_NUM, value);
    }

    function get_alive() internal view returns(bool value) {
        value = get_bool(PTR_ALIVE);
    }

    function set_alive(bool x) internal {
        set_bool(PTR_ALIVE, x);
    }

    function get_tx_vk() internal view virtual returns(VK memory vk) {
        vk.data = get_uint256_list(PTR_TX_VK);
    }

    function set_tx_vk(VK memory vk) internal {
        set_uint256_list(PTR_TX_VK, vk.data);
    }

    function get_tree_update_vk() internal view virtual returns(VK memory vk) {
        vk.data = get_uint256_list(PTR_TREE_UPDATE_VK);
    }

    function set_tree_update_vk(VK memory vk) internal {
        set_uint256_list(PTR_TREE_UPDATE_VK, vk.data);
    }

    function get_version() internal view returns(uint256 value) {
        value = get_uint256(PTR_VERSION);
    }

    function set_version(uint256 value) internal {
        set_uint256(PTR_VERSION, value);
    }

    function get_relayer() internal view returns(address value) {
        value = get_address(PTR_RELAYER);
    }

    function set_relayer(address value) internal {
        set_address(PTR_RELAYER, value);
    }


    modifier onlyInitialized(uint256 version) {
        require(get_version() == version, "contract should be initialized");
        _;
    }

    modifier onlyUninitialized(uint256 version) {
        require(get_version() < version, "contract should be uninitialized");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == get_relayer(), "This is relayer-only action");
        _;
    }

    modifier onlyAlive() {
        require(get_alive(), "Contract stopped");
        _;
    }


    function blockItemNoteVerify(BlockItemNote memory note)
        internal
        view
        returns (bool)
    {
        (bytes32 itemhash, ) = blockItemHash(note.item);
        return
            MerkleProof.keccak256MerkleProof(
                note.proof,
                note.id & 0xff,
                itemhash
            ) == get_rollup_block(note.id >> 8);
    }

    function blockItemNoteVerifyPair(
        BlockItemNote memory note0,
        BlockItemNote memory note1
    ) internal view returns (bool) {
        (bytes32 itemhash0,) = blockItemHash(note0.item);
        (bytes32 itemhash1,) = blockItemHash(note1.item);


        return
            MerkleProof.keccak256MerkleProof(
                note0.proof,
                note0.id & 0xff,
                itemhash0
            ) ==
            get_rollup_block(note0.id >> 8) &&
            MerkleProof.keccak256MerkleProof(
                note1.proof,
                note1.id & 0xff,
                itemhash1
            ) ==
            get_rollup_block(note1.id >> 8) &&
            itemhash0 != itemhash1;
    }

    function blockItemHash(BlockItem memory item)
        internal
        pure
        returns (bytes32 itemhash, bytes32 txhash)
    {
        txhash = keccak256(abi.encode(item.ctx));
        itemhash = keccak256(
            abi.encode(txhash, item.new_root, item.deposit_blocknumber)
        );
    }

    function groth16verify(
        VK memory vk,
        Proof memory proof,
        uint256[] memory inputs
    ) internal view returns (bool) {
        return Groth16Verifier.verify(vk.data, proof.data, inputs);
    }

}


contract Zeropool is OptimisticRollup {
    using AbstractERC20 for IERC20;

    uint256 constant DEPOSIT_EXISTS = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint256 constant DEPOSIT_EXPIRES_BLOCKS = 2;
    uint256 constant CHALLENGE_EXPIRES_BLOCKS = 10;
    uint256 constant BN254_ORDER = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant MAX_AMOUNT = 1766847064778384329583297500742918515827483896875618958121606201292619776;

    uint256 constant VERSION = 1;

    event Deposit();
    event DepositCancel();
    event NewBlockPack();
    event Withdraw();

    function rollup_block(uint x) external view returns(bytes32) {
        return get_rollup_block(x);
    }

    function deposit_state(bytes32 x) external view returns(uint256) {
        return get_deposit_state(x);
    }

    function withdraw_state(bytes32 x) external view returns(uint256) {
        return get_withdraw_state(x);
    }

    function rollup_tx_num() external view returns(uint256) {
        return get_rollup_tx_num();
    }

    function alive() external view returns(bool) {
        return get_alive();
    }

    function tx_vk() external view returns(VK memory) {
        return get_tx_vk();
    }

    function tree_update_vk() external view returns(VK memory) {
        return get_tree_update_vk();
    }

    function relayer() external view returns(address) {
        return get_relayer();
    }

    function initialized() external view returns(bool) {
        return get_version() < VERSION;
    }

    function version() external view returns(uint256) {
        return VERSION;
    }

    function challenge_expires_blocks() external view returns(uint256) {
        return CHALLENGE_EXPIRES_BLOCKS;
    }

    function deposit_expires_blocks() external view returns(uint256) {
        return DEPOSIT_EXPIRES_BLOCKS;
    }

    
    function init(address relayer) external onlyUninitialized(VERSION) {
        set_alive(true);
        set_relayer(relayer);
        set_version(VERSION);
    }


    function deposit(IERC20 token, uint256 amount, bytes32 txhash)
        public
        payable
        returns (bool)
    {
        uint256 _amount = token.abstractReceive(amount);
        bytes32 deposit_hash = keccak256(
            abi.encode(msg.sender, token, _amount, block.number, txhash)
        );
        set_deposit_state(deposit_hash, DEPOSIT_EXISTS);
        emit Deposit();
        return true;
    }

    function depositCancel(PayNote memory d) public returns (bool) {
        bytes32 deposit_hash = keccak256(abi.encode(d));
        require(get_deposit_state(deposit_hash) >= get_rollup_tx_num());
        require(d.blocknumber < block.number - DEPOSIT_EXPIRES_BLOCKS);
        set_deposit_state(deposit_hash, 0);
        d.utxo.token.abstractTransfer(d.utxo.owner, d.utxo.amount);
        emit DepositCancel();
        return true;
    }

    function withdraw(PayNote memory w) public returns (bool) {
        bytes32 withdraw_hash = keccak256(abi.encode(w));
        uint256 state = get_withdraw_state(withdraw_hash);
        require(state < get_rollup_tx_num() && state != 0);
        require(w.blocknumber < block.number - CHALLENGE_EXPIRES_BLOCKS);
        set_withdraw_state(withdraw_hash, 0);
        w.utxo.token.abstractTransfer(w.utxo.owner, w.utxo.amount);
        emit Withdraw();
        return true;
    }

    function publishBlock(
        uint256 protocol_version,
        BlockItem[] memory items,
        uint256 rollup_cur_block_num,
        uint256 blocknumber_expires
    ) public onlyRelayer onlyAlive returns (bool) {
        uint256 cur_rollup_tx_num = get_rollup_tx_num();

        require(rollup_cur_block_num == cur_rollup_tx_num >> 8, "wrong block number");
        require(protocol_version == get_version(), "wrong protocol version");
        require(block.number < blocknumber_expires, "blocknumber is already expires");
        uint256 nitems = items.length;
        require(nitems > 0 && nitems <= 256, "wrong number of items");
        bytes32[] memory hashes = new bytes32[](nitems); 
        for (uint256 i = 0; i < nitems; i++) {
            BlockItem memory item = items[i];
            bytes32 itemhash = keccak256(abi.encode(item));
            if (item.ctx.delta == 0) {
                require(item.deposit_blocknumber == 0, "deposit_blocknumber should be zero in transfer case");
                require(item.ctx.token == IERC20(0), "token should be zero in transfer case");
                require(item.ctx.ext.owner == address(0), "owner should be zero in tranfer case");
            } else if (item.ctx.delta < MAX_AMOUNT) {
                bytes32 txhash = keccak256(abi.encode(item.ctx));
                bytes32 deposit_hash = keccak256(
                    abi.encode(
                        item.ctx.ext.owner,
                        item.ctx.token,
                        item.ctx.delta,
                        item.deposit_blocknumber,
                        txhash
                    )
                );
                require(get_deposit_state(deposit_hash) == DEPOSIT_EXISTS, "unexisted deposit");
                set_deposit_state(deposit_hash, cur_rollup_tx_num + i);
            } else if (
                item.ctx.delta > BN254_ORDER - MAX_AMOUNT &&
                item.ctx.delta < BN254_ORDER
            ) {
                require(item.deposit_blocknumber == 0, "deposit blocknumber should be zero");
                bytes32 txhash = keccak256(abi.encode(item.ctx));
                bytes32 withdraw_hash = keccak256(
                    abi.encode(
                        item.ctx.ext.owner,
                        item.ctx.token,
                        BN254_ORDER - item.ctx.delta,
                        block.number,
                        txhash
                    )
                );
                require(get_withdraw_state(withdraw_hash) == 0, "withdrawal already published");
                set_withdraw_state(withdraw_hash, cur_rollup_tx_num + i);
            } else revert("wrong behavior");

            hashes[i] = itemhash;
        }
        set_rollup_block(cur_rollup_tx_num >> 8, MerkleProof.keccak256MerkleTree(hashes));
        set_rollup_tx_num(cur_rollup_tx_num+256);
        emit NewBlockPack();
        return true;
    }

    function stopRollup(uint256 lastvalid) internal returns (bool) {
        set_alive(false);
        if (get_rollup_tx_num() > lastvalid) set_rollup_tx_num(lastvalid);
    }

    function challengeTx(BlockItemNote memory cur, BlockItemNote memory base)
        public
        returns (bool)
    {
        require(blockItemNoteVerifyPair(cur, base));
        require(cur.item.ctx.rootptr == base.id);
        uint256[] memory inputs = new uint256[](8);
        inputs[0] = base.item.new_root;
        inputs[1] = cur.item.ctx.nullifier[0];
        inputs[2] = cur.item.ctx.nullifier[1];
        inputs[3] = cur.item.ctx.utxo[0];
        inputs[4] = cur.item.ctx.utxo[1];
        inputs[5] = uint256(address(cur.item.ctx.token));
        inputs[6] = cur.item.ctx.delta;
        inputs[7] = uint256(keccak256(abi.encode(cur.item.ctx.ext))) % BN254_ORDER;
        require(
            !groth16verify(get_tx_vk(), cur.item.ctx.proof, inputs) ||
                cur.item.ctx.rootptr >= cur.id
        );
        stopRollup(
            cur.id &
                0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00
        );
        return true;
    }

    function challengeUTXOTreeUpdate(
        BlockItemNote memory cur,
        BlockItemNote memory prev,
        uint256 right_root
    ) public returns (bool) {
        require(blockItemNoteVerifyPair(cur, prev));
        require(right_root != cur.item.new_root);
        require(cur.id == prev.id + 1);
        uint256[] memory inputs = new uint256[](5);
        inputs[0] = prev.item.new_root;
        inputs[1] = right_root;
        inputs[2] = cur.id;
        inputs[3] = cur.item.ctx.utxo[0];
        inputs[4] = cur.item.ctx.utxo[1];
        require(groth16verify(get_tree_update_vk(), cur.item.ctx.proof, inputs));
        stopRollup(
            cur.id &
                0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00
        );
        return true;
    }


    function challengeDoubleSpend(
        BlockItemNote memory cur,
        BlockItemNote memory prev
    ) public returns (bool) {
        require(blockItemNoteVerifyPair(cur, prev));
        require(cur.id > prev.id);
        require(
            cur.item.ctx.nullifier[0] == prev.item.ctx.nullifier[0] ||
                cur.item.ctx.nullifier[0] == prev.item.ctx.nullifier[1] ||
                cur.item.ctx.nullifier[1] == prev.item.ctx.nullifier[0] ||
                cur.item.ctx.nullifier[1] == prev.item.ctx.nullifier[1]
        );
        stopRollup(
            cur.id &
                0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00
        );
        return true;
    }

    function get_tx_vk() internal view override returns(VK memory vk) {
        vk.data = new uint256[](32);
        vk.data[0]=19083586676618588181241121022189148302115143846265274057634178515789425541522;
        vk.data[1]=81734682709379119351827372382537914395894451632304720162641755645366983798;
        vk.data[2]=16679280894448720904271619622322935704907133145325731398178004167577694529227;
        vk.data[3]=18903228601511502126689470199990445541001999715180404375185816963613836226871;
        vk.data[4]=13663046271244275377110314674352295289375922770501900119517982950566589877684;
        vk.data[5]=483564168571897182620192451626088133502163507143046326440329211112918462121;
        vk.data[6]=16559501001022932569082979771706263430444179087536500138963585085420349463423;
        vk.data[7]=9623523168201514583905748483990657180016245907539253075218220414153350351588;
        vk.data[8]=15229833583426402205040012031514697850254522821399893249033342086777726726387;
        vk.data[9]=470744398001273857874068942689229495046933554389747311037076260496752269445;
        vk.data[10]=7673153833418048608469768353079552808897009992555599048955952346794508568713;
        vk.data[11]=20379255055398732280007411055330162490556363195411029740820409749858706847271;
        vk.data[12]=14010980108123452341370355032177269282369172322265972028032623852596015548054;
        vk.data[13]=2010602694298321371261220080637523955877174725166197144793463796546935369505;
        vk.data[14]=11827331641970848249018791507060402639646550381469697186630320984054879658051;
        vk.data[15]=19932135227873747734819495633162631095088044686013642058128603008109991517122;
        vk.data[16]=546122717728821753109262933924329929044483964972534585973243989084670247618;
        vk.data[17]=19197882504173222291305676798186060802889772643656145364396607969858777473240;
        vk.data[18]=3079025494427420850726249161830635142714776092295867140934586860665303421073;
        vk.data[19]=1746154312538307698308659684236359377970307266169477233342774307494313734528;
        vk.data[20]=1750668962583592559453347582962590422049028854549021550631836347968156757666;
        vk.data[21]=2931884338830192964620366885212045740331032389508054587765082964515210137243;
        vk.data[22]=11609728864371463760676563597128352259642122426143489337585644580377141052931;
        vk.data[23]=1866277750873051808146539269994848083702239908128741416703314476768274967681;
        vk.data[24]=465030135085710467652667684166181145297022174953119695491126249786799875357;
        vk.data[25]=17668359420526036744621277058559131057906391358066238174656362416578048367407;
        vk.data[26]=3940679183641598670389691491834622231072482332882496391070085402176937010683;
        vk.data[27]=12694154800574632930051430635795823357916331205102627903153800201217894579182;
        vk.data[28]=12563334585418485878062402673132487192719820069663338406400779005058051755705;
        vk.data[29]=5209903608427988355675301381596891515874164017265170558927935483532854452720;
        vk.data[30]=4711050179634069730545115815176569247145595365948880376685610817304093187820;
        vk.data[31]=21460592003295140913387788532402788293301885890452135973712845209086748235272;

    }

    function get_tree_update_vk() internal view override returns(VK memory vk) {
        vk.data = new uint256[](26);
        vk.data[0]=9927341460547029852728753500861773344387749035454992176911679192877917614326;
        vk.data[1]=310328084359652166416267459817042255667278116507978414962149299352000101062;
        vk.data[2]=493386504816853366900876821815568508001070316137556861279567937498920001698;
        vk.data[3]=16050960967588593014951452003751705261313151560742102282632329345311357239925;
        vk.data[4]=18156825847965851663862032625267397386086907754120404739408152740543974835318;
        vk.data[5]=13176645693861093810865249899400529123699743741662616180305647975362184695600;
        vk.data[6]=3391499851638059043956782863656586962612506772240835221934169170634234404332;
        vk.data[7]=18268392206599546967104090708600896194600052410608389302726346605813459216009;
        vk.data[8]=9098516986151439176894052362065284716471176875021298523969161367191564971456;
        vk.data[9]=21885959143027836841302233615802174732603365104028875126092282165099265354414;
        vk.data[10]=7670129283807378608625935909491095310213110566554408388065601560701095056703;
        vk.data[11]=7130671474784991141182176526112718975966743466548387852301799633388110224168;
        vk.data[12]=7937204630097084792238930540546978973700729757604694893164413509926070951259;
        vk.data[13]=8407545396818988186449632509683943447654086022799995289006209791993391255704;
        vk.data[14]=14664733377421451839490066683507349204055901257585797506684042433113436019171;
        vk.data[15]=15840252407256494288533360651859793129109626723586685795424274635231317501541;
        vk.data[16]=8032564315529499388720047507429189045976255560471359137390391762122700869379;
        vk.data[17]=11808348160251057184662622624151545848292988533362288568600116898463819914493;
        vk.data[18]=17498019560129459819857213920026201288274979451999480899071607815743841786851;
        vk.data[19]=17384624495734085926685188734246885503312994753956080725596119437833880269858;
        vk.data[20]=1931156580513819053647675364989716628750838477923695514965816971171051219699;
        vk.data[21]=14867384809644522547574123774078983448833920647089298299288805612229559369381;
        vk.data[22]=9168948929820716748276018995954887992460226156428826222193421889623724755643;
        vk.data[23]=18179132919376470282821059367416443269176558413791609646146920482342253978853;
        vk.data[24]=13165221823254245976824310993558969475591080705095640808847370569633878849829;
        vk.data[25]=9543821152288846320507592056661134387108520634609559855537650326371475631556;

    }


}