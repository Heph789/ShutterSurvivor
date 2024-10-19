// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Survivor is AccessControl {

    enum AddressStatus {INELIGIBLE, READY, VOTED, ELIMINATED}

    struct Game {
        address[] addresses;
        bytes32[] roundCommits;
        mapping(address => AddressStatus) addressStatuses;
        mapping(address => uint8) eliminationVotes;
        uint256 nextRoundEnd;
    }

    mapping(bytes32 => Game) public activeGames;
    event GameCreated(bytes32 indexed id, uint8 num_addresses);
    event VoteCast(bytes32 indexed gameId, address caster, bytes32 commitment);

    // note: make sure to store addresses in a sorted order
    function createGame(string calldata name, address[] memory addresses) external {
        bytes32 id = keccak256(abi.encodePacked(name));
        activeGames[id].addresses = addresses;
        activeGames[id].nextRoundEnd = 0;
        for (uint i = 0; i < addresses.length; i++) {
            activeGames[id].addressStatuses[addresses[i]] = AddressStatus.READY;
        }
        // activeGames[id] = Game(addresses, new bytes32[](0), new mapping(address => bool), 0);
        _grantRole(id, msg.sender); // game admin
        emit GameCreated(id, uint8(addresses.length));
    }

    function startRound(bytes32 gameId, uint256 endTime) external onlyRole(gameId) {
        require(activeGames[gameId].nextRoundEnd != 0, "Round already in progress");
        activeGames[gameId].nextRoundEnd = endTime;
    }

    function voteInRound(bytes32 gameId, bytes32 commitment) external {
        require(activeGames[gameId].addressStatuses[msg.sender] == AddressStatus.READY, "Address is either ineligible, eliminated, or already voted");
        require(block.timestamp < activeGames[gameId].nextRoundEnd, "Cannot vote past round end!");
        activeGames[gameId].roundCommits.push(commitment);
        activeGames[gameId].addressStatuses[msg.sender] = AddressStatus.VOTED;
        emit VoteCast(gameId, msg.sender, commitment);
    }

    // I'm not actually sure what structure is best for sigs
    // Ideally, here is where you would get the revealed commitments on chain to get the sigs, and all you would have to pass are the addresses
    function removeAddress(bytes32 gameId, bytes32[] calldata sigs, address[] calldata addresses, address[] calldata votes) external onlyRole(gameId) {
        require(sigs.length == addresses.length && sigs.length == activeGames[gameId].roundCommits.length && sigs.length == votes.length, "Lengths don't match");
        address toEliminate = addresses[0];
        uint8 threshold = 0;
        for (uint i = 0; i < sigs.length; i++) {
            require(_verifySig(sigs[i], addresses[i], keccak256(abi.encodePacked(votes[i]))), "Invalid signature");
            activeGames[gameId].eliminationVotes[votes[i]] += 1;
            if (activeGames[gameId].eliminationVotes[votes[i]] > threshold) {
                toEliminate = votes[i];
            }
        }
    }

    function _verifySig(bytes32 sig, address add, bytes32 dataHash) internal pure returns(bool) {

    }
}
