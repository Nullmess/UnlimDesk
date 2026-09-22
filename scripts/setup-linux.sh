#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
    echo "This command is only required on Linux."
    exit 0
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ELECTRON_BIN="$ROOT_DIR/node_modules/electron/dist/electron"
SANDBOX_BIN="$ROOT_DIR/node_modules/electron/dist/chrome-sandbox"
RESTRICTION_FILE="/proc/sys/kernel/apparmor_restrict_unprivileged_userns"

if [[ ! -x "$ELECTRON_BIN" ]]; then
    echo "Electron is not installed. Run: npm install"
    exit 1
fi

if [[ -f "$RESTRICTION_FILE" ]] && [[ "$(cat "$RESTRICTION_FILE")" == "1" ]] && command -v apparmor_parser >/dev/null 2>&1; then
    PROFILE_NAME="unlimdesk-electron"
    PROFILE_PATH="/etc/apparmor.d/$PROFILE_NAME"
    ESCAPED_BIN="${ELECTRON_BIN// /\\ }"
    TMP_PROFILE="$(mktemp)"
    trap 'rm -f "$TMP_PROFILE"' EXIT

    cat > "$TMP_PROFILE" <<PROFILE
abi <abi/4.0>,
include <tunables/global>

$ESCAPED_BIN flags=(unconfined) {
    userns,
}
PROFILE

    echo "Installing an AppArmor profile for the local Electron binary..."
    sudo install -m 0644 "$TMP_PROFILE" "$PROFILE_PATH"
    sudo apparmor_parser -r "$PROFILE_PATH"
    echo "AppArmor profile installed: $PROFILE_PATH"
    echo "You can now run: npm start"
    exit 0
fi

if [[ ! -f "$SANDBOX_BIN" ]]; then
    echo "chrome-sandbox was not found in the Electron installation."
    exit 1
fi

echo "Configuring the Chromium setuid sandbox helper..."
sudo chown root:root "$SANDBOX_BIN"
sudo chmod 4755 "$SANDBOX_BIN"
echo "Sandbox helper configured. You can now run: npm start"
