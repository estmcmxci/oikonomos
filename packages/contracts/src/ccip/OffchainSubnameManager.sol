// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IENSRegistry {
    function setSubnodeRecord(bytes32 parentNode, bytes32 label, address owner, address resolver, uint64 ttl) external;
    function setOwner(bytes32 node, address owner) external;
}

interface IAddressResolver {
    function setAddr(bytes32 node, address addr) external;
}

interface ITextResolver {
    function setText(bytes32 node, string calldata key, string calldata value) external;
}

/// @title OffchainSubnameManager
/// @notice Manages subname registration under oikonomos.eth using CCIP-read for eligibility
/// @dev Adapted for Oikonomos agent registration with ERC-8004 support
contract OffchainSubnameManager {
    // ============ Errors ============

    /// @notice EIP-3668 error for offchain data lookup
    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);

    error Unauthorized();
    error InvalidSignature();
    error SubnameAlreadyRegistered();
    error RegistrationDenied();
    error RegistrySetSubnodeFailed();
    error ResolverSetAddrFailed();
    error ResolverSetTextFailed();
    error RegistryTransferFailed();
    error InvalidLabel();

    // ============ Events ============

    /// @notice Emitted when a subname is registered
    /// @param parentNode The namehash of the parent domain
    /// @param labelHash The keccak256 hash of the label
    /// @param label The human-readable label
    /// @param owner The address that owns the subname
    /// @param agentId The ERC-8004 agent ID associated with this subname
    /// @param expiry When the subname expires
    event SubnameRegistered(
        bytes32 indexed parentNode,
        bytes32 indexed labelHash,
        string label,
        address indexed owner,
        uint256 agentId,
        uint64 expiry
    );

    event GatewayURLsUpdated(string[] urls);
    event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event RegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event DefaultResolverUpdated(address indexed oldResolver, address indexed newResolver);

    // ============ State Variables ============

    address public owner;
    address public trustedSigner;
    address public ensRegistry;
    string[] public gatewayURLs;
    address public defaultResolver;
    uint64 public defaultTTL;

    /// @notice The ERC-8004 Identity Registry address for agent records
    address public identityRegistry;

    /// @notice Tracks registered subnames to prevent duplicates
    mapping(bytes32 => mapping(bytes32 => bool)) public isSubnameRegistered;

    /// @notice Stores subname details
    struct SubnameRecord {
        address owner;
        uint256 agentId;
        uint64 expiry;
        uint64 registeredAt;
    }

    mapping(bytes32 => mapping(bytes32 => SubnameRecord)) public subnameRecords;

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    // ============ Constructor ============

    /// @param _trustedSigner Address authorized to sign gateway responses
    /// @param _ensRegistry ENS Registry address (0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e on mainnet/sepolia)
    /// @param _gatewayURLs CCIP-read gateway URLs
    /// @param _defaultResolver Default resolver for subnames
    /// @param _defaultTTL Default TTL for subname records
    /// @param _identityRegistry ERC-8004 Identity Registry address
    constructor(
        address _trustedSigner,
        address _ensRegistry,
        string[] memory _gatewayURLs,
        address _defaultResolver,
        uint64 _defaultTTL,
        address _identityRegistry
    ) {
        owner = msg.sender;
        trustedSigner = _trustedSigner;
        ensRegistry = _ensRegistry;
        gatewayURLs = _gatewayURLs;
        defaultResolver = _defaultResolver;
        defaultTTL = _defaultTTL;
        identityRegistry = _identityRegistry;
    }

    // ============ Admin Functions ============

    function setTrustedSigner(address signer) external onlyOwner {
        address previous = trustedSigner;
        trustedSigner = signer;
        emit TrustedSignerUpdated(previous, signer);
    }

    function setGatewayURLs(string[] calldata urls) external onlyOwner {
        delete gatewayURLs;
        for (uint256 i = 0; i < urls.length; i++) {
            gatewayURLs.push(urls[i]);
        }
        emit GatewayURLsUpdated(urls);
    }

    function setENSRegistry(address registry) external onlyOwner {
        address previous = ensRegistry;
        ensRegistry = registry;
        emit RegistryUpdated(previous, registry);
    }

    function setDefaultResolver(address resolver) external onlyOwner {
        address previous = defaultResolver;
        defaultResolver = resolver;
        emit DefaultResolverUpdated(previous, resolver);
    }

    function setDefaultTTL(uint64 ttl) external onlyOwner {
        defaultTTL = ttl;
    }

    function setIdentityRegistry(address registry) external onlyOwner {
        identityRegistry = registry;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ============ Core CCIP-read Registration Function ============

    /// @notice Initiates subname registration with offchain eligibility check
    /// @dev This function never returns directly; it reverts with OffchainLookup
    /// @param parentNode The namehash of the parent domain (oikonomos.eth)
    /// @param label The subname label (e.g., "treasury" for "treasury.oikonomos.eth")
    /// @param subnameOwner The address that will own the subname
    /// @param agentId The ERC-8004 agent ID to associate with this subname
    /// @param desiredExpiry When the subname should expire (unix timestamp, 0 for no expiry)
    function registerSubname(
        bytes32 parentNode,
        string calldata label,
        address subnameOwner,
        uint256 agentId,
        uint64 desiredExpiry
    ) external view {
        // Validate label
        if (bytes(label).length < 3 || bytes(label).length > 32) revert InvalidLabel();

        // Calculate label hash
        bytes32 labelHash = keccak256(bytes(label));

        // Encode the request data for the gateway
        bytes memory callData = abi.encode(
            parentNode,
            label,
            labelHash,
            subnameOwner,
            agentId,
            desiredExpiry,
            msg.sender,
            block.chainid,
            address(this)
        );

        // Encode extra data for the callback
        bytes memory extraData = abi.encode(
            parentNode,
            label,
            labelHash,
            subnameOwner,
            agentId,
            desiredExpiry,
            msg.sender,
            block.chainid
        );

        // Revert with OffchainLookup to trigger CCIP-read
        revert OffchainLookup(address(this), gatewayURLs, callData, this.registerSubnameWithProof.selector, extraData);
    }

    // ============ CCIP-read Callback Function ============

    /// @notice Callback invoked by CCIP-read capable clients with gateway response
    /// @dev Validates signature and registers the subname if approved
    /// @param response The signed response from the gateway
    /// @param extraData The original request parameters
    function registerSubnameWithProof(bytes calldata response, bytes calldata extraData) external returns (bool) {
        // Decode the extra data
        (
            bytes32 parentNode,
            string memory label,
            bytes32 labelHash,
            address subnameOwner,
            uint256 agentId,
            , // desiredExpiry - unused in callback
            address requester,
            uint256 chainId
        ) = abi.decode(extraData, (bytes32, string, bytes32, address, uint256, uint64, address, uint256));

        // Verify chain ID matches
        require(chainId == block.chainid, "Chain ID mismatch");

        // Check if subname already registered
        if (isSubnameRegistered[parentNode][labelHash]) {
            revert SubnameAlreadyRegistered();
        }

        // Decode the response: (approved, expiry, signature)
        (bool approved, uint64 expiry, bytes memory signature) = abi.decode(response, (bool, uint64, bytes));

        // If not approved, revert
        if (!approved) {
            revert RegistrationDenied();
        }

        // Verify the signature from the trusted signer
        bytes32 messageHash = keccak256(
            abi.encode(parentNode, labelHash, subnameOwner, agentId, expiry, requester, chainId, address(this))
        );

        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        address recoveredSigner = recoverSigner(ethSignedMessageHash, signature);

        if (recoveredSigner != trustedSigner) {
            revert InvalidSignature();
        }

        // Mark as registered
        isSubnameRegistered[parentNode][labelHash] = true;

        // Store the record
        subnameRecords[parentNode][labelHash] = SubnameRecord({
            owner: subnameOwner,
            agentId: agentId,
            expiry: expiry,
            registeredAt: uint64(block.timestamp)
        });

        // Write to ENS registry and set records
        _setSubnodeOwnerAndRecords(parentNode, labelHash, subnameOwner, agentId);

        emit SubnameRegistered(parentNode, labelHash, label, subnameOwner, agentId, expiry);

        return true;
    }

    // ============ Internal Functions ============

    /// @notice Sets the subnode owner and configures ENS records
    /// @dev Writes owner, resolver, and text records to ENS
    function _setSubnodeOwnerAndRecords(
        bytes32 parentNode,
        bytes32 labelHash,
        address newOwner,
        uint256 agentId
    ) internal {
        bytes32 node = keccak256(abi.encodePacked(parentNode, labelHash));
        IENSRegistry registry = IENSRegistry(ensRegistry);

        // Set subnode record with this contract as temporary owner
        try registry.setSubnodeRecord(parentNode, labelHash, address(this), defaultResolver, defaultTTL) {}
        catch {
            revert RegistrySetSubnodeFailed();
        }

        if (defaultResolver != address(0)) {
            // Set address record
            try IAddressResolver(defaultResolver).setAddr(node, newOwner) {}
            catch {
                revert ResolverSetAddrFailed();
            }

            // Set agent:erc8004 text record
            string memory erc8004Value = _formatERC8004Record(agentId);
            try ITextResolver(defaultResolver).setText(node, "agent:erc8004", erc8004Value) {}
            catch {
                revert ResolverSetTextFailed();
            }
        }

        // Transfer ownership to the final subname owner
        try registry.setOwner(node, newOwner) {}
        catch {
            revert RegistryTransferFailed();
        }
    }

    /// @notice Formats the ERC-8004 record value
    /// @param agentId The agent ID
    /// @return The formatted ERC-8004 record string
    function _formatERC8004Record(uint256 agentId) internal view returns (string memory) {
        // Format: eip155:{chainId}:{registryAddress}:{agentId}
        return string(
            abi.encodePacked(
                "eip155:",
                _uint256ToString(block.chainid),
                ":",
                _addressToString(identityRegistry),
                ":",
                _uint256ToString(agentId)
            )
        );
    }

    /// @notice Converts a uint256 to its string representation
    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /// @notice Converts an address to its checksummed string representation
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(uint160(addr) >> (8 * (19 - i)) >> 4) & 0xf];
            str[3 + i * 2] = alphabet[uint8(uint160(addr) >> (8 * (19 - i))) & 0xf];
        }
        return string(str);
    }

    /// @notice Recovers the signer address from a signature
    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    // ============ View Functions ============

    /// @notice Check if a subname is registered
    function isRegistered(bytes32 parentNode, string calldata label) external view returns (bool) {
        bytes32 labelHash = keccak256(bytes(label));
        return isSubnameRegistered[parentNode][labelHash];
    }

    /// @notice Get subname record details
    function getSubnameRecord(bytes32 parentNode, string calldata label) external view returns (SubnameRecord memory) {
        bytes32 labelHash = keccak256(bytes(label));
        return subnameRecords[parentNode][labelHash];
    }

    /// @notice Returns the list of gateway URLs
    function getGatewayURLs() external view returns (string[] memory) {
        return gatewayURLs;
    }

    /// @notice EIP-165 interface support
    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return interfaceID == 0x01ffc9a7 // EIP-165
            || interfaceID == 0x2d430c77; // registerSubname selector
    }
}
