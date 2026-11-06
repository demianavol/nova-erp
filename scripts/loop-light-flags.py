"""Close the light flags loop with motion-aligned RGB and country mattes."""

from pathlib import Path
import subprocess
import sys

import av
import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scratch/film-tools"))
import cv2


MEDIA = ROOT / "public/media/global-experience"
HEAD, TAIL, OVERLAP = 4, 174, 18
# Source frames immediately following a visibly oversized motion step.
GAPS = (46, 70)


def morph(outgoing, incoming, amount, flow, grid):
    height, width = grid.shape[:2]

    def gray(frame):
        small = cv2.resize(frame[:height], (width // 2, height // 2), interpolation=cv2.INTER_AREA)
        return cv2.cvtColor(small, cv2.COLOR_RGB2GRAY)

    a, b = gray(outgoing), gray(incoming)
    displacement_ab = cv2.resize(flow.calc(a, b, None), (width, height)) * 2
    displacement_ba = cv2.resize(flow.calc(b, a, None), (width, height)) * 2

    def warp(frame, displacement, fraction):
        target = grid - displacement * fraction
        for _ in range(2):
            sampled = cv2.remap(displacement, target, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            target = grid - sampled * fraction
        # Warp the footage and its exact color-coded mattes with the same map.
        return [
            cv2.remap(tile, target, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            for tile in np.split(frame, 2)
        ]

    first = warp(outgoing, displacement_ab, amount)
    second = warp(incoming, displacement_ba, 1 - amount)
    return np.vstack([cv2.addWeighted(a, 1 - amount, b, amount, 0) for a, b in zip(first, second)])


def main():
    cv2.setNumThreads(2)
    source = MEDIA / "flags-film-native-light-v2.mp4"
    output = MEDIA / "flags-film-native-light-v3.mp4"
    temporary = output.with_suffix(".working.mp4")
    with av.open(str(source)) as video:
        stream = video.streams.video[0]
        packed_height, width = stream.height, stream.width
    height = packed_height // 2
    y, x = np.mgrid[:height, :width]
    grid = np.dstack((x, y)).astype(np.float32)
    flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-y", "-f", "rawvideo",
        "-pix_fmt", "rgb24", "-s", f"{width}x{packed_height}", "-r", "24",
        "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "slow",
        "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(temporary),
    ]
    with (
        av.open(str(source)) as video,
        subprocess.Popen(command, stdin=subprocess.PIPE) as encoder,
    ):
        head = []
        first = previous = None
        written = 0
        for i, decoded in enumerate(video.decode(video=0)):
            if i < HEAD:
                continue
            if i >= TAIL + OVERLAP:
                break
            frame = decoded.to_ndarray(format="rgb24")
            if i < HEAD + OVERLAP:
                head.append(frame)
                continue
            if i >= TAIL:
                t = (i - TAIL) / (OVERLAP - 1)
                frame = morph(frame, head[i - TAIL], t * t * (3 - 2 * t), flow, grid)
            if first is None:
                first = frame
            if i in GAPS:
                encoder.stdin.write(morph(previous, frame, 0.5, flow, grid).tobytes())
            encoder.stdin.write(frame.tobytes())
            previous = frame
            written += 1
        if written == TAIL - HEAD:
            encoder.stdin.write(morph(previous, first, 0.5, flow, grid).tobytes())
        encoder.stdin.close()
        if encoder.wait() or written != TAIL - HEAD:
            raise RuntimeError("Unable to encode the light flags loop")
    temporary.replace(output)


if __name__ == "__main__":
    main()
