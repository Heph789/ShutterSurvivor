// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Survivor is AccessControl {

    struct Game {
        address[] addresses;
        bytes32[] roundCommits;
        uint256 nextRoundEnd;
    }

    mapping(bytes32 => Game) public activeGames;
    event GameCreated(bytes32 indexed id, uint8 num_addresses);

    // note: make sure to store addresses in a sorted order
    function createGame(string calldata name, address[] memory addresses) external {
        bytes32 id = keccak256(abi.encodePacked(name));
        activeGames[id] = Game(addresses, new bytes32[](0), 0);
        _grantRole(id, msg.sender); // game admin
        emit GameCreated(id, uint8(addresses.length));
    }

    function startRound(bytes32 gameId, uint256 endTime) external onlyRole(gameId) {
        require(activeGames[gameId].nextRoundEnd != 0, "Round already in progress");
        activeGames[gameId].nextRoundEnd = endTime;
    }
}
