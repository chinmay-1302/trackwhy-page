#!/usr/bin/env python3
"""Join released TrackWhy tables into src/data/demo-clips.json and encode the demo set."""

from __future__ import annotations

import csv
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ANN = Path("/mnt/SSD_4/sankalp/trackwhy-code/annotations")
MODELS = Path(
    "/mnt/SSD_4/sankalp/trackwhy-code/model_outputs/"
    "Qwen3.8-27B/02_inside_top_left_tracker_only"
)
CLIPS = Path("/mnt/SSD_4/sankalp/trackwhy-dataset/trackwhy-clips")
OUT_JSON = ROOT / "src/data/demo-clips.json"
OUT_CLIPS = ROOT / "public/clips"
OUT_POSTERS = ROOT / "public/posters"

# Deterministic twelve-clip set that mirrors the paper's structure and
# avoids overlapping the invisible-miss and informed-flip buckets.
CLIP_IDS = [
    "C001",  # identity change (GT-informed highlight re-anchors)
    "C008",  # invisible miss, truncated
    "C018",  # informed-pass flip, visible_miss
    "C045",  # drift, both observers reported nothing wrong
    "C007",  # identity change
    "C043",  # invisible miss, truncated entry
    "C021",  # informed-pass flip, visible_miss
    "C004",  # invisible miss, full occlusion by a pedestrian
    "C014",  # identity change
    "C099",  # invisible miss, full occlusion by static structure
    "C201",  # informed-pass flip, visible_miss
    "C220",  # drift, both observers reported a failure
]

ERROR_TO_METRIC = {
    "FN": "miss",
    "IDSW": "identity_change",
}

NOTES = {
    "C008": (
        "The target is truncated at the frame boundary. MOT20 still annotates "
        "a pedestrian from the instant of entry, at a corpus-median height of "
        "29 px against a detection floor of 59–113 px."
    ),
    "C043": (
        "An entry event: the tracker held no box on this person before the "
        "miss, so a forward observer has no highlight to follow. MOT20 "
        "annotates from the instant of entry, at a corpus-median height of 29 px."
    ),
    "C004": (
        "The target is fully occluded by another pedestrian. TrackEval still "
        "counts a miss; both observers reported nothing visible."
    ),
    "C099": (
        "The target is fully hidden by static scene structure. The metric "
        "counts a miss; both observers labelled the clip no_error_visible."
    ),
    "C018": (
        "A counted miss that both observers called clean. Once MOT20's "
        "annotation convention was disclosed, the informed pass reclassified "
        "it as a miss."
    ),
    "C021": (
        "The same pattern as the other informed-pass flips: the miss is "
        "findable after you know the convention, and invisible before that."
    ),
    "C201": (
        "A visible_miss that flipped from no_error to miss on the informed "
        "pass. The supervision-free highlight never appears on the missed person."
    ),
    "C001": (
        "The highlighted ID ends and a new ID appears on the same person. "
        "Pilot observers caught 5 of 5 identity changes."
    ),
    "C007": (
        "An identity change during a crossing. The ID digits change; both "
        "observers labelled identity_change."
    ),
    "C014": (
        "The identity switches while the target is occluded by another person. "
        "Both observers still labelled identity_change."
    ),
    "C045": (
        "The tracker box drifts onto a static person. Both observers reported "
        "nothing wrong — drift is easy to miss if you are watching for a "
        "discrete event."
    ),
    "C220": (
        "The same drift family, but both observers flagged a failure. The "
        "highlight sits on a person who is not the original target."
    ),
}

ALTS = {
    "C008": (
        "Night-time overhead view of a crowded street. Tracker boxes with "
        "numeric IDs cover pedestrians. No yellow highlight is visible; the "
        "counted miss is a person truncated at the frame edge."
    ),
    "C043": (
        "Night-time overhead view of a crowded street. Tracker boxes cover "
        "the crowd. The counted miss is an entering pedestrian who never "
        "receives a highlight."
    ),
    "C004": (
        "Indoor hall with tracker boxes on pedestrians. A yellow highlight "
        "marks one person until they pass behind another pedestrian, which "
        "is the counted miss."
    ),
    "C099": (
        "Indoor hall with tracker boxes on pedestrians. The counted miss is "
        "a person fully hidden by static structure."
    ),
    "C018": (
        "Night-time crowded street with tracker boxes. The counted miss has "
        "no highlight under the supervision-free rendering."
    ),
    "C021": (
        "Night-time crowded street with tracker boxes. The missed pedestrian "
        "is not highlighted in the supervision-free clip."
    ),
    "C201": (
        "Night-time crowded street with tracker boxes. The supervision-free "
        "highlight never lands on the missed person."
    ),
    "C001": (
        "Indoor hall with tracker boxes. After the identity change the "
        "supervision-free highlight disappears, while the ground-truth-informed "
        "highlight re-anchors to the new ID."
    ),
    "C007": (
        "Night-time crowded street. A yellow highlight marks one pedestrian "
        "near the top of the frame; the ID on that person changes."
    ),
    "C014": (
        "Indoor hall. A highlighted pedestrian is occluded by another person "
        "and later reappears under a different tracker ID."
    ),
    "C045": (
        "Indoor hall. The highlighted box stays on a standing person while "
        "the original target has moved on."
    ),
    "C220": (
        "Night-time crowded street. A yellow highlight sits on a person in "
        "the upper right who is not the original target."
    ),
}


def load_csv(path: Path) -> dict[str, dict[str, str]]:
    with path.open() as handle:
        return {row["clip_id"]: row for row in csv.DictReader(handle)}


def model_prediction(clip_id: str) -> str:
    payload = json.loads((MODELS / f"{clip_id}.json").read_text())
    return payload["primary_error"]


def encode_pair(clip_id: str) -> None:
    OUT_CLIPS.mkdir(parents=True, exist_ok=True)
    OUT_POSTERS.mkdir(parents=True, exist_ok=True)
    pairs = {
        f"{clip_id}.mp4": CLIPS / "clips" / f"{clip_id}.mp4",
        f"{clip_id}_gt.mp4": CLIPS / "clips_gt_informed" / f"{clip_id}.mp4",
    }
    for name, source in pairs.items():
        if not source.exists():
            raise FileNotFoundError(source)
        dest = OUT_CLIPS / name
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(source),
                "-vf",
                "scale=-2:480",
                "-c:v",
                "libx264",
                "-crf",
                "28",
                "-preset",
                "slow",
                "-movflags",
                "+faststart",
                "-an",
                str(dest),
            ],
            check=True,
        )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(CLIPS / "clips" / f"{clip_id}.mp4"),
            "-vframes",
            "1",
            "-vf",
            "scale=-2:480",
            str(OUT_POSTERS / f"{clip_id}.jpg"),
        ],
        check=True,
    )


def main() -> None:
    manifest = load_csv(ANN / "manifest.csv")
    causes = load_csv(ANN / "clip_causes.csv")
    observer_a = load_csv(ANN / "human/observer_a.csv")
    observer_b = load_csv(ANN / "human/observer_b.csv")

    records = []
    for clip_id in CLIP_IDS:
        row = manifest[clip_id]
        error_type = row["error_type"]
        records.append(
            {
                "clip_id": clip_id,
                "video": f"/clips/{clip_id}.mp4",
                "video_gt": f"/clips/{clip_id}_gt.mp4",
                "poster": f"/posters/{clip_id}.jpg",
                "truth": ERROR_TO_METRIC.get(error_type, "drift"),
                "metric": ERROR_TO_METRIC.get(error_type),
                "condition": causes[clip_id]["cause"],
                "observer_a": observer_a[clip_id]["error_kind"],
                "observer_b": observer_b[clip_id]["error_kind"],
                "model": model_prediction(clip_id),
                "note": NOTES[clip_id],
                "alt": ALTS[clip_id],
            }
        )
        encode_pair(clip_id)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(records, indent=2) + "\n")
    print(f"wrote {OUT_JSON} ({len(records)} clips)")


if __name__ == "__main__":
    main()
