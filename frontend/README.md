# HakiArdhi Frontend Prototype

A React + TypeScript + Vite frontend mockup for a Kenyan national land administration and blockchain-based land record verification prototype.

## Requirements
- Node.js 18.18+ (Node 20+ recommended)
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

## Production build
```bash
npm run build
npm run preview
```

## Included screens
1. Role-based authentication (staff, citizen/National ID, public verification)
2. Staff command center
3. Parcel search and cryptographic confidence checklist
4. Four-stage transfer workflow
5. Landowner portal with confirm/reject actions
6. Interactive feature-phone USSD simulator
7. Database vs blockchain tamper detection simulation
8. Printable digital title certificate
9. Searchable immutable audit trail

## Demo data
All names, IDs, parcel references, transaction identifiers, ledger hashes, statuses and events are synthetic and for demonstration only.

## Important implementation note
This is a frontend-only prototype. It does **not** connect to Hyperledger Fabric, a database, an identity provider, an SMS/USSD aggregator or a production SHA-256 verification service. The tamper screen compares editable fields against a fixed in-browser reference. The USSD screen simulates a feature-phone menu. Authentication and workflow actions are demonstrations only.

For production, connect these screens to authenticated backend APIs. Keep sensitive personal information in the protected database and anchor only approved hashes and relevant workflow evidence on the permissioned blockchain. Enforce owner consent and registrar authorization on the server/chaincode; never rely on frontend checks as the security boundary.
