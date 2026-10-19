#!/usr/bin/env bash
# Render every launch card with headless Chrome at 2× (app-launch-kit
# rules/asset-capture.md). Card list and copy: ../copy/cards.md.
# Usage: bash marketing/stills/render.sh [card ...]
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="$HERE/out"
mkdir -p "$OUT"

# name width height
CARDS=(
  "launch-16x9 1600 900"
  "launch-square 1080 1080"
  "launch-portrait 1080 1350"
  "moods-16x9 1600 900"
  "pipeline-16x9 1600 900"
  "platforms-square 1080 1080"
  "og-card 1200 630"
  "yt-thumb-a 1280 720"
  "yt-thumb-b 1280 720"
  "reel-cover 1080 1920"
)

want=("$@")
render() {
  local name="$1" w="$2" h="$3"
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=2 \
    --window-size="$w,$h" --virtual-time-budget=2500 \
    --screenshot="$OUT/$name.png" \
    "file://$HERE/cards.html?card=$name" >/dev/null 2>&1
  printf "%-18s %sx%s → %s\n" "$name" "$w" "$h" "$(du -h "$OUT/$name.png" | cut -f1)"
}

for spec in "${CARDS[@]}"; do
  set -- $spec
  if [ ${#want[@]} -eq 0 ] || printf '%s\n' "${want[@]}" | grep -qx "$1"; then
    render "$1" "$2" "$3"
  fi
done
echo "cards → $OUT"
