"""Prepare supplied Careers backgrounds with optional calm excerpt selection.

Usage: python scripts/prepare-careers-purple-videos.py GROWTH.mp4 IMPACT.mp4 FREEDOM.mp4
Framing is preserved and a moving dissolve joins the end and start of each loop.
Optional: --names NAME ... --starts SECONDS ... --durations SECONDS ...
          --fps FPS --overlap-frames COUNT
"""
import argparse
from pathlib import Path
import re
import shutil
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sources', type=Path, nargs='+')
    parser.add_argument('--names', nargs='+')
    parser.add_argument('--starts', type=float, nargs='+')
    parser.add_argument('--durations', type=float, nargs='+')
    parser.add_argument('--fps', type=int, default=24)
    parser.add_argument('--overlap-frames', type=int, default=12)
    parser.add_argument('--ffmpeg')
    args = parser.parse_args()
    fps = args.fps
    overlap = args.overlap_frames
    if fps < 1 or overlap < 2:
        parser.error('FPS must be positive and the overlap must span at least two frames')
    ffmpeg = args.ffmpeg or shutil.which('ffmpeg')
    if not ffmpeg:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    output = Path(__file__).resolve().parents[1] / 'public/media/careers'
    output.mkdir(parents=True, exist_ok=True)
    names = args.names or ['purple-growth', 'ripple-impact', 'sunset-freedom']
    starts = args.starts or [0] * len(args.sources)
    durations = args.durations or [None] * len(args.sources)
    if not len(names) == len(starts) == len(durations) == len(args.sources):
        parser.error('Supply one name, start and duration per source')
    for name, source, start, selected_duration in zip(names, args.sources, starts, durations):
        if not re.fullmatch(r'[a-z0-9-]+', name):
            parser.error('Output names must contain only lowercase letters, digits and hyphens')
        probe = subprocess.run([ffmpeg, '-hide_banner', '-i', str(source)], capture_output=True, text=True, encoding='utf-8', errors='replace')
        duration = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', probe.stderr)
        if not duration:
            raise ValueError(f'Could not read duration: {source}')
        h, m, s = map(float, duration.groups())
        available = h * 3600 + m * 60 + s - start
        seconds = min(available, selected_duration) if selected_duration is not None else available
        if start < 0 or seconds <= 0:
            raise ValueError(f'Invalid excerpt: {source}')
        count = round(seconds * fps)
        first = round(start * fps)
        if count < 2 * fps or count <= 2 * overlap:
            raise ValueError('Loop preparation needs at least two seconds and room for both blend edges')
        clip = output / f'{name}.mp4'
        weight = f'(0.5-0.5*cos(PI*T*{fps}/{overlap - 1}))'
        filters = (
            f"[0:v]scale=-2:'min(ih,720)':flags=lanczos,setsar=1,fps={fps},trim=start_frame={first}:end_frame={first+count},setpts=PTS-STARTPTS,split=3[m][t][h];"
            f'[m]trim=start_frame={overlap}:end_frame={count-overlap},setpts=PTS-STARTPTS[body];'
            f'[t]trim=start_frame={count-overlap}:end_frame={count},setpts=PTS-STARTPTS[tail];'
            f'[h]trim=end_frame={overlap},setpts=PTS-STARTPTS[head];'
            f"[tail][head]blend=all_expr='A*(1-({weight}))+B*({weight})'[join];"
            '[body][join]concat=n=2:v=1:a=0,format=yuv420p[out]'
        )
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'warning', '-y', '-i', str(source),
                        '-filter_complex', filters, '-map', '[out]', '-an', '-sn', '-dn', '-map_metadata', '-1',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-profile:v', 'high',
                        '-movflags', '+faststart', '-r', str(fps), '-g', str(2 * fps), str(clip)], check=True)
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(clip),
                        '-frames:v', '1', '-c:v', 'libwebp', '-quality', '84', str(output / f'{name}-poster.webp')], check=True)
        print(f'{clip.name}: {clip.stat().st_size:,} bytes, {(count-overlap)/fps:.2f}s')


if __name__ == '__main__':
    main()
