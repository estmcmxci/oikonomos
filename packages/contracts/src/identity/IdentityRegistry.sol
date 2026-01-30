// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title IdentityRegistry
/// @notice ERC-8004 compliant agent identity registry
/// @dev Each agent is represented as an ERC-721 NFT with associated metadata
contract IdentityRegistry is ERC721, EIP712 {
    using ECDSA for bytes32;

    /// @notice Agent registration data
    struct Agent {
        string agentURI;
        address agentWallet;
        uint256 registeredAt;
    }

    /// @notice Mapping from agent ID to agent data
    mapping(uint256 => Agent) public agents;

    /// @notice Counter for generating unique agent IDs
    uint256 public nextAgentId;

    /// @notice EIP-712 typehash for wallet updates
    bytes32 private constant WALLET_UPDATE_TYPEHASH =
        keccak256("WalletUpdate(uint256 agentId,address newWallet,uint256 nonce)");

    /// @notice Nonces for replay protection on wallet updates
    mapping(uint256 => uint256) public nonces;

    /// @notice Emitted when a new agent is registered
    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI);

    /// @notice Emitted when an agent's wallet is updated
    event AgentWalletUpdated(uint256 indexed agentId, address indexed oldWallet, address indexed newWallet);

    /// @notice Emitted when an agent's URI is updated
    event AgentURIUpdated(uint256 indexed agentId, string newURI);

    /// @notice Error thrown when agent does not exist
    error AgentDoesNotExist();

    /// @notice Error thrown when caller is not the owner
    error NotOwner();

    /// @notice Error thrown when signature is invalid
    error InvalidSignature();

    constructor() ERC721("Oikonomos Agent", "OIKO") EIP712("OikonomosIdentity", "1") {}

    /// @notice Register a new agent
    /// @param agentURI The URI pointing to agent metadata (IPFS, ENS, etc.)
    /// @param metadata Additional metadata (unused in v0, reserved for future)
    /// @return agentId The unique identifier for the registered agent
    function register(
        string calldata agentURI,
        bytes calldata metadata
    ) external returns (uint256 agentId) {
        // Silence unused parameter warning
        metadata;

        agentId = nextAgentId++;

        agents[agentId] = Agent({
            agentURI: agentURI,
            agentWallet: msg.sender,
            registeredAt: block.timestamp
        });

        _mint(msg.sender, agentId);

        emit AgentRegistered(agentId, msg.sender, agentURI);
    }

    /// @notice Update an agent's wallet address with signature verification
    /// @param agentId The agent ID to update
    /// @param newWallet The new wallet address
    /// @param signature EIP-712 signature from current wallet or NFT owner
    function updateAgentWallet(
        uint256 agentId,
        address newWallet,
        bytes calldata signature
    ) external {
        if (_ownerOf(agentId) == address(0)) revert AgentDoesNotExist();

        // Build EIP-712 digest
        bytes32 structHash = keccak256(abi.encode(
            WALLET_UPDATE_TYPEHASH,
            agentId,
            newWallet,
            nonces[agentId]++
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);

        // Verify signer is either current wallet or NFT owner
        if (signer != agents[agentId].agentWallet && signer != ownerOf(agentId)) {
            revert InvalidSignature();
        }

        address oldWallet = agents[agentId].agentWallet;
        agents[agentId].agentWallet = newWallet;

        emit AgentWalletUpdated(agentId, oldWallet, newWallet);
    }

    /// @notice Update an agent's URI (owner only)
    /// @param agentId The agent ID to update
    /// @param newURI The new URI
    function updateAgentURI(uint256 agentId, string calldata newURI) external {
        if (ownerOf(agentId) != msg.sender) revert NotOwner();
        agents[agentId].agentURI = newURI;
        emit AgentURIUpdated(agentId, newURI);
    }

    /// @notice Get the token URI for an agent
    /// @param tokenId The agent ID
    /// @return The agent's URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert AgentDoesNotExist();
        return agents[tokenId].agentURI;
    }

    /// @notice Get full agent data
    /// @param agentId The agent ID
    /// @return The agent struct
    function getAgent(uint256 agentId) external view returns (Agent memory) {
        if (_ownerOf(agentId) == address(0)) revert AgentDoesNotExist();
        return agents[agentId];
    }

    /// @notice Get the EIP-712 domain separator
    /// @return The domain separator
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
