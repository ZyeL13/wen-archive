// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WenArchive {
    event RecordWritten(
        address indexed writer,
        bytes32 indexed recordHash,
        uint256 timestamp
    );

    function write(bytes32 recordHash) external {
        emit RecordWritten(
            msg.sender,
            recordHash,
            block.timestamp
        );
    }
}
