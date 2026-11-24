#!/usr/bin/env bash
set -euo pipefail

CHANNEL_NAME="${CHANNEL_NAME:-haki-ardhi-channel}"
BASE_DIR="/opt/gopath/src/github.com/hyperledger/fabric/peer"

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

verify_one() {
  local key="$1"
  local mode="$2" # all | list | info

  IFS='|' read -r _ msp_id peer_host _ <<< "${PEERS[$key]}"
  echo "=== Verifying ${peer_host} (${msp_id}) ==="

  case "$mode" in
    list)
      run_peer_cmd "$key" channel list
      ;;
    info)
      run_peer_cmd "$key" channel getinfo -c "${CHANNEL_NAME}"
      ;;
    all)
      run_peer_cmd "$key" channel list
      run_peer_cmd "$key" channel getinfo -c "${CHANNEL_NAME}"
      ;;
    *)
      echo "Invalid mode: $mode (use: all, list, info)" >&2
      exit 1
      ;;
  esac
  echo ""
}

usage() {
  cat <<EOF
Usage: $0 [target] [mode]

Targets:
  all                 All four organizations (default)
  landofficer         LandOfficerMSP (peer0.landofficer.hakiardhi.local:7051)
  verificationofficer VerificationOfficerMSP (peer0.verificationofficer.hakiardhi.local:8051)
  registrar           RegistrarMSP (peer0.registrar.hakiardhi.local:9051)
  landowner           LandOwnerMSP (peer0.landowner.hakiardhi.local:10051)

Modes:
  all                 Run both 'channel list' and 'channel getinfo' (default)
  list                Run only 'peer channel list'
  info                Run only 'peer channel getinfo -c ${CHANNEL_NAME}'

Examples:
  $0                          # Check all peers (list + getinfo)
  $0 registrar                # Check only Registrar peer (list + getinfo)
  $0 landofficer list         # Check only if LandOfficer is in channel list
  $0 all info                 # Check channel info across all four peers
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

TARGET="${1:-all}"
MODE="${2:-all}"

if [[ "$TARGET" == "all" ]]; then
  for key in "${ORG_ORDER[@]}"; do
    verify_one "$key" "$MODE"
  done
elif [[ -n "${PEERS[$TARGET]+x}" ]]; then
  verify_one "$TARGET" "$MODE"
else
  echo "Unknown target: $TARGET" >&2
  usage
  exit 1
fi