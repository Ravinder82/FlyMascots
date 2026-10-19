#!/usr/bin/env bash
# QC extractions for the FlyMascots films (app-launch-kit rules/videos.md §4):
#   - poster frame per format
#   - flipbook contact sheet of the whole reel (one still every 0.8 s)
#   - boundary frames: first frames of every scene, by frame number
# Usage: bash marketing/tools/qc-films.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
R="$HERE/../renders"
FF=/opt/homebrew/bin/ffmpeg
mkdir -p "$R/qc"

frame() { # file, n, out
  "$FF" -hide_banner -loglevel error -y -i "$1" -vf "select=eq(n\,$2)" -frames:v 1 "$3"
}

# posters (strongest single still per cut)
frame "$R/flymascots-reel-16x9.mp4"  700 "$R/qc/poster-reel-16x9.png"
frame "$R/flymascots-reel-9x16.mp4"  700 "$R/qc/poster-reel-9x16.png"
frame "$R/flymascots-story-16x9.mp4" 950 "$R/qc/poster-story-16x9.png"
frame "$R/flymascots-story-9x16.mp4" 950 "$R/qc/poster-story-9x16.png"
frame "$R/flymascots-reel-16x9.mp4"  104 "$R/qc/poster-reveal-16x9.png"

# flipbook — the film read as a book, catches dead beats and washed scenes
"$FF" -hide_banner -loglevel error -y -i "$R/flymascots-reel-16x9.mp4" \
  -vf "fps=30/24,scale=320:-1,tile=6x5:padding=6:color=0x1c1c1c" -frames:v 1 "$R/qc/sheet-reel-flipbook.png"

# boundary frames — two frames after each cut (bars of the music grid)
"$FF" -hide_banner -loglevel error -y -i "$R/flymascots-reel-16x9.mp4" \
  -vf "select='eq(n\,70)+eq(n\,139)+eq(n\,207)+eq(n\,275)+eq(n\,343)+eq(n\,412)+eq(n\,480)+eq(n\,548)+eq(n\,616)+eq(n\,685)+eq(n\,717)',scale=560:-1,tile=4x3:padding=8:color=0x1c1c1c" \
  -frames:v 1 "$R/qc/sheet-reel-boundaries.png"

echo "QC written to $R/qc"
ls -la "$R/qc"
