"""Pack the existing flag film and per-frame country mattes into ONE video.

The top half is the supplied moving footage; RGB channels in the bottom half
identify China, Kyrgyzstan and Uzbekistan. One decoder guarantees exact sync.
Requires OpenCV, numpy, scipy, Pillow, and FFmpeg (or imageio-ffmpeg).
"""
from pathlib import Path
import argparse
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scratch/film-tools"))
import cv2

# Coarse rotoscope guides at 1s intervals in the 448x360 preview. GrabCut
# refines the actual moving silhouettes in each frame, without editing footage.
KEY_TIMES = np.arange(0.5, 9.5)
CN_TIPS = [[282,91],[274,104],[282,94],[279,64],[282,76],[274,109],[279,90],[282,97],[283,87]]
KG = [
 [[215,118],[410,105],[438,212],[223,246]],
 [[214,117],[392,118],[419,231],[224,251]],
 [[215,117],[401,117],[408,229],[220,247]],
 [[213,118],[399,107],[427,205],[218,247]],
 [[214,118],[412,89],[440,210],[221,247]],
 [[216,117],[397,105],[417,231],[222,249]],
 [[215,118],[401,110],[419,231],[221,246]],
 [[215,118],[410,95],[431,216],[221,248]],
 [[215,118],[407,101],[434,218],[221,252]],
]
UZ = [
 [[107,166],[339,228],[326,350],[91,294]],
 [[108,166],[307,226],[327,336],[91,297]],
 [[109,166],[353,213],[359,306],[92,313]],
 [[105,173],[335,195],[336,314],[91,299]],
 [[109,167],[333,214],[326,340],[91,293]],
 [[107,167],[312,224],[326,324],[92,302]],
 [[109,168],[338,218],[335,331],[91,294]],
 [[108,166],[338,218],[329,348],[91,299]],
 [[107,173],[334,232],[325,342],[91,303]],
]

# Full-resolution lower hem guides, sampled from the source, including the
# purple-lit cloth below the orbit. They constrain edge tracking, not color
# classification. Dark folds must remain opaque even when their RGB resembles
# the background. Columns: x=176,200,240,280,320,360,400,440.
HEM_X = np.array([176,200,240,280,320,360,400,440])
HEM_FRAMES = np.array([0,24,48,72,96,120,144,168,192,216,225])
HEM_Y = np.array([
 [602,605,610,614,619,624,640,652],
 [602,606,612,618,622,624,625,631],
 [600,606,612,620,624,626,629,634],
 [600,603,607,612,616,619,620,624],
 [601,604,608,614,619,622,625,631],
 [602,605,610,615,620,625,632,638],
 [600,605,612,619,624,628,629,634],
 [600,604,610,617,630,640,643,648],
 [600,605,612,619,623,629,634,645],
 [600,606,613,619,628,642,648,652],
 [602,605,610,614,619,624,640,652],
], dtype=float)


def track_corner(source):
    """Track the hem's chroma edge within the rotoscope corridor, then smooth
    across space and time. The orbit's brightness is excluded from the score.
    This is a source-silhouette constraint, never a per-pixel opacity threshold.
    """
    capture = cv2.VideoCapture(str(source))
    hems, sides = [], []
    xs = np.arange(160, 441)
    while True:
        ok, bgr = capture.read()
        if not ok: break
        index = len(hems)
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(float)
        chroma = cv2.GaussianBlur(rgb[...,1]-rgb[...,0], (0,0), 1)
        expected = np.interp(xs, HEM_X, [np.interp(index, HEM_FRAMES, HEM_Y[:,i]) for i in range(len(HEM_X))])
        candidates = np.arange(580, 671)[:,None]
        gradient = chroma[581:672,xs] - chroma[579:670,xs]
        score = -gradient - .45 * np.abs(candidates-expected)
        score[np.abs(candidates-expected)>10] = -1e6
        bottom = candidates[:,0][score.argmax(axis=0)]
        hems.append(ndimage.gaussian_filter1d(bottom.astype(float), 3))
        # The leading edge above the orbit is visible in every frame. Fit it
        # there and continue its tangent through the obscured corner.
        ys = np.arange(515, 571)
        choices = np.arange(174, 200)
        derivative = chroma[ys[:,None],choices+1] - chroma[ys[:,None],choices-1]
        expected_side = 190 - .14*(ys-500)
        derivative -= .5*np.abs(choices[None,:]-expected_side[:,None])
        edge = choices[derivative.argmax(axis=1)]
        sides.append(np.polyfit(ys, edge, 1))
    capture.release()
    return (ndimage.gaussian_filter1d(np.array(hems), .85, axis=0, mode="wrap"),
            ndimage.gaussian_filter1d(np.array(sides), 1.2, axis=0, mode="wrap"))


def protect_corner(mask, hem, side):
    y, x = np.mgrid[0:720,0:896]
    lower = np.interp(np.arange(896), np.arange(160,441), hem)
    left = np.clip(side[0]*y+side[1], 171, 200)
    # A one-pixel feather follows the actual hem. Blend into the statistical
    # matte well inside the cloth, so no new crop or interior seam is introduced.
    inside = np.clip((lower[None,:]-y+.7)/1.4,0,1)*np.clip((x-left+.7)/1.4,0,1)
    blend = np.clip((y-550)/12,0,1)*np.clip((440-x)/25,0,1)
    return np.maximum(mask, inside*blend)


def guide(values, t):
    values = np.array(values, dtype=float)
    times = np.r_[-0.916667, KEY_TIMES, 9.916667]
    extended = np.concatenate([values[-1:], values, values[:1]])
    result = [np.interp(t, times, extended.reshape(len(times), -1)[:, i]) for i in range(values[0].size)]
    return np.array(result).reshape(values[0].shape)


def segment(frame, points, blue=False, iterations=2):
    polygon = np.zeros(frame.shape[:2], np.uint8)
    cv2.fillPoly(polygon, [np.rint(points).astype(np.int32)], 1)
    collar = ndimage.binary_dilation(polygon, iterations=20)
    interior = ndimage.binary_erosion(polygon, iterations=10)
    r, g, b = frame.astype(float).transpose(2, 0, 1)
    if blue:
        core = ((g > r * 1.1) | ((frame.max(axis=2)-frame.min(axis=2)) < frame.max(axis=2)*.4))
    else:
        core = (r > g * 1.4) & (r > b * 1.1)
    mask = np.full(frame.shape[:2], cv2.GC_BGD, np.uint8)
    mask[collar] = cv2.GC_PR_BGD
    mask[polygon > 0] = cv2.GC_PR_FGD
    mask[interior & core] = cv2.GC_FGD
    if blue:
        # The orbit crosses the lower-left green edge. Independent GrabCut
        # estimates used to treat the dark fold below that bright line as
        # background on some frames. Keep actual green cloth as a foreground
        # seed throughout the entire guide collar, including the free corner.
        green_cloth = (g > r * 1.15) & (g > b * .98) & (g > 14)
        mask[collar & green_cloth] = cv2.GC_FGD
    background, foreground = np.zeros((1,65), np.float64), np.zeros((1,65), np.float64)
    cv2.grabCut(frame, mask, None, background, foreground, iterations, cv2.GC_INIT_WITH_MASK)
    result = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)
    result = ndimage.binary_fill_holes(result)
    return result.astype(float)


def poster(frame, mask, theme, native_light=False):
    color = frame.astype(float) / 255
    coverage = np.clip(mask.sum(axis=2), 0, 1)[..., None]
    residual = np.maximum(color - np.array([.055,.035,.085]), 0)
    peak = residual.max(axis=2)[...,None]
    y, x = np.mgrid[0:720, 0:896]
    radius = np.sqrt(((x/895-.5)*1.8)**2 + ((y/719-.5)*1.6)**2)[...,None]
    fade = np.clip((1.05-radius)/.4, 0, 1)
    fade = fade * fade * (3 - 2*fade)
    for edge in (x/895, 1-x/895, y/719, 1-y/719):
        factor = np.clip(edge/.07,0,1)[...,None]
        fade *= factor*factor*(3-2*factor)
    if native_light:
        alpha = coverage+fade*(1-coverage)
        return Image.fromarray(np.clip(np.concatenate([color,alpha],axis=2)*255,0,255).astype(np.uint8), "RGBA")
    alpha_bg = peak**1.2 * (.9 if theme == "dark" else .48) * fade
    tint = np.array([.52,.28,.80] if theme == "dark" else [.59,.42,.79])
    shine = np.clip((peak-.15)/.65,0,1)
    bg = tint*(1-shine) + np.clip(residual/np.maximum(peak,.001),0,1)*shine if theme == "dark" else np.broadcast_to(tint,color.shape)
    alpha = coverage + alpha_bg*(1-coverage)
    premultiplied = color*coverage + bg*alpha_bg*(1-coverage)
    straight = premultiplied / np.maximum(alpha,.001)
    rgba = np.concatenate([straight,alpha],axis=2)
    return Image.fromarray(np.clip(rgba*255,0,255).astype(np.uint8), "RGBA")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg")
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--source", type=Path)
    parser.add_argument("--native-light", action="store_true")
    args = parser.parse_args()
    import imageio_ffmpeg
    ffmpeg = args.ffmpeg or imageio_ffmpeg.get_ffmpeg_exe()
    media = ROOT / "public/media/global-experience"
    source = args.source or media / "flags-film-dark.mp4"
    cv2.setNumThreads(2)
    if not args.native_light: hems, sides = track_corner(source)
    decoder = subprocess.Popen([ffmpeg,"-v","error","-i",str(source),*(["-frames:v","1"] if args.preview else []),"-f","rawvideo","-pix_fmt","rgb24","pipe:1"],stdout=subprocess.PIPE)
    temporary = media / ("flags-film-native-light.working.mp4" if args.native_light else "flags-film-masked.working.mp4")
    encoder = None if args.preview else subprocess.Popen([ffmpeg,"-v","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s","896x1440","-r","24","-i","pipe:0","-an","-c:v","libx264","-preset","slow","-crf","19","-pix_fmt","yuv420p","-movflags","+faststart","-g","48",str(temporary)],stdin=subprocess.PIPE)
    index = 0
    cv2.setNumThreads(2)
    try:
        while raw := decoder.stdout.read(896*720*3):
            frame = np.frombuffer(raw,np.uint8).reshape(720,896,3)
            small = cv2.resize(frame,(448,360),interpolation=cv2.INTER_AREA)
            t = index/24
            tip = guide(CN_TIPS,t)
            iterations = 1 if args.native_light else 2
            cn = segment(small,[[86,30],tip,[280,215],[64,150]],iterations=iterations)
            kg_points = guide(KG,t)
            kg = segment(small,kg_points,iterations=iterations)
            # The red flags share colors: keep their visible overlap boundary
            # on the rotoscoped leading edge of the foreground Kyrgyz flag.
            gate = np.zeros((360,448),np.uint8)
            cv2.fillPoly(gate,[np.rint([kg_points[0],[470,-20],[470,390],kg_points[3]]).astype(np.int32)],1)
            kg *= gate
            uz = segment(small,guide(UZ,t),blue=True,iterations=iterations)
            # Dark purple gaps can resemble the red fabric's darkest folds to
            # the statistical matte. Red dominance separates these gaps while
            # retaining gold symbols and reflected light on the red cloth.
            rgb = small.astype(float)
            red_coverage = np.clip((rgb[...,0] - rgb[...,2]*1.04) / 18, 0, 1)
            red_coverage = np.maximum(red_coverage, np.clip((rgb.max(axis=2)-130)/60,0,1))
            cn *= red_coverage
            kg *= red_coverage
            # Painter order is encoded once in the matte, not on the website.
            kg *= 1-uz
            cn *= (1-uz)*(1-kg)
            masks = np.stack([cn,kg,uz],axis=2)
            masks = cv2.resize(masks,(896,720),interpolation=cv2.INTER_LINEAR)
            masks = cv2.GaussianBlur(masks,(0,0),.65)
            if not args.native_light:
                masks[...,2] = protect_corner(masks[...,2], hems[index], sides[index])
            if index == 0:
                for theme in (("light",) if args.native_light else ("dark","light")):
                    name = "flags-native-light-poster.webp" if args.native_light else f"flags-isolated-{theme}-poster.webp"
                    poster(frame,masks,theme,args.native_light).save(media/name,quality=90)
                Image.fromarray((masks*255).astype(np.uint8)).save(ROOT/"scratch/flags-id-matte.png")
                if args.preview: break
            if encoder:
                packed = np.vstack([frame,(masks*255).astype(np.uint8)])
                encoder.stdin.write(packed.tobytes())
            if index % 48 == 0: print(f"Matte {index}/226",flush=True)
            index += 1
    finally:
        decoder.stdout.close()
        decoder.wait()
        if encoder:
            encoder.stdin.close()
            encoder.wait()
    if encoder and (encoder.returncode or decoder.returncode):
        raise RuntimeError("Packed film encoding failed")
    if encoder:
        temporary.replace(media/("flags-film-native-light-v1.mp4" if args.native_light else "flags-film-masked-v3.mp4"))


if __name__ == "__main__":
    main()
