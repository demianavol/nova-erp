"""Prepare the supplied Veo clip without changing its image proportions.

Usage: python scripts/prepare-future-video.py SOURCE.mp4 [--ffmpeg PATH]
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

    output = Path(__file__).resolve().parents[1] / "public/media/future"
    output.mkdir(parents=True, exist_ok=True)
    clip = output / "future-atmosphere.mp4"
    # Measured letterbox: 70 px on both edges of the 1280x720 source.
    # Discard the opening fade-in. Crossfade 36 tail/head frames, then follow
    # with the middle of the clip. Smoothstep weights reach exactly 0 and 1;
    # the file boundary continues adjacent source frames at normal velocity.
    weight = "(T*24/35)*(T*24/35)*(3-2*T*24/35)"
    filters = (
        "[0:v]crop=1280:580:0:70,setsar=1,"
        "fps=24,trim=start_frame=48:end_frame=240,setpts=PTS-STARTPTS,"
        "split=3[middle][tail][head];"
        "[middle]trim=start_frame=36:end_frame=156,setpts=PTS-STARTPTS[body];"
        "[tail]trim=start_frame=156:end_frame=192,setpts=PTS-STARTPTS[ending];"
        "[head]trim=end_frame=36,setpts=PTS-STARTPTS[opening];"
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
         str(output / "future-atmosphere-poster.webp")],
        check=True,
    )
    print(f"{clip.name}: {clip.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
