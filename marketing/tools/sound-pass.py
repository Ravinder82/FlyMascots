#!/usr/bin/env python3
"""Sound pass for the FlyMascots films.

Two-pass loudnorm on the exported MP4s (video stream copied), exact video-stream
duration enforced with -t so AAC priming padding never stretches the container,
then re-measured with `ffmpeg ebur128` and written to
`marketing/renders/sound-pass-measurements.json`.

Targets (app-launch-kit rules/sound-pass.md §5): integrated ≈ −16 LUFS,
true peak under −4 dBFS. The limiter target is set hotter (−5.5) so AAC
overshoot still lands under −4 after encoding.

Usage: python3 marketing/tools/sound-pass.py
"""
import json
import os
import re
import subprocess
import sys

FF = "/opt/homebrew/bin/ffmpeg"
FP = "/opt/homebrew/bin/ffprobe"
RENDERS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "renders")
RENDERS = os.path.abspath(RENDERS)

I_TARGET = -16.0
TP_LIMIT = -5.5  # encoding headroom so the measured true peak clears −4


def video_duration(path):
    out = subprocess.run(
        [FP, "-v", "error", "-select_streams", "v", "-show_entries", "stream=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True,
    ).stdout
    return float(out.strip().strip(","))


def measure(path):
    out = subprocess.run(
        [FF, "-hide_banner", "-nostats", "-i", path, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    tail = out[out.rfind("Integrated"):]
    def num(key):
        m = re.search(key + r":\s+(-?[\d.]+)", tail)
        return float(m.group(1)) if m else None
    return {"integrated_lufs": num("I"), "lra_lu": num("LRA"), "true_peak_dbfs": num("Peak")}


def loudnorm_analysis(path):
    out = subprocess.run(
        [FF, "-hide_banner", "-nostats", "-i", path,
         "-af", f"loudnorm=I={I_TARGET}:TP={TP_LIMIT}:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    return json.loads(out[out.rfind("{"):out.rfind("}") + 1])


def run(path):
    name = os.path.basename(path)
    dur = video_duration(path)
    before = measure(path)
    m = loudnorm_analysis(path)
    tmp = path + ".norm.mp4"
    filt = (
        f"loudnorm=I={I_TARGET}:TP={TP_LIMIT}:LRA=11:linear=true"
        f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}"
    )
    subprocess.run(
        [FF, "-hide_banner", "-loglevel", "error", "-y", "-i", path, "-c:v", "copy",
         "-af", filt, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-t", f"{dur:.3f}", tmp],
        check=True,
    )
    after = measure(tmp)
    os.replace(tmp, path)
    ok = after["true_peak_dbfs"] is not None and after["true_peak_dbfs"] <= -4.0 and abs(after["integrated_lufs"] + 16) <= 1.0
    print(f"{name}: {dur:.3f}s  {before['integrated_lufs']} → {after['integrated_lufs']} LUFS  "
          f"TP {before['true_peak_dbfs']} → {after['true_peak_dbfs']} dBFS  {'PASS' if ok else 'CHECK'}")
    return {"video_duration_s": dur, "before": before, "after": after,
            "loudnorm_analysis": {k: m[k] for k in ("input_i", "input_tp", "input_lra", "input_thresh", "target_offset")},
            "pass": ok}


def main():
    files = sorted(f for f in os.listdir(RENDERS) if f.endswith(".mp4"))
    if not files:
        sys.exit("no mp4s in marketing/renders")
    report = {f: run(os.path.join(RENDERS, f)) for f in files}
    with open(os.path.join(RENDERS, "sound-pass-measurements.json"), "w") as fh:
        json.dump(report, fh, indent=2)
    bad = [f for f, r in report.items() if not r["pass"]]
    print("all pass" if not bad else f"CHECK: {bad}")


if __name__ == "__main__":
    main()
