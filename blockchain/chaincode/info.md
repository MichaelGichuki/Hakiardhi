# Haki Ardhi — Hyperledger Fabric Network & Chaincode Guide

This document covers bringing up the **Haki Ardhi** Hyperledger Fabric network (`haki-ardhi-channel`), verifying all four organizations, packaging/deploying the TypeScript/Node.js `LandContract` chaincode (`hakiardhi`), and rolling out chaincode upgrades.

---

## 1. Network Topology & Endpoints

| Component | Hostname | Port(s) | MSP ID |
| :--- | :--- | :--- | :--- |
| **Orderer (gRPC)** | `orderer.hakiardhi.local` | `7050` | `OrdererMSP` |
| **Orderer (Admin)** | `orderer.hakiardhi.local` | `7053` | `OrdererMSP` |
| **Land Officer Peer** | `peer0.landofficer.hakiardhi.local` | `7051` | `LandOfficerMSP` |
| **Verification Officer Peer** | `peer0.verificationofficer.hakiardhi.local` | `8051` | `VerificationOfficerMSP` |
| **Registrar Peer** | `peer0.registrar.hakiardhi.local` | `9051` | `RegistrarMSP` |
| **Land Owner Peer** | `peer0.landowner.hakiardhi.local` | `10051` | `LandOwnerMSP` |

* **Channel Name:** `haki-ardhi-channel`
* **Chaincode Name:** `hakiardhi`
* **Chaincode Runtime:** `node` (`fabric-contract-api` + `fabric-chaincode-node`)

---

## 2. Initial Network Bring-Up & Verification

### Step 1: Start Containers & Join Peers to Channel
Use your network script to bring up the orderer, peers, CouchDB/state containers, and `cli`, and join all four peers to `haki-ardhi-channel`:

```bash
./hakiardhi-network.sh up

CC_VERSION=1.4 CC_SEQUENCE=7 CC_LANG=node CC_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode ./hakiardhi-chaincode.sh

