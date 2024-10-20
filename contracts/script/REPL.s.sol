// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Verify is Script {

    event TryRecover(address add, ECDSA.RecoverError rec, bytes32 len);

    function _verifySig(bytes calldata sig, address add, address data) external pure returns (bool) {
        return ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(abi.encodePacked(data)), sig) == add;
    }

    function _easy() public pure returns (bool) {
        return true;
    }

    function _easyagain() public pure returns (bool) {
        return true == true;
    }

    function _verifySigAgain(uint8 v, bytes32 r, bytes32 s, address add, bytes32 dataHash) public {
        // console.log(sig.length);
        (address recovered, ECDSA.RecoverError err, bytes32 errArg) = ECDSA.tryRecover(MessageHashUtils.toEthSignedMessageHash(dataHash), v, r, s);
        emit TryRecover(recovered, err, errArg);
        require(recovered == add, "Does not match");
    }

    /// @notice REPL contract entry point
    function run() external {
        _verifySigAgain(28, hex'057123f1283a536bc6ab187f38aa5036aac18add1ede4a44ac9a6b3df5e1a1d6', hex'5d0584c7d18a7736aa66d045e2a3bcfcd23660882e070f5a42c8ad781a6bfa36', address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC), hex'1c_8a_ff_95_06_85_c2_ed_4b_c3_17_4f_34_72_28_7b_56_d9_51_7b_9c_94_81_27_31_9a_09_a7_a3_6d_ea_c8');
    }
}
