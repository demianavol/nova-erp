"""Pack the glass mark's RGB, alpha and signed edge distance into one H.264 loop."""

from pathlib import Path
from shutil import copyfile
import subprocess
from tempfile import TemporaryDirectory

import av
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import (
    binary_fill_holes, distance_transform_edt, gaussian_filter,
    gaussian_filter1d, label, map_coordinates,
)


BRAND = Path(__file__).resolve().parents[1] / "public" / "brand"
CROP = (570, 95, 1220, 645)
SIZE = (640, 540)
DISTANCE_RANGE = 24 * SIZE[0] / 512
KEYS = [0, 24, 48, 72, 96, 120, 144, 168, 192, 209]
# Hand-traced guides in the 320 × 270 crop. Points follow the photographed
# outline, including the rounded ends, in the same order at every keyframe.
UPPER = [
    [(113,23),(119,23),(182,89),(186,95),(177,102),(152,119),(148,115)],
    [(116,17),(122,17),(177,87),(181,94),(172,102),(150,117),(145,113)],
    [(119,13),(125,14),(171,87),(175,97),(165,106),(150,114),(145,111)],
    [(115,14),(121,15),(176,87),(181,95),(173,102),(149,115),(144,111)],
    [(112,18),(118,18),(180,85),(185,92),(177,99),(151,114),(147,110)],
    [(111,20),(118,20),(180,86),(185,92),(177,100),(152,115),(148,112)],
    [(111,19),(117,20),(181,86),(186,93),(178,101),(152,116),(148,113)],
    [(111,21),(117,21),(182,87),(186,94),(178,102),(152,117),(148,114)],
    [(111,22),(117,22),(182,88),(186,95),(178,102),(152,119),(148,115)],
    [(112,22),(118,22),(182,89),(186,95),(178,102),(152,119),(148,115)],
]
RIGHT = [
    [(175,124),(179,116),(233,78),(249,72),(260,75),(268,87),(291,178),(294,201),(289,216),(280,224),(268,222),(254,213),(184,143)],
    [(174,124),(179,114),(233,76),(248,69),(260,73),(268,84),(289,174),(292,198),(289,211),(280,222),(268,220),(254,211),(184,141)],
    [(174,121),(178,112),(233,74),(248,66),(260,70),(269,83),(290,171),(293,194),(289,210),(279,219),(268,217),(254,208),(183,138)],
    [(175,120),(179,111),(233,73),(249,66),(261,70),(270,84),(292,173),(295,195),(290,211),(279,218),(266,215),(253,206),(184,137)],
    [(175,120),(179,111),(233,75),(248,69),(260,73),(268,85),(293,175),(296,195),(292,210),(281,218),(269,215),(255,206),(184,136)],
    [(175,120),(179,111),(232,75),(248,70),(259,74),(268,86),(293,176),(296,197),(292,212),(280,220),(268,217),(255,207),(183,137)],
    [(175,121),(180,111),(233,74),(250,69),(261,74),(269,86),(292,176),(295,198),(291,213),(280,220),(268,218),(254,208),(184,138)],
    [(175,122),(179,113),(232,75),(250,70),(261,75),(269,87),(292,177),(295,200),(291,215),(280,222),(268,219),(254,210),(184,139)],
    [(175,123),(179,115),(233,77),(249,72),(260,75),(268,87),(292,178),(295,201),(290,215),(280,224),(268,221),(254,212),(184,141)],
    [(175,124),(179,116),(233,78),(249,72),(260,75),(268,87),(291,178),(294,201),(289,216),(280,224),(268,222),(254,213),(184,142)],
]
LOWER = [
    [(66,202),(75,190),(145,138),(155,132),(163,134),(171,142),(202,195),(207,207),(203,216),(193,221),(81,224),(70,220),(65,213)],
    [(66,198),(76,185),(145,136),(155,132),(164,135),(172,143),(203,188),(208,201),(203,211),(192,216),(81,222),(69,217),(65,208)],
    [(65,190),(75,177),(145,141),(155,137),(163,139),(171,146),(202,174),(208,187),(205,200),(195,207),(80,214),(69,210),(65,203)],
    [(65,188),(74,176),(144,143),(154,139),(163,141),(171,148),(201,172),(208,184),(205,199),(194,204),(81,211),(69,208),(65,200)],
    [(65,192),(74,181),(144,138),(154,134),(163,136),(171,143),(202,180),(208,192),(205,203),(194,209),(80,215),(69,211),(65,204)],
    [(66,197),(75,184),(144,135),(154,130),(163,132),(171,140),(203,187),(208,200),(204,211),(193,216),(80,220),(69,216),(65,208)],
    [(66,198),(75,186),(145,135),(155,130),(163,132),(171,141),(202,191),(207,204),(203,214),(193,218),(80,223),(69,219),(65,211)],
    [(66,200),(75,187),(145,137),(155,132),(163,134),(171,142),(202,194),(207,207),(203,216),(193,221),(80,225),(69,220),(65,213)],
    [(66,202),(75,190),(145,138),(155,133),(163,135),(171,143),(202,195),(207,207),(203,216),(193,221),(80,225),(69,221),(65,213)],
    [(66,202),(75,190),(145,138),(155,132),(163,134),(171,142),(202,195),(207,207),(203,216),(193,221),(81,224),(70,220),(65,213)],
]


def resample_polygon(points):
    closed = np.vstack((points, points[:1]))
    length = np.r_[0, np.cumsum(np.linalg.norm(np.diff(closed, axis=0), axis=1))]
    steps = np.linspace(0, length[-1], 192, endpoint=False)
    return np.stack([np.interp(steps, length, axis) for axis in closed.T], axis=1)


def snap_to_glass(frame, guide):
    # Refine the guide against the bright outer glass edge. Limit the search
    # so interior reflections and the other two shards cannot replace a contour.
    points = resample_polygon(guide)
    tangent = np.roll(points, -2, axis=0) - np.roll(points, 2, axis=0)
    normal = np.stack((-tangent[:, 1], tangent[:, 0]), axis=1)
    normal /= np.linalg.norm(normal, axis=1)[:, None]
    offsets = np.arange(-6, 6.1, 0.5)
    samples = points[:, None] + offsets[None, :, None] * normal[:, None]
    signal = frame.max(axis=2).astype(float)
    values = map_coordinates(signal, [samples[..., 1], samples[..., 0]], order=1)
    score = values[:, 3:] - values[:, :-3] - abs(offsets[1:-2]) * 1.45
    best = offsets[1:-2][score.argmax(axis=1)] + 0.25
    best[score.max(axis=1) < 3] = 0
    best = gaussian_filter1d(best, 1.35, mode="wrap")
    return points + best[:, None] * normal


def refine_edges(frame, inside):
    distance = distance_transform_edt(inside) - distance_transform_edt(~inside)
    exterior = distance_transform_edt(distance > -5, return_distances=False, return_indices=True)
    background = frame[tuple(exterior)].astype(np.float32)
    rgb = frame.astype(np.float32)
    contrast = np.max(np.abs(rgb - background), axis=2)
    # Suppress the photographed backdrop within the uncertain rotoscope band.
    # Retain the transparent glass itself, including its low-contrast interior.
    geometric = np.clip((distance + 1) / 2, 0, 1)
    evidence = np.clip((contrast - 7) / 18, 0, 1)
    weight = np.clip((4.5 - distance) / 4, 0, 1)
    matte = gaussian_filter(geometric * (1 - weight * (1 - evidence)), 0.55)
    components, _ = label(matte >= 0.5)
    sizes = np.bincount(components.ravel())
    sizes[0] = 0
    clean = binary_fill_holes(np.isin(components, sizes.argsort()[-3:]))
    distance = distance_transform_edt(clean) - distance_transform_edt(~clean)
    distance -= np.sign(distance) * 0.5
    alpha = np.clip(0.5 + (distance - 0.15) / 2.5, 0, 1)
    # Remove the original purple background color from the soft edge pixels.
    corrected = (rgb - background * (1 - alpha[..., None])) / np.maximum(alpha[..., None], 0.42)
    edge = ((1 - alpha) * np.clip(alpha * 8, 0, 1))[..., None]
    color = np.rint(np.clip(rgb * (1 - edge) + corrected * edge, 0, 255)).astype(np.uint8)
    return color, alpha, distance


def main():
    with av.open(str(BRAND / "young-unicorn-hero-loop.mp4")) as source:
        frames = [
            np.asarray(frame.to_image().crop(CROP).resize(SIZE, Image.Resampling.LANCZOS))
            for frame in source.decode(video=0)
        ]
    contours = []
    scale = np.array(SIZE) / [320, 270]
    for keyframes in (UPPER, RIGHT, LOWER):
        coordinates = np.asarray(keyframes).reshape(len(KEYS), -1).T
        guided = [
            snap_to_glass(frame, np.array([np.interp(i, KEYS, c) for c in coordinates]).reshape(-1, 2) * scale)
            for i, frame in enumerate(frames)
        ]
        contours.append(gaussian_filter1d(guided, 1.0, axis=0, mode="wrap"))

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    width, height = SIZE
    with TemporaryDirectory() as temporary:
        video = Path(temporary) / "young-unicorn-glass.mp4"
        poster = video.with_suffix(".webp")
        command = [
            ffmpeg, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{width}x{height * 3}", "-r", "24", "-i", "pipe:0",
            "-an", "-c:v", "libx264", "-crf", "15", "-preset", "slow",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(video),
        ]
        with subprocess.Popen(command, stdin=subprocess.PIPE) as encoder:
            for i, frame in enumerate(frames):
                mask = Image.new("L", SIZE)
                for shape in contours:
                    ImageDraw.Draw(mask).polygon([tuple(point) for point in shape[i]], fill=255)
                frame, alpha, distance = refine_edges(frame, np.asarray(mask) > 0)
                field = np.clip(0.5 + distance / (2 * DISTANCE_RANGE), 0, 1)
                packed = np.vstack([frame, *[
                    np.repeat(np.rint(plane[..., None] * 255).astype(np.uint8), 3, axis=2)
                    for plane in (alpha, field)
                ]])
                encoder.stdin.write(packed.tobytes())
                if i == 0:
                    rgba = np.dstack((frame, np.rint(alpha * 255).astype(np.uint8)))
                    Image.fromarray(rgba).save(poster, quality=94)
            encoder.stdin.close()
            if encoder.wait():
                raise RuntimeError("Unable to encode the glass logo")
        # Replace by writing the completed files, even when Windows keeps a
        # preview handle open and refuses to rename the existing asset.
        copyfile(video, BRAND / video.name)
        copyfile(poster, BRAND / poster.name)


if __name__ == "__main__":
    main()
