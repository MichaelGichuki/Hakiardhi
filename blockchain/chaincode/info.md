How to add contract
cd config/
run peer lifecycle chaincode package landcontract.tar.gz --path ../chaincode --lang node --label landcontract1

export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_LOCALMSPID=LandOfficerMSP
export CORE_PEER_MSPCONFIGPATH=/home/ruel/Hakiardhi/blockchain/organizations/peerOrganizations/landofficer.hakiardhi.local/users/Admin@landofficer.hakiardhi.local/msp
export CORE_PEER_ADDRESS=peer0.landofficer.hakiardhi.local:7051

