"""Prepare the user-supplied flag film for the two public-site themes.

Usage: python scripts/prepare-global-experience-video.py SOURCE.mp4 [--ffmpeg PATH]
Requires numpy, scipy and Pillow; no generative alteration of the supplied film.
"""

import argparse
from pathlib import Path
import shutil
import subprocess

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--ffmpeg")
    parser.add_argument("--native-light", action="store_true", help="Prepare the supplied light film without recoloring")
    args = parser.parse_args()
    ffmpeg = args.ffmpeg or shutil.which("ffmpeg")
    if not ffmpeg:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    output = Path(__file__).resolve().parents[1] / "public/media/global-experience"
    output.mkdir(parents=True, exist_ok=True)
    dark = output / ("flags-film-native-light.mp4" if args.native_light else "flags-film-dark.mp4")
    light = output / "flags-film-light.mp4"
    # Keep all of the flags and orbit; remove only the empty left-hand space.
    # 14 moving tail frames dissolve into the moving opening, then join the
    # adjacent opening frame. The resulting 226-frame loop has no held frame.
    filters = (
        "[0:v]fps=24,trim=end_frame=240,crop=896:720:384:0,setsar=1,"
        "split=3[body][tail][head];"
        "[body]trim=start_frame=14:end_frame=226,setpts=PTS-STARTPTS[b];"
        "[tail]trim=start_frame=226:end_frame=240,setpts=PTS-STARTPTS[t];"
        "[head]trim=end_frame=14,setpts=PTS-STARTPTS[h];"
        "[t][h]blend=all_expr='A*(0.5+0.5*cos(PI*T*24/13))+B*(0.5-0.5*cos(PI*T*24/13))'[join];"
        "[b][join]concat=n=2:v=1:a=0,format=yuv420p[out]"
    )
    encode = ["-an", "-sn", "-dn", "-map_metadata", "-1", "-c:v", "libx264",
              "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p",
              "-movflags", "+faststart", "-g", "48"]
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(args.source),
                    "-filter_complex", filters, "-map", "[out]", *encode, str(dark)], check=True)
    if args.native_light:
        print(f"{dark.name}: {dark.stat().st_size:,} bytes")
        return

    decoder = subprocess.Popen([ffmpeg, "-v", "error", "-i", str(dark), "-f", "rawvideo",
                                "-pix_fmt", "rgb24", "pipe:1"], stdout=subprocess.PIPE)
    encoder = subprocess.Popen([ffmpeg, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                "-s", "896x720", "-r", "24", "-i", "pipe:0", *encode, str(light)],
                               stdin=subprocess.PIPE)
    try:
        while raw := decoder.stdout.read(896 * 720 * 3):
            frame = np.frombuffer(raw, dtype=np.uint8).reshape(720, 896, 3)
            small = np.array(Image.fromarray(frame).resize((448, 360), Image.Resampling.BILINEAR)).astype(np.float32) / 255
            r, g, b = small.transpose(2, 0, 1)
            brightest = small.max(axis=2)
            chroma = brightest - small.min(axis=2)
            # Keep the supplied flag pixels, including their symbols, folds and
            # white stripe. Only the purple atmosphere is mapped to warm white.
            fabric = ((r > g * 1.45) & (r > b * 1.12))
            fabric |= ((g > r * 1.3) & (b > r * 1.3))
            fabric |= ((g > r * 1.2) & (g > b * 1.05))
            fabric |= ((chroma < brightest * 0.25) & (brightest > 0.25))
            fabric = ndimage.binary_closing(fabric, iterations=12)
            labels, _ = ndimage.label(fabric)
            sizes = np.bincount(labels.ravel())
            keep = sizes > 750
            keep[0] = False
            fabric = ndimage.binary_fill_holes(keep[labels])
            fabric = ndimage.binary_dilation(fabric, iterations=1)
            matte = Image.fromarray((fabric * 255).astype(np.uint8)).resize((896, 720), Image.Resampling.BILINEAR)
            matte = np.array(matte.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)[..., None] / 255
            original = frame.astype(np.float32)
            # Remove purple atmosphere accidentally enclosed between touching
            # flag silhouettes, without recoloring the fabric or its symbols.
            rr, gg, bb = original.transpose(2, 0, 1)
            background = np.clip((bb / np.maximum(rr, 1) - 1.12) / 0.18, 0, 1)
            background *= np.clip((rr / np.maximum(gg, 1) - 1.02) / 0.16, 0, 1)
            background *= np.clip((145 - original.max(axis=2)) / 30, 0, 1)
            matte *= 1 - background[..., None]
            matte = np.array(Image.fromarray((matte[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32)[..., None] / 255
            luminance = (original * np.array([0.2126, 0.7152, 0.0722])).sum(axis=2)[..., None] / 255
            atmosphere = np.array([250, 248, 253]) - (luminance ** 0.8) * np.array([95, 125, 62])
            result = np.clip(original * matte + atmosphere * (1 - matte), 0, 255).astype(np.uint8)
            encoder.stdin.write(result.tobytes())
    finally:
        decoder.stdout.close()
        encoder.stdin.close()
        decoder.wait()
        encoder.wait()
    if decoder.returncode or encoder.returncode:
        raise RuntimeError("Theme-adapted film encoding failed")
    for theme in ("dark", "light"):
        video = output / f"flags-film-{theme}.mp4"
        subprocess.run([ffmpeg, "-v", "error", "-y", "-i", str(video), "-frames:v", "1",
                        "-c:v", "libwebp", "-quality", "88", str(output / f"flags-film-{theme}-poster.webp")], check=True)
        print(f"{video.name}: {video.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
