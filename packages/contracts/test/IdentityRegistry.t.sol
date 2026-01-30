// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../src/identity/IdentityRegistry.sol";

contract IdentityRegistryTest is Test {
    IdentityRegistry public registry;

    address public alice;
    uint256 public aliceKey;
    address public bob;
    uint256 public bobKey;

    function setUp() public {
        registry = new IdentityRegistry();

        (alice, aliceKey) = makeAddrAndKey("alice");
        (bob, bobKey) = makeAddrAndKey("bob");
    }

    function test_Register() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://QmTest", "");

        assertEq(agentId, 0, "First agent ID should be 0");
        assertEq(registry.ownerOf(0), alice, "Alice should own agent 0");

        IdentityRegistry.Agent memory agent = registry.getAgent(0);
        assertEq(agent.agentURI, "ipfs://QmTest", "Agent URI mismatch");
        assertEq(agent.agentWallet, alice, "Agent wallet should be alice");
        assertEq(agent.registeredAt, block.timestamp, "Registration timestamp mismatch");
    }

    function test_RegisterMultiple() public {
        vm.prank(alice);
        uint256 agentId1 = registry.register("ipfs://QmTest1", "");

        vm.prank(bob);
        uint256 agentId2 = registry.register("ipfs://QmTest2", "");

        assertEq(agentId1, 0, "First agent ID should be 0");
        assertEq(agentId2, 1, "Second agent ID should be 1");
        assertEq(registry.ownerOf(0), alice);
        assertEq(registry.ownerOf(1), bob);
    }

    function test_UpdateAgentURI() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://QmTest", "");

        vm.prank(alice);
        registry.updateAgentURI(agentId, "ipfs://QmUpdated");

        assertEq(registry.tokenURI(agentId), "ipfs://QmUpdated");
    }

    function test_UpdateAgentURI_RevertIfNotOwner() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://QmTest", "");

        vm.prank(bob);
        vm.expectRevert(IdentityRegistry.NotOwner.selector);
        registry.updateAgentURI(agentId, "ipfs://QmHacked");
    }

    function test_UpdateAgentWallet_WithOwnerSignature() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://QmTest", "");

        // Build signature from alice (NFT owner)
        bytes32 structHash = keccak256(abi.encode(
            keccak256("WalletUpdate(uint256 agentId,address newWallet,uint256 nonce)"),
            agentId,
            bob,
            0 // nonce
        ));
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            registry.DOMAIN_SEPARATOR(),
            structHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(aliceKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Update wallet
        registry.updateAgentWallet(agentId, bob, signature);

        IdentityRegistry.Agent memory agent = registry.getAgent(agentId);
        assertEq(agent.agentWallet, bob, "Wallet should be updated to bob");
    }

    function test_UpdateAgentWallet_RevertWithInvalidSignature() public {
        vm.prank(alice);
        uint256 agentId = registry.register("ipfs://QmTest", "");

        // Build invalid signature (from bob, not alice)
        bytes32 structHash = keccak256(abi.encode(
            keccak256("WalletUpdate(uint256 agentId,address newWallet,uint256 nonce)"),
            agentId,
            bob,
            0
        ));
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            registry.DOMAIN_SEPARATOR(),
            structHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(bobKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(IdentityRegistry.InvalidSignature.selector);
        registry.updateAgentWallet(agentId, bob, signature);
    }

    function test_GetAgent_RevertIfNotExists() public {
        vm.expectRevert(IdentityRegistry.AgentDoesNotExist.selector);
        registry.getAgent(999);
    }

    function test_TokenURI_RevertIfNotExists() public {
        vm.expectRevert(IdentityRegistry.AgentDoesNotExist.selector);
        registry.tokenURI(999);
    }

    function test_RegisterEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit IdentityRegistry.AgentRegistered(0, alice, "ipfs://QmTest");
        registry.register("ipfs://QmTest", "");
    }

    function test_NextAgentIdIncrementsCorrectly() public {
        assertEq(registry.nextAgentId(), 0);

        vm.prank(alice);
        registry.register("ipfs://QmTest1", "");
        assertEq(registry.nextAgentId(), 1);

        vm.prank(bob);
        registry.register("ipfs://QmTest2", "");
        assertEq(registry.nextAgentId(), 2);
    }
}
