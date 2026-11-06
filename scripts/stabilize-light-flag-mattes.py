"""Repair and stabilize the light film's existing country mattes at build time."""

from pathlib import Path
import subprocess
import sys

import av
import imageio_ffmpeg
import numpy as np
from scipy.ndimage import binary_fill_holes, distance_transform_edt

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scratch/film-tools"))
import cv2


MEDIA = ROOT / "public/media/global-experience"
WIDTH, HEIGHT = 896, 720
SMALL = (WIDTH // 2, HEIGHT // 2)


def repair_red(rgb, masks, x, y):
    # Saturated red above the foreground flag belongs to the original film.
    # Use the nearest labelled fabric to recover its country at an omitted
    # fold, and keep the foreground stripes outside the repair corridor.
    r, g, b = rgb.astype(float).transpose(2, 0, 1)
    chroma = np.minimum(r - g, r - b)
    strength = np.clip((chroma - 13) / 21, 0, 1)
    red = masks[..., :2]
    # On the pale source, a GrabCut estimate can spill into the backdrop.
    # Close narrow highlights, fill enclosed reflections and keep a soft edge.
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    supported = cv2.morphologyEx((chroma > 5).astype(np.uint8), cv2.MORPH_CLOSE, kernel)
    supported = binary_fill_holes(supported).astype(np.float32)
    red *= cv2.GaussianBlur(supported, (0, 0), 0.75)[..., None]
    distance, nearest = distance_transform_edt(red.max(axis=2) < 0.6, return_indices=True)
    corridor = (x > 54) & (x < 438) & (y > 28) & ((y < 207) | (x > 340))
    missing = strength * corridor * (1 - masks[..., 2]) * (distance < 42)
    recovered = red[tuple(nearest)].argmax(axis=2)
    for country in range(2):
        red[..., country] = np.maximum(red[..., country], missing * (recovered == country))


def main():
    cv2.setNumThreads(2)
    rgb_frames, mattes, gray = [], [], []
    y, x = np.mgrid[:SMALL[1], :SMALL[0]]
    coordinates = np.dstack((x, y)).astype(np.float32)
    with av.open(str(MEDIA / "flags-film-native-light-v1.mp4")) as packed:
        for frame in packed.decode(video=0):
            data = frame.to_ndarray(format="rgb24")
            rgb = cv2.resize(data[:HEIGHT], SMALL, interpolation=cv2.INTER_AREA)
            mask = cv2.resize(data[HEIGHT:], SMALL, interpolation=cv2.INTER_AREA).astype(np.float32) / 255
            repair_red(rgb, mask, x, y)
            rgb_frames.append(rgb)
            mattes.append(mask)
            gray.append(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY))

    flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_FAST)

    def aligned(index, neighbor):
        displacement = flow.calc(gray[index], gray[neighbor], None)
        return cv2.remap(mattes[neighbor], coordinates + displacement, None, cv2.INTER_LINEAR)

    output = MEDIA / "flags-film-native-light-v2.mp4"
    temporary = output.with_suffix(".working.mp4")
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-y", "-f", "rawvideo",
        "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT * 2}", "-r", "24", "-i", "pipe:0",
        "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(temporary),
    ]
    with (
        av.open(str(MEDIA / "flags-film-native-light.mp4")) as film,
        subprocess.Popen(command, stdin=subprocess.PIPE) as encoder,
    ):
        count = len(mattes)
        written = 0
        for i, frame in enumerate(film.decode(video=0)):
            if i >= count:
                raise RuntimeError("The source has more frames than the mattes")
            rgb = frame.to_ndarray(format="rgb24")
            # The two versions have different compression. Reject a real
            # edit or timing mismatch, while allowing codec residuals.
            diff = cv2.resize(rgb, SMALL, interpolation=cv2.INTER_AREA).astype(float) - rgb_frames[i]
            if np.abs(diff).mean() > 3:
                raise RuntimeError(f"Packed matte is out of sync at frame {i}")
            mask = np.median([mattes[i], aligned(i, (i - 1) % count), aligned(i, (i + 1) % count)], axis=0)
            # Preserve the original foreground order after smoothing.
            mask[..., 1] = np.minimum(mask[..., 1], 1 - mask[..., 2])
            mask[..., 0] = np.minimum(mask[..., 0], 1 - mask[..., 2] - mask[..., 1])
            full = cv2.resize(mask, (WIDTH, HEIGHT), interpolation=cv2.INTER_LINEAR)
            alpha = np.rint(full.clip(0, 1) * 255).astype(np.uint8)
            encoder.stdin.write(np.vstack((rgb, alpha)).tobytes())
            written += 1
        encoder.stdin.close()
        if encoder.wait() or written != count:
            raise RuntimeError("Unable to encode the complete flag loop")
    temporary.replace(output)


if __name__ == "__main__":
    main()
