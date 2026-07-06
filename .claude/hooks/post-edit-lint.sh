#!/usr/bin/env bash
# PostToolUse (Edit|Write): auto-fix lintable JS/TS files on every edit so changes
# exit in a known state instead of relying on a manual `npm run lint` pass.
set -euo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | python3.12 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))")"

case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

[[ -f "$file_path" ]] || exit 0

output="$(npx eslint --fix "$file_path" 2>&1)" || {
  echo "[post-edit-lint] eslint --fix reported issues in $file_path:" >&2
  echo "$output" >&2
}

exit 0
