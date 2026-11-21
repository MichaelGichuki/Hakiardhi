#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Haki Ardhi - Hyperledger Fabric Network Bring-Up Script
# ==============================================================================
# Automates:
#   1. Generating crypto material from crypto-config.yaml (via Docker fabric-tools)
#   2. Generating the haki-ardhi-channel genesis block from configtx.yaml
#   3. Starting the orderer, 4 peer nodes, and CLI container via Docker Compose
#   4. Joining the orderer to haki-ardhi-channel via osnadmin (Channel Participation API)
#   5. Joining all 4 peer organizations to haki-ardhi-channel
# ==============================================================================

CHANNEL_NAME="haki-ardhi-channel"
FABRIC_VERSION="2.5.16"
COMPOSE_FILE="docker-compose.yaml"

# Colors for readable output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ------------------------------------------------------------------------------
# Step 0: Pre-flight checks
# ------------------------------------------------------------------------------
check_prereqs() {
  info "Checking prerequisites..."
  command -v docker >/dev/null 2>&1 || error "Docker is not installed or not in PATH."
  docker info >/dev/null 2>&1 || error "Docker daemon is not running."

  [[ -f "config/crypto-config.yaml" ]] || error "crypto-config.yaml not found in current directory."
  [[ -f "config/configtx.yaml" ]]      || error "configtx.yaml not found in current directory."
  [[ -f "${COMPOSE_FILE}" ]]    || error "${COMPOSE_FILE} not found in current directory. Update COMPOSE_FILE if named differently."
}

# ------------------------------------------------------------------------------
# Step 1: Clean old artifacts (optional via './network.sh clean' or './network.sh restart')
# ------------------------------------------------------------------------------
clean_network() {
  warn "Tearing down containers, volumes, and generated artifacts..."
  if [[ -f "${COMPOSE_FILE}" ]]; then
    docker compose -f "${COMPOSE_FILE}" down --volumes --remove-orphans || true
  fi
  docker run --rm \
    -v "$(pwd):/workspace" \
    -w /workspace \
    "hyperledger/fabric-tools:${FABRIC_VERSION}" \
    rm -rf /workspace/organizations /workspace/channel-artifacts
  info "Cleanup complete."
}

# ------------------------------------------------------------------------------
# Step 2: Generate Crypto Material (cryptogen via Docker so no host binary needed)
# ------------------------------------------------------------------------------
generate_crypto() {
  info "Generating crypto material from crypto-config.yaml..."
  docker run --rm \
    -v "$(pwd):/workspace" \
    -w /workspace \
    "hyperledger/fabric-tools:${FABRIC_VERSION}" \
    rm -rf /workspace/organizations

  docker run --rm \
    -v "$(pwd):/workspace" \
    -w /workspace \
    "hyperledger/fabric-tools:${FABRIC_VERSION}" \
    cryptogen generate --config=./config/crypto-config.yaml --output=./organizations

  [[ -f "./organizations/ordererOrganizations/hakiardhi.local/orderers/orderer.hakiardhi.local/tls/server.crt" ]] \
    || error "Expected orderer TLS cert was not generated."

  info "Crypto material generated under ./organizations"
}

# ------------------------------------------------------------------------------
# Step 3: Generate Channel Genesis Block (configtxgen via Docker)
# ------------------------------------------------------------------------------
generate_channel_artifacts() {
  info "Generating genesis block for ${CHANNEL_NAME}..."
  mkdir -p channel-artifacts

  docker run --rm \
    -v "$(pwd):/workspace" \
    -w /workspace \
    -e FABRIC_CFG_PATH=/workspace/config \
    "hyperledger/fabric-tools:${FABRIC_VERSION}" \
    configtxgen -profile "${CHANNEL_NAME}" \
      -outputBlock "./channel-artifacts/${CHANNEL_NAME}.block" \
      -channelID "${CHANNEL_NAME}"

  [[ -f "./channel-artifacts/${CHANNEL_NAME}.block" ]] \
    || error "Failed to generate ./channel-artifacts/${CHANNEL_NAME}.block"

  info "Channel genesis block created at ./channel-artifacts/${CHANNEL_NAME}.block"
}
# ------------------------------------------------------------------------------
# Step 4: Start Docker Compose Services
# ------------------------------------------------------------------------------
start_containers() {
  info "Starting Hyperledger Fabric containers..."
  docker compose -f "${COMPOSE_FILE}" up -d

  info "Waiting 5 seconds for orderer and peers to initialize..."
  sleep 5
  docker compose -f "${COMPOSE_FILE}" ps
}

# ------------------------------------------------------------------------------
# Step 5: Join Orderer to Channel (Fabric v3 Channel Participation API)
# ------------------------------------------------------------------------------
join_orderer() {
  info "Joining orderer.hakiardhi.local to ${CHANNEL_NAME}..."

  ORDERER_TLS_DIR="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/hakiardhi.local/orderers/orderer.hakiardhi.local/tls"

  docker exec cli osnadmin channel join \
    --channelID "${CHANNEL_NAME}" \
    --config-block "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block" \
    -o orderer.hakiardhi.local:7053 \
    --ca-file "${ORDERER_TLS_DIR}/ca.crt" \
    --client-cert "${ORDERER_TLS_DIR}/server.crt" \
    --client-key "${ORDERER_TLS_DIR}/server.key"

  info "Orderer joined ${CHANNEL_NAME}."
}

# ------------------------------------------------------------------------------
# Step 6: Join All 4 Peers to Channel
# ------------------------------------------------------------------------------
join_peer() {
  local ORG_NAME="$1"
  local MSP_ID="$2"
  local DOMAIN="$3"

  info "Joining peer0.${DOMAIN} (${MSP_ID}) to ${CHANNEL_NAME}..."

  local BASE_ORG_DIR="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${DOMAIN}"

  docker exec \
    -e FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer \
    -e CORE_PEER_LOCALMSPID="${MSP_ID}" \
    -e CORE_PEER_ADDRESS="peer0.${DOMAIN}:7051" \
    -e CORE_PEER_TLS_ROOTCERT_FILE="${BASE_ORG_DIR}/peers/peer0.${DOMAIN}/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="${BASE_ORG_DIR}/users/Admin@${DOMAIN}/msp" \
    cli peer channel join \
      -b "/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block"
}

join_all_peers() {
  join_peer "LandOfficer"         "LandOfficerMSP"         "landofficer.hakiardhi.local"
  join_peer "VerificationOfficer" "VerificationOfficerMSP" "verificationofficer.hakiardhi.local"
  join_peer "Registrar"           "RegistrarMSP"           "registrar.hakiardhi.local"
  join_peer "LandOwner"           "LandOwnerMSP"           "landowner.hakiardhi.local"

  info "All 4 peers have joined ${CHANNEL_NAME}!"
}

# ------------------------------------------------------------------------------
# Command Router
# ------------------------------------------------------------------------------
MODE="${1:-up}"

case "${MODE}" in
  up)
    check_prereqs
    generate_crypto
    generate_channel_artifacts
    start_containers
    join_orderer
    join_all_peers
    info "Haki Ardhi network is up and running on ${CHANNEL_NAME}!"
    ;;
  clean|down)
    clean_network
    ;;
  restart)
    check_prereqs
    clean_network
    generate_crypto
    generate_channel_artifacts
    start_containers
    join_orderer
    join_all_peers
    info "Haki Ardhi network restarted cleanly!"
    ;;
  *)
    echo "Usage: $0 {up|down|clean|restart}"
    exit 1
    ;;
esac