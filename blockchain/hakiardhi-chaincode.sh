#!/usr/bin/env bash
set -euo pipefail

CHANNEL_NAME="${CHANNEL_NAME:-haki-ardhi-channel}"
CC_NAME="${CC_NAME:-hakiardhi}"
CC_VERSION="${CC_VERSION:-1.0}"
CC_SEQUENCE="${CC_SEQUENCE:-1}"
CC_LANG="${CC_LANG:-node}"
CC_PATH="${CC_PATH:-/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode}"

BASE_DIR="/opt/gopath/src/github.com/hyperledger/fabric/peer"
ORDERER_ADDR="${ORDERER_ADDR:-orderer.hakiardhi.local:7050}"
ORDERER_CA="${BASE_DIR}/organizations/ordererOrganizations/hakiardhi.local/orderers/orderer.hakiardhi.local/tls/ca.crt"
PACKAGE_FILE="${CC_NAME}_${CC_VERSION}.tar.gz"

# Format: "<org_dir>|<msp_id>|<peer_host>|<peer_port>"
declare -A PEERS=(
  ["landofficer"]="landofficer.hakiardhi.local|LandOfficerMSP|peer0.landofficer.hakiardhi.local|7051"
  ["verificationofficer"]="verificationofficer.hakiardhi.local|VerificationOfficerMSP|peer0.verificationofficer.hakiardhi.local|8051"
  ["registrar"]="registrar.hakiardhi.local|RegistrarMSP|peer0.registrar.hakiardhi.local|9051"
  ["landowner"]="landowner.hakiardhi.local|LandOwnerMSP|peer0.landowner.hakiardhi.local|10051"
)

ORG_ORDER=("landofficer" "verificationofficer" "registrar" "landowner")

run_peer_cmd() {
  local key="$1"
  shift

  IFS='|' read -r org_dir msp_id peer_host peer_port <<< "${PEERS[$key]}"

  docker exec \
    -e FABRIC_CFG_PATH="${BASE_DIR}" \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_LOCALMSPID="${msp_id}" \
    -e CORE_PEER_TLS_ROOTCERT_FILE="${BASE_DIR}/organizations/peerOrganizations/${org_dir}/peers/${peer_host}/tls/ca.crt" \
    -e CORE_PEER_MSPCONFIGPATH="${BASE_DIR}/organizations/peerOrganizations/${org_dir}/users/Admin@${org_dir}/msp" \
    -e CORE_PEER_ADDRESS="${peer_host}:${peer_port}" \
    cli peer "$@"
}

get_package_id() {
  local installed_out
  installed_out=$(run_peer_cmd "landofficer" lifecycle chaincode queryinstalled)
  echo "$installed_out" | awk -F'Package ID: |, Label:' "/${CC_NAME}_${CC_VERSION}/{print \$2}" | head -n 1
}

package_chaincode() {
  echo "[INFO] Packaging chaincode '${CC_NAME}' (v${CC_VERSION}, lang=${CC_LANG}) from ${CC_PATH}..."
  docker exec \
    -e FABRIC_CFG_PATH="${BASE_DIR}" \
    cli peer lifecycle chaincode package "${PACKAGE_FILE}" \
    --path "${CC_PATH}" \
    --lang "${CC_LANG}" \
    --label "${CC_NAME}_${CC_VERSION}"
  echo "[OK] Packaged to ${BASE_DIR}/${PACKAGE_FILE} inside cli container."
}

install_chaincode() {
  for key in "${ORG_ORDER[@]}"; do
    IFS='|' read -r _ msp_id peer_host peer_port <<< "${PEERS[$key]}"
    echo "[INFO] Installing ${PACKAGE_FILE} on ${peer_host}:${peer_port} (${msp_id})..."
    run_peer_cmd "$key" lifecycle chaincode install "${PACKAGE_FILE}"
  done
  echo "[OK] Installed across all four peers."
}

approve_chaincode() {
  local pkg_id
  pkg_id=$(get_package_id)

  if [[ -z "$pkg_id" ]]; then
    echo "[ERROR] Could not find installed package ID for label '${CC_NAME}_${CC_VERSION}'. Run Install first." >&2
    return 1
  fi

  echo "[INFO] Using Package ID: ${pkg_id}"
  for key in "${ORG_ORDER[@]}"; do
    IFS='|' read -r _ msp_id peer_host peer_port <<< "${PEERS[$key]}"
    echo "[INFO] Approving chaincode for ${msp_id} via ${peer_host}:${peer_port}..."
    run_peer_cmd "$key" lifecycle chaincode approveformyorg \
      -o "${ORDERER_ADDR}" \
      --ordererTLSHostnameOverride orderer.hakiardhi.local \
      --tls \
      --cafile "${ORDERER_CA}" \
      --channelID "${CHANNEL_NAME}" \
      --name "${CC_NAME}" \
      --version "${CC_VERSION}" \
      --package-id "${pkg_id}" \
      --sequence "${CC_SEQUENCE}"
  done
  echo "[OK] Approved by all four organizations."
}

check_readiness() {
  echo "[INFO] Checking commit readiness on '${CHANNEL_NAME}' for '${CC_NAME}' (v${CC_VERSION}, seq=${CC_SEQUENCE})..."
  run_peer_cmd "landofficer" lifecycle chaincode checkcommitreadiness \
    --channelID "${CHANNEL_NAME}" \
    --name "${CC_NAME}" \
    --version "${CC_VERSION}" \
    --sequence "${CC_SEQUENCE}" \
    --output json
}

commit_chaincode() {
  local args=(
    lifecycle chaincode commit
    -o "${ORDERER_ADDR}"
    --ordererTLSHostnameOverride orderer.hakiardhi.local
    --tls
    --cafile "${ORDERER_CA}"
    --channelID "${CHANNEL_NAME}"
    --name "${CC_NAME}"
    --version "${CC_VERSION}"
    --sequence "${CC_SEQUENCE}"
  )

  for key in "${ORG_ORDER[@]}"; do
    IFS='|' read -r org_dir _ peer_host peer_port <<< "${PEERS[$key]}"
    args+=(
      --peerAddresses "${peer_host}:${peer_port}"
      --tlsRootCertFiles "${BASE_DIR}/organizations/peerOrganizations/${org_dir}/peers/${peer_host}/tls/ca.crt"
    )
  done

  echo "[INFO] Committing '${CC_NAME}' to '${CHANNEL_NAME}' across all four orgs..."
  run_peer_cmd "landofficer" "${args[@]}"
  echo "[OK] Chaincode committed."
}

query_committed() {
  echo "[INFO] Querying committed chaincodes on '${CHANNEL_NAME}'..."
  run_peer_cmd "landofficer" lifecycle chaincode querycommitted \
    --channelID "${CHANNEL_NAME}" \
    --name "${CC_NAME}"
}

run_all_steps() {
  package_chaincode
  install_chaincode
  approve_chaincode
  check_readiness
  commit_chaincode
  query_committed
}

configure_vars() {
  read -r -p "Chaincode name [${CC_NAME}]: " input; CC_NAME="${input:-$CC_NAME}"
  read -r -p "Version [${CC_VERSION}]: " input; CC_VERSION="${input:-$CC_VERSION}"
  read -r -p "Sequence [${CC_SEQUENCE}]: " input; CC_SEQUENCE="${input:-$CC_SEQUENCE}"
  read -r -p "Language (golang|node|ccaas) [${CC_LANG}]: " input; CC_LANG="${input:-$CC_LANG}"
  read -r -p "Chaincode path inside cli [${CC_PATH}]: " input; CC_PATH="${input:-$CC_PATH}"
  PACKAGE_FILE="${CC_NAME}_${CC_VERSION}.tar.gz"
  echo "[OK] Configuration updated."
}

show_menu() {
  cat <<EOF

====================================================
  Haki Ardhi Chaincode Lifecycle (${CHANNEL_NAME})
  Name: ${CC_NAME} | Ver: ${CC_VERSION} | Seq: ${CC_SEQUENCE} | Lang: ${CC_LANG}
====================================================
  1) Package chaincode
  2) Install on all 4 peers
  3) Approve for all 4 organizations
  4) Check commit readiness
  5) Commit chaincode to channel
  6) Query committed chaincode
  7) Run full lifecycle (1 -> 6)
  8) Edit chaincode name / version / sequence / path
  0) Exit
====================================================
EOF
}

while true; do
  show_menu
  read -r -p "Select an option: " choice
  echo ""
  case "$choice" in
    1) package_chaincode ;;
    2) install_chaincode ;;
    3) approve_chaincode ;;
    4) check_readiness ;;
    5) commit_chaincode ;;
    6) query_committed ;;
    7) run_all_steps ;;
    8) configure_vars ;;
    0) echo "Exiting."; exit 0 ;;
    *) echo "Invalid selection. Please enter 0-8." ;;
  esac
done