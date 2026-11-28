# Lay out the scenes of the double-infinitive Reel (remotion/dubbeleInfinitiefReel.json) on Emma's
# recording: writes the audio track (voice + music) and remotion/dubbeleInfinitiefReelTimeline.json.
# After imperfectum/build_track.py.
#
#   python3 -I build_track.py <content.json> <out_timeline.json> <out_audio.wav> <music_48k_mono.wav> [<rec_48k_mono.wav> <clips.json>]
#
# The script Emma reads: ontwerpen/Video's/Lessen/lesson_dubbele-infinitief_inspreektekst.txt.
# Only the intro is recorded ("intro.1" .. "intro.3"). Convert the recording first:
#   npx remotion ffmpeg -i <take>.m4a -ac 1 -ar 48000 -c:a pcm_s16le rec.wav
# and the music (raw/music/tomorrows-light.mp3) the same way. clips.json maps the clip names to
# [t0, t1] seconds in the recording. Without a recording the intro gets estimated lengths (silence,
# with the subtitles on screen), so the Reel can be previewed with music before the voice is there.
import sys, wave, array, math, json

content_path, out_json, out_wav, music_path = sys.argv[1:5]
REC = len(sys.argv) > 6
scenes = json.load(open(content_path))["scenes"]
SR = 48000

def read(path):
    w = wave.open(path); assert w.getframerate() == SR and w.getnchannels() == 1, f"{path}: convert to 48 kHz mono 16-bit"
    a = array.array("h", w.readframes(w.getnframes())); w.close(); return a

clips, GAIN = {}, {}
if REC:
    A = read(sys.argv[5])
    clips = {k: v for k, v in json.load(open(sys.argv[6])).items() if not k.startswith("_")}
    TARGET = -13.0  # every clip to the same loudness (p90 of 20 ms RMS), peaks under -1 dBFS
    def level(a, b):
        x = A[int(a * SR):int(b * SR)]; win = int(0.02 * SR)
        rms = sorted(math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, max(1, len(x) - win), win))
        p90 = rms[int(0.9 * (len(rms) - 1))] / 32768
        g = 10 ** (max(-6.0, min(12.0, TARGET - 20 * math.log10(p90 + 1e-9))) / 20)
        return min(g, (0.89 * 32767) / (max(abs(v) for v in x) or 1))
    GAIN = {k: level(*v) for k, v in clips.items()}
has = lambda k: k in clips
EST = {"intro.1": 2.4, "intro.2": 2.8, "intro.3": 2.4}

out = array.array("h"); VOICE, DINGS, ENDS = [], [], []
now = lambda: len(out) / SR
def silence(sec): out.extend([0] * int(round(sec * SR)))
def clip(k):
    """Append one recorded clip (or silence of its estimated length); returns its start in the track."""
    t = now()
    if not has(k): silence(EST[k]); ENDS.append(now()); return t
    a, b = clips[k]; i0, i1 = int(a * SR), min(len(A), int(b * SR)); f = int(0.015 * SR); g = GAIN[k]
    VOICE.append([len(out)])
    for i in range(i0, i1):
        e = min(1.0, (i - i0) / f, (i1 - i) / f)
        out.append(max(-32767, min(32767, int(A[i] * g * e))))
    VOICE[-1].append(len(out)); ENDS.append(now())
    return t

timeline = []
for s in scenes:
    start = now(); t = dict(id=s["id"], start=round(start, 3)); ENDS.clear()
    rel = lambda x: round(x - start, 3)
    if s["kind"] == "hook":
        # Title + the wrong sentence on frame 0, Emma's intro at once (subtitled), then time to read the hook.
        silence(0.4); t["voice"] = []
        for i, c in enumerate(s["clips"]):
            if i: silence(0.35)
            t["voice"].append(rel(clip(c)))
        silence(1.8)
    elif s["kind"] == "quiz":
        # The sentence, a 3-2-1 ring, a ding and the answer, then time to read it.
        silence(0.35 + 3.0); t["reveal"] = rel(now()); DINGS.append(len(out)); silence(2.6)
    else:
        silence(s["dur"])
    if ENDS: t["ends"] = [rel(e) for e in ENDS]
    t["dur"] = round(now() - start, 3)
    timeline.append(t)

# A soft "ding" at the quiz answer.
n = int(0.8 * SR)
D = [min(1.0, (i / SR) / 0.005) * math.exp(-(i / SR) / 0.22) * (0.16 * math.sin(2 * math.pi * 1046.5 * i / SR) + 0.10 * math.sin(2 * math.pi * 1568.0 * i / SR) + 0.04 * math.sin(2 * math.pi * 2093.0 * i / SR)) for i in range(n)]
for p0 in DINGS:
    for i, v in enumerate(D):
        if p0 + i < len(out): out[p0 + i] = max(-32767, min(32767, out[p0 + i] + int(v * 32767)))

# Music from the first frame: very soft under Emma's voice, a bit louder on the opening and the CTA.
TL = read(music_path); N = len(out)
talk = bytearray(N)
for a0, a1 in VOICE:
    for i in range(max(0, a0 - int(0.35 * SR)), min(N, a1 + int(0.45 * SR))): talk[i] = 1
i = 0; last = None  # close gaps under 1.5 s so the music doesn't pump
while i < N:
    if talk[i]:
        if last is not None and i - last < int(1.5 * SR):
            for j in range(last, i): talk[j] = 1
        while i < N and talk[i]: i += 1
        last = i
    else: i += 1
loud = bytearray(N)
for x in timeline:
    if x["id"] in ("hook", "cta"):
        for j in range(int(x["start"] * SR), min(N, int((x["start"] + x["dur"]) * SR))): loud[j] = 1
g = 0.30
for i in range(N):
    target = 0.035 if talk[i] else (0.30 if loud[i] else 0.17)
    g += (target - g) * 0.00025
    fade = min(1.0, (N - i) / (2.0 * SR))
    out[i] = max(-32767, min(32767, out[i] + int(TL[i % len(TL)] * g * fade)))
ww = wave.open(out_wav, "wb"); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes(out.tobytes()); ww.close()

json.dump(dict(total=round(now(), 3), voice=REC, scenes=timeline), open(out_json, "w"), ensure_ascii=False, indent=1)
print(f"{len(timeline)} scenes, {now():.1f}s{'' if REC else ' (intro estimated, no recording yet)'}")
