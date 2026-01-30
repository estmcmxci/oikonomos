// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IIdentityRegistry {
    struct Agent {
        string agentURI;
        address agentWallet;
        uint256 registeredAt;
    }

    function register(string calldata agentURI, bytes calldata metadata) external returns (uint256 agentId);
    function agents(uint256 agentId) external view returns (Agent memory);
    function updateAgentWallet(uint256 agentId, address newWallet, bytes calldata signature) external;
}
