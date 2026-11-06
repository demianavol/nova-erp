"""Audit the encoded Uzbekistan lower-left corner throughout the actual loop.

Checks the delivered MP4 (including codec/color conversion), not the generator.
Use --video PATH to audit a different packed video; --report PATH saves metrics.
"""
import argparse
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scratch/film-tools"))
import cv2


def audit(video, contact_sheet=None):
    capture = cv2.VideoCapture(str(video))
    if not capture.isOpened():
        raise RuntimeError(f"Cannot decode {video}")
    frames = []
    sample_frames = set(np.linspace(0,225,20).round().astype(int))
    sheet = Image.new("RGB",(1560,1190),"#eeeeee") if contact_sheet else None
    sample = 0
    try:
        while True:
            ok, packed = capture.read()
            if not ok:
                break
            if packed.shape[:2] != (1440, 896):
                raise AssertionError("Unexpected packed-video dimensions")
            rgb = cv2.cvtColor(packed[:720], cv2.COLOR_BGR2RGB).astype(float)
            r, g, b = rgb.transpose(2, 0, 1)
            region = np.zeros((720, 896), np.uint8)
            region[510:670, 150:310] = 1
            green = region & ((g > r * 1.22) & (g > b * 1.03) & (g > 18)).astype(np.uint8)
            # Ignore genuine one-pixel source antialiasing. Interior green
            # fabric must not suddenly become transparent in the country matte.
            interior = cv2.erode(green, np.ones((3, 3), np.uint8)).astype(bool)
            alpha = packed[720:, :, 0].astype(float) / 255
            lost = interior & (alpha < .25)
            # Source-reviewed cloth interior below/around the orbit, valid for
            # the complete loop. This includes purple-lit folds and deliberately
            # does NOT filter by RGB: the green-only audit missed the notch.
            dark_fold = alpha[565:598, 190:310]
            dark_lost = int((dark_fold < .9).sum())
            if sheet is not None and len(frames) in sample_frames:
                crop = rgb[520:670,155:415]
                a = np.clip((alpha[520:670,155:415]-.015)/.97,0,1)[...,None]
                composite = crop*a+245*(1-a)
                x,y = sample%3*520,sample//3*170
                sheet.paste(Image.fromarray(crop.astype(np.uint8)),(x,y+20))
                sheet.paste(Image.fromarray(composite.astype(np.uint8)),(x+260,y+20))
                ImageDraw.Draw(sheet).text((x+4,y+4),f"{len(frames)/24:.2f}s  source | encoded cloth on light",fill="#111111")
                sample += 1
            frames.append({
                "frame": len(frames),
                "seconds": round(len(frames) / 24, 4),
                "green_interior_pixels": int(interior.sum()),
                "lost_interior_pixels": int(lost.sum()),
                "lost_all_color_fold_pixels": dark_lost,
            })
    finally:
        capture.release()
    if sheet is not None: sheet.save(contact_sheet,quality=95)
    if len(frames) != 226:
        raise AssertionError(f"Expected 226 loop frames, got {len(frames)}")
    maximum = max(row["lost_interior_pixels"] for row in frames)
    dark_maximum = max(row["lost_all_color_fold_pixels"] for row in frames)
    return {
        "video": str(video), "frames": len(frames),
        "worst_lost_corner_pixels": maximum,
        "worst_lost_all_color_fold_pixels": dark_maximum,
        "passed": maximum <= 5 and dark_maximum <= 5,
        "measurements": frames,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video", type=Path, default=ROOT / "public/media/global-experience/flags-film-masked-v3.mp4")
    parser.add_argument("--report", type=Path)
    parser.add_argument("--contact-sheet", type=Path)
    args = parser.parse_args()
    cv2.setNumThreads(2)
    result = audit(args.video,args.contact_sheet)
    if args.report:
        args.report.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in result.items() if key != "measurements"}, indent=2))
    if not result["passed"]:
        raise SystemExit("Uzbekistan corner loses opaque source fabric")


if __name__ == "__main__":
    main()
