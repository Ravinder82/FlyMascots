#!/usr/bin/env python3
"""Beat grid + <120 Hz proof. Usage: analyze.py <track> <fps> [outdir]

Writes grid.json (BPM, beats in seconds *and* frames) + two plots:
  lowband_grid.png  — whole track, <120 Hz energy vs beat grid
  lowband_zoom.png  — one 8-beat window, where kicks must sit on the lines
If kick peaks sit consistently off the grid, it measures the median offset
and shifts the whole grid (per the sound-pass law) before writing output.
"""
import sys, os, json
import numpy as np
import librosa
import matplotlib

from scipy.signal import find_peaks

matplotlib.use("Agg")
import matplotlib.pyplot as plt

track, fps = sys.argv[1], float(sys.argv[2])
outdir = sys.argv[3] if len(sys.argv) > 3 else "."
os.makedirs(outdir, exist_ok=True)

y, sr = librosa.load(track, sr=None, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
beat_t = librosa.frames_to_time(beats, sr=sr)
S = np.abs(librosa.stft(y, n_fft=2048))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = S[freqs < 120].sum(axis=0)
low_t = librosa.frames_to_time(np.arange(len(low)), sr=sr)

peaks, _ = find_peaks(low, distance=max(1, int(0.2 * sr / 512)))
peak_t = low_t[peaks]
offsets = [p - beat_t[np.argmin(np.abs(beat_t - p))] for p in peak_t if np.min(np.abs(beat_t - p)) < 0.15]
shift = float(np.median(offsets)) if offsets else 0.0
if abs(shift) > 0.01:
    beat_t = beat_t + shift

grid = {
    "track": os.path.basename(track),
    "bpm": float(np.atleast_1d(tempo)[0]),
    "fps": fps,
    "grid_shift_s": round(shift, 4),
    "beats": beat_t.tolist(),
    "beat_frames": [round(t * fps) for t in beat_t],
}
json.dump(grid, open(f"{outdir}/grid.json", "w"), indent=1)

for name, lo, hi in (("lowband_grid", None, None), ("lowband_zoom", min(4, len(beat_t) - 1), min(12, len(beat_t) - 1))):
    fig, ax = plt.subplots(figsize=(14, 3), dpi=140)
    sel = slice(None) if lo is None else (low_t >= beat_t[lo]) & (low_t <= beat_t[hi])
    ax.plot(low_t[sel], low[sel] / (low.max() or 1), lw=0.8, color="#FA5426")
    for t in beat_t:
        if lo is None or beat_t[lo] <= t <= beat_t[hi]:
            ax.axvline(t, color="#57DB94", lw=0.7)
    ax.set_title(f"{grid['track']} — <120 Hz vs beat grid ({grid['bpm']:.1f} BPM, shift {shift:+.3f}s, green = beats)")
    fig.tight_layout()
    fig.savefig(f"{outdir}/{name}.png")
    plt.close(fig)

# Section energy map (2s hop) to find the best 24 s window.
hop = 2.0
rms = librosa.feature.rms(y=y, frame_length=4096, hop_length=int(sr * hop))[0]
times = np.arange(len(rms)) * hop
energy = {"hop_s": hop, "t": times.tolist(), "rms": rms.tolist()}
json.dump(energy, open(f"{outdir}/energy.json", "w"), indent=1)

fig, ax = plt.subplots(figsize=(14, 3), dpi=140)
ax.plot(times, rms, color="#FA5426", lw=1.4)
ax.set_title(f"{grid['track']} — RMS energy every {hop:.0f}s")
for t in beat_t:
    ax.axvline(t, color="#57DB94", lw=0.15, alpha=0.4)
fig.tight_layout()
fig.savefig(f"{outdir}/energy.png")
plt.close(fig)

print(f"{grid['bpm']:.1f} BPM, {len(grid['beat_frames'])} beats, grid shift {shift:+.3f}s → {outdir}/grid.json")
