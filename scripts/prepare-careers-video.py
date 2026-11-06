"""Make a moving crossfade loop from the approved source's 6–10s fragment.

Usage: python scripts/prepare-careers-video.py SOURCE.mp4 [--ffmpeg PATH]
Uses ffmpeg on PATH, or the locally installed imageio-ffmpeg binary.
"""

import argparse
from pathlib import Path
import shutil
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--ffmpeg")
    args = parser.parse_args()
    ffmpeg = args.ffmpeg or shutil.which("ffmpeg")
    if not ffmpeg:
        import imageio_ffmpeg

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    output = Path(__file__).resolve().parents[1] / "public/media/careers"
    output.mkdir(parents=True, exist_ok=True)
    clip = output / "team-atmosphere-v4.mp4"
    # Full frame. Dissolve the last 10 frames into the MOVING
    # first 10, then wrap into the adjacent source frame. Unlike v2, there is
    # no held opening frame or motion freeze. All frames come from 6–10s.
    # Shorter overlap reduces double exposure at the requested 0.85x playback.
    # All 96 source frames (6–10s) are retained across body and moving join.
    weight = "(0.5-0.5*cos(PI*T*24/9))"
    filters = (
        "[0:v]setsar=1,"
        "fps=24,trim=start_frame=144:end_frame=240,setpts=PTS-STARTPTS,"
        "split=3[middle][tail][head];"
        "[middle]trim=start_frame=10:end_frame=86,setpts=PTS-STARTPTS[body];"
        "[tail]trim=start_frame=86:end_frame=96,setpts=PTS-STARTPTS[ending];"
        "[head]trim=start_frame=0:end_frame=10,setpts=PTS-STARTPTS[opening];"
        f"[ending][opening]blend=all_expr='A*(1-({weight}))+B*({weight})'[join];"
        "[body][join]concat=n=2:v=1:a=0,"
        "format=yuv420p[out]"
    )
    subprocess.run(
        [ffmpeg, "-hide_banner", "-loglevel", "warning", "-y", "-i",
         str(args.source), "-filter_complex", filters, "-map", "[out]",
         "-an", "-sn", "-dn", "-map_metadata", "-1", "-c:v", "libx264",
         "-preset", "slow", "-crf", "26", "-profile:v", "high",
         "-movflags", "+faststart", "-r", "24", "-g", "48", str(clip)],
        check=True,
    )
    subprocess.run(
        [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i",
         str(clip), "-frames:v", "1", "-c:v", "libwebp", "-quality", "82",
         str(output / "team-atmosphere-v4-poster.webp")],
        check=True,
    )
    print(f"{clip.name}: {clip.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
