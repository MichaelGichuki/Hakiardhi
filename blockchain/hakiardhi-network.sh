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

join_all_peers() {
  local base="/opt/gopath/src/github.com/hyperledger/fabric/peer"
  local block_file="${base}/channel-artifacts/${CHANNEL_NAME}.block"

  # Format: "<org_dir>|<msp_id>|<peer_host>|<peer_port>"
  local peers=(
    "landofficer.hakiardhi.local|LandOfficerMSP|peer0.landofficer.hakiardhi.local|7051"
    "verificationofficer.hakiardhi.local|VerificationOfficerMSP|peer0.verificationofficer.hakiardhi.local|8051"
    "registrar.hakiardhi.local|RegistrarMSP|peer0.registrar.hakiardhi.local|9051"
    "landowner.hakiardhi.local|LandOwnerMSP|peer0.landowner.hakiardhi.local|10051"
  )

  for entry in "${peers[@]}"; do
    IFS='|' read -r org_dir msp_id peer_host peer_port <<< "$entry"

    # Skip if this peer has already joined the channel
    local joined
    joined=$(docker exec \
      -e FABRIC_CFG_PATH="${base}" \
      -e CORE_PEER_TLS_ENABLED=true \
      -e CORE_PEER_LOCALMSPID="${msp_id}" \
      -e CORE_PEER_TLS_ROOTCERT_FILE="${base}/organizations/peerOrganizations/${org_dir}/peers/${peer_host}/tls/ca.crt" \
      -e CORE_PEER_MSPCONFIGPATH="${base}/organizations/peerOrganizations/${org_dir}/users/Admin@${org_dir}/msp" \
      -e CORE_PEER_ADDRESS="${peer_host}:${peer_port}" \
      cli peer channel list 2>/dev/null || true)

    if echo "$joined" | grep -qw "${CHANNEL_NAME}"; then
      echo "[INFO] ${peer_host} (${msp_id}) is already joined to ${CHANNEL_NAME}."
      continue
    fi

    echo "[INFO] Joining ${peer_host} (${msp_id}) to ${CHANNEL_NAME}..."
    docker exec \
      -e FABRIC_CFG_PATH="${base}" \
      -e CORE_PEER_TLS_ENABLED=true \
      -e CORE_PEER_LOCALMSPID="${msp_id}" \
      -e CORE_PEER_TLS_ROOTCERT_FILE="${base}/organizations/peerOrganizations/${org_dir}/peers/${peer_host}/tls/ca.crt" \
      -e CORE_PEER_MSPCONFIGPATH="${base}/organizations/peerOrganizations/${org_dir}/users/Admin@${org_dir}/msp" \
      -e CORE_PEER_ADDRESS="${peer_host}:${peer_port}" \
      cli peer channel join -b "${block_file}"
  done
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