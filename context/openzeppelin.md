# OpenZeppelin

## Overview

OpenZeppelin provides a complete suite of security products, including smart contract libraries, developer tools, and security audits, to help build and operate secure decentralized applications.

## OpenZeppelin Contracts

A library for secure smart contract development, offering community-vetted implementations of standards like ERC20 and ERC721.

### Installation

```bash
npm install @openzeppelin/contracts
```

### ERC20 Token

```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
```

### ERC721 NFT

```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    constructor() ERC721("MyNFT", "MNFT") {}
}
```

## ERC721 API Reference

### Core Functions

```solidity
constructor(string name_, string symbol_)
  // Initializes the contract with name and symbol

supportsInterface(bytes4 interfaceId) → bool
  // Check interface support (ERC-165)

balanceOf(address owner) → uint256
  // Returns the number of tokens owned by `owner`

ownerOf(uint256 tokenId) → address
  // Returns the owner of the `tokenId`

name() → string
  // Returns the token collection name

symbol() → string
  // Returns the token collection symbol

tokenURI(uint256 tokenId) → string
  // Returns the URI for `tokenId`
```

### Transfer Functions

```solidity
approve(address to, uint256 tokenId)
  // Gives permission to `to` to transfer `tokenId`

getApproved(uint256 tokenId) → address
  // Returns the account approved for `tokenId`

setApprovalForAll(address operator, bool approved)
  // Approve or remove `operator` for all tokens

isApprovedForAll(address owner, address operator) → bool
  // Check if `operator` is allowed to manage all of `owner`'s tokens

transferFrom(address from, address to, uint256 tokenId)
  // Transfers `tokenId` from `from` to `to`

safeTransferFrom(address from, address to, uint256 tokenId)
  // Safely transfers `tokenId` (checks receiver)

safeTransferFrom(address from, address to, uint256 tokenId, bytes data)
  // Safely transfers with additional data
```

### Events

```solidity
event Transfer(address from, address to, uint256 tokenId);
  // Emitted when a token is transferred

event Approval(address owner, address approved, uint256 tokenId);
  // Emitted when approval is set

event ApprovalForAll(address owner, address operator, bool approved);
  // Emitted when operator approval is set
```

### Errors (v5.x)

```solidity
ERC721InvalidOwner(address owner)
ERC721NonexistentToken(uint256 tokenId)
ERC721IncorrectOwner(address sender, uint256 tokenId, address owner)
ERC721InvalidSender(address sender)
ERC721InvalidReceiver(address receiver)
ERC721InsufficientApproval(address operator, uint256 tokenId)
ERC721InvalidApprover(address approver)
ERC721InvalidOperator(address operator)
```

## Access Control

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyContract is Ownable {
    function restrictedFunction() public onlyOwner {
        // Only owner can call
    }
}
```

## Upgradeable Contracts

OpenZeppelin provides upgradeable versions of all contracts:

```solidity
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
```

## Resources

- [OpenZeppelin Documentation](https://docs.openzeppelin.com/)
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [OpenZeppelin Upgrades](https://github.com/OpenZeppelin/openzeppelin-upgrades)
