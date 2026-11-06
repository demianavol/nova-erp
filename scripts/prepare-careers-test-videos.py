"""Prepare the three supplied 1280x720 / 24fps / 10s Careers test clips.

Usage: python scripts/prepare-careers-test-videos.py 1vid.mp4 2vid.mp4 3vid.mp4
Original files are preserved. Full frame, no camera animation, no audio.
"""

import argparse
from pathlib import Path
import shutil
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sources", type=Path, nargs=3)
    parser.add_argument("--ffmpeg")
    args = parser.parse_args()
    ffmpeg = args.ffmpeg or shutil.which("ffmpeg")
    if not ffmpeg:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    output = Path(__file__).resolve().parents[1] / "public/media/careers"
    output.mkdir(parents=True, exist_ok=True)
    for name, source in zip(("growth", "impact", "team"), args.sources):
        clip = output / f"test-{name}.mp4"
        # Moving half-second head/tail dissolve; the file boundary joins
        # source frames 11 and 12. No frozen frame or reverse human motion.
        weight = "(0.5-0.5*cos(PI*T*24/11))"
        filters = (
            "[0:v]setsar=1,fps=24,trim=end_frame=240,setpts=PTS-STARTPTS,"
            "split=3[m][t][h];"
            "[m]trim=start_frame=12:end_frame=228,setpts=PTS-STARTPTS[body];"
            "[t]trim=start_frame=228:end_frame=240,setpts=PTS-STARTPTS[tail];"
            "[h]trim=end_frame=12,setpts=PTS-STARTPTS[head];"
            f"[tail][head]blend=all_expr='A*(1-({weight}))+B*({weight})'[join];"
            "[body][join]concat=n=2:v=1:a=0,format=yuv420p[out]"
        )
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "warning", "-y", "-i", str(source),
            "-filter_complex", filters, "-map", "[out]", "-an", "-sn", "-dn",
            "-map_metadata", "-1", "-c:v", "libx264", "-preset", "slow",
            "-crf", "25", "-profile:v", "high", "-movflags", "+faststart",
            "-r", "24", "-g", "48", str(clip),
        ], check=True)
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(clip),
            "-frames:v", "1", "-c:v", "libwebp", "-quality", "84",
            str(output / f"test-{name}-poster.webp"),
        ], check=True)
        print(f"{clip.name}: {clip.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
