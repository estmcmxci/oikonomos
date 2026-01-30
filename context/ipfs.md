# IPFS (InterPlanetary File System)

## Overview

The InterPlanetary File System (IPFS) is a peer-to-peer distributed file system that seeks to connect all computing devices with the same system of files. IPFS provides a high-throughput content-addressed block storage model, with content-addressed hyperlinks forming a generalized Merkle DAG.

From the original white paper by Juan Benet:
> "IPFS could be seen as a single BitTorrent swarm, exchanging objects within one Git repository... IPFS combines a distributed hashtable, an incentivized block exchange, and a self-certifying namespace. IPFS has no single point of failure, and nodes do not need to trust each other."

## Key Concepts

### Content Addressing

Instead of location-based addressing (URLs), IPFS uses content-based addressing via CIDs (Content Identifiers).

**CID Creation Process:**
1. Computing a cryptographic hash of the block's data
2. Combining that hash with codec information using multiformats:
   - **Multihash**: Information on the algorithm used to hash the data
   - **Multicodec**: Information on how to interpret the hashed data after it has been fetched
   - **Multibase**: Information on how the hashed data is encoded (only used in string representation)

### IPFS Subsystems

| Purpose | Subsystem |
|---------|-----------|
| Data representation | CIDs, IPLD, UnixFS, MFS, DAG-CBOR, DAG-JSON, CAR files |
| Content routing | Kademlia DHT, Delegated routing over HTTP, Bitswap, mDNS |
| Data transfer | Bitswap, HTTP Gateways, Sneakernet, Graphsync |
| Addressing | Multiformats |
| HTTP bridging | IPFS Gateways, Pinning API Spec |
| P2P connectivity | libp2p (TCP, QUIC, WebRTC, WebTransport) |
| Mutability/naming | IPNS (Interplanetary Naming System), DNSLink |

### Kademlia DHT

A decentralized hash table used by IPFS to find peers storing requested data:
- Stores information about which peers (IPs) have which data (CIDs)
- Uses libp2p for connectivity
- Efficient and self-organizing

### Bitswap

A message-based protocol for both content routing and data transfer:
- Enables direct CID requests between connected peers
- Supports wantlists for efficient data sharing
- Uses libp2p for connectivity

## Usage

### Adding Content
```bash
ipfs add myfile.txt
# Returns: QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy
```

### Retrieving Content
```bash
ipfs cat QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy
```

### IPFS Gateway URL
```
https://ipfs.io/ipfs/QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy
```

## IPNS (InterPlanetary Naming System)

IPNS provides mutable pointers to IPFS content, allowing you to update content while maintaining a consistent address.

## DNSLink

DNSLink allows you to map a DNS name to an IPFS address using TXT records:
```
_dnslink.example.com TXT "dnslink=/ipfs/QmXnny..."
```

## Resources

- [IPFS Documentation](https://docs.ipfs.tech/)
- [IPFS GitHub](https://github.com/ipfs)
- [Kubo (Go implementation)](https://github.com/ipfs/kubo)
- [Helia (JavaScript implementation)](https://github.com/ipfs/helia)
