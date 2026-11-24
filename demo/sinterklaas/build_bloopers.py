# Voice track + timeline for the Instagram story "Teaching Lamak Dutch" (the funny
# moments from the Sinterklaas recording). Same leveling as build_track.py.
# python3 -I build_bloopers.py <rec_48k.wav> <segs.json> <music.wav> <out_voice.wav> <out_timeline.json>
import sys, wave, array, math, json

src, segs_path, music_path, out_wav, out_json = sys.argv[1:6]
w = wave.open(src); SR = w.getframerate(); A = array.array("h", w.readframes(w.getnframes())); w.close()
segs = json.load(open(segs_path))

TARGET = -13.0
L = array.array("f", (float(x) for x in A))
for s in segs:
    i0, i1 = int(s["t0"] * SR), int(s["t1"] * SR)
    g = 10 ** (max(-6.0, min(12.0, TARGET - s["lvl"])) / 20)
    peak = max(abs(v) for v in A[i0:i1]) or 1
    g = min(g, (0.89 * 32767) / peak)
    fade = int(0.02 * SR)
    for i in range(i0, i1):
        k = min(1.0, (i - i0) / fade, (i1 - i) / fade)
        L[i] = A[i] * (1 + (g - 1) * k)

# Each moment: a stretch of the recording plus captions at seconds into it (timed with
# Whisper word timestamps). fix: the "Oops!" note.
MOMENTS = [
    dict(a=217.88, b=225.45, title="de surprise", caps=[
        (0.14, "De surprise.", None),
        (1.84, "De… surprise?", "🤔"),
        (3.32, "Sur… sur-prise?", None),
        (4.92, "Ja!", None),
        (5.84, "Ah, de surprise!", "✓"),
    ]),
    dict(a=23.66, b=30.05, title="een wit paard", caps=[
        (0.0, "Sinterklaas rijdt op een wit paard.", None),
        (2.96, "…op een witte paard.", None),
    ], fix=dict(at=4.4, wrong="witte", right="wit")),
    dict(a=162.12, b=172.39, title="de pepernoten", caps=[
        (0.14, "Pepernoten zijn lekker!", None),
        (1.72, "Pepernoten zijn lekker…", None),
        (5.24, "Nee, niet lekker!", "😬"),
        (7.24, "De pepernoten zijn vies!", "😄"),
    ]),
]
INTRO, GAP, OUTRO = 2.2, 0.5, 3.5

out = array.array("h")
def silence(sec): out.extend([0] * int(round(sec * SR)))
def clip(a, b):
    i0, i1 = int(a * SR), int(b * SR); f = int(0.015 * SR)
    for i in range(i0, i1):
        k = min(1.0, (i - i0) / f, (i1 - i) / f)
        out.append(max(-32767, min(32767, int(L[i] * k))))

scenes = [dict(kind="intro", start=0.0, dur=INTRO)]
silence(INTRO)
for m in MOMENTS:
    st = len(out) / SR
    silence(GAP); clip(m["a"], m["b"]); silence(GAP)
    s = dict(kind="moment", start=round(st, 3), dur=round(len(out) / SR - st, 3), voice=GAP, title=m["title"],
             caps=[dict(at=c[0], nl=c[1], emoji=c[2]) for c in m["caps"]])
    if "fix" in m: s["fix"] = m["fix"]
    scenes.append(s)
st = len(out) / SR; silence(OUTRO); scenes.append(dict(kind="outro", start=round(st, 3), dur=OUTRO))

# Tomorrow's Light: louder in the intro and outro, soft under the talking.
m = wave.open(music_path); M = array.array("h", m.readframes(m.getnframes())); m.close()
N = len(out); g = 0.0
for i in range(N):
    t = i / SR
    target = 0.30 if (t < INTRO or t >= st) else 0.05
    g += (target - g) * 0.00025
    fade = min(1.0, (N - i) / (1.0 * SR))
    out[i] = max(-32767, min(32767, out[i] + int(M[i % len(M)] * g * fade)))

ww = wave.open(out_wav, "wb"); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes(out.tobytes()); ww.close()
json.dump(dict(total=round(N / SR, 3), scenes=scenes), open(out_json, "w"), ensure_ascii=False, indent=1)
print(f"{N / SR:.1f}s")
