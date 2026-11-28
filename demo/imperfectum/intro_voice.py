# Emma's intro alone (no music), at the Reel's level, for the long lesson video:
#   python3 -I intro_voice.py <rec_48k_mono.wav> <clips.json> <out.wav> [<n clips>]
# The clips "intro.1", "intro.2", "intro.3" (or the first n) from clips.json, 0.4 s apart, levelled like
# build_track.py (-19 dB). The quiz teaser uses the first 2: raw/imperfectum_teaser_voice.wav.
import sys, wave, array, math, json
rec, clips_path, out_path = sys.argv[1:4]
SR = 48000
w = wave.open(rec); assert w.getframerate() == SR and w.getnchannels() == 1
A = array.array("h", w.readframes(w.getnframes())); w.close()
clips = json.load(open(clips_path))
TARGET = -19.0
def level(a, b):
    x = A[int(a * SR):int(b * SR)]; win = int(0.02 * SR)
    rms = sorted(math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, max(1, len(x) - win), win))
    p90 = rms[int(0.9 * (len(rms) - 1))] / 32768
    g = 10 ** (max(-6.0, min(12.0, TARGET - 20 * math.log10(p90 + 1e-9))) / 20)
    return min(g, (0.89 * 32767) / (max(abs(v) for v in x) or 1))
out = array.array("h")
N = int(sys.argv[4]) if len(sys.argv) > 4 else 3
for n, k in enumerate(["intro.1", "intro.2", "intro.3"][:N]):
    if n: out.extend([0] * int(0.4 * SR))
    a, b = clips[k]; i0, i1 = int(a * SR), min(len(A), int(b * SR)); g = level(a, b); f = int(0.015 * SR)
    for i in range(i0, i1):
        e = min(1.0, (i - i0) / f, (i1 - i) / f)
        out.append(max(-32767, min(32767, int(A[i] * g * e))))
ww = wave.open(out_path, "wb"); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes(out.tobytes()); ww.close()
print(f"{len(out) / SR:.2f}s")
