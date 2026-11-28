# Lay out the scenes of the separable-verbs video (remotion/separableVerbs.json)
# on Emma's recording: writes the voice track and remotion/separableTimeline.json.
#
#   python3 -I build_track.py [--reel] <content.json> <out_timeline.json> [<rec_48k_mono.wav> <clips.json> <out_voice.wav> [<music_48k_mono.wav>]]
#
# --reel lays out the short cut for Instagram Reels / YouTube Shorts instead: the scenes listed in
# the content's "reel" (with its dur overrides), into remotion/separableTimelineReel.json and
# raw/separable_voice_reel.wav. Without it, the scenes marked "only": "reel" are left out.
#
# The recording (Emma, 23 Nov 2026): three takes in Google Drive, "23 Nov at 18-51.m4a" (the 7 verbs),
# "23 Nov at 18-52.m4a" (samen1-2, quiz1-4) and "23 Nov at 19-07.m4a" (uitkleden, opnemen, aannemen,
# quiz5-6). Joined in that order with 1 s of silence in between:
#   npx remotion ffmpeg -i <take>.m4a -ac 1 -ar 48000 -c:a pcm_s16le <take>.wav   (afconvert writes a WAV Python's wave can't read)
# scheidbaar/clips.json holds the clip times in that joined file (energy-based speech detection,
# checked against a whisper transcript). Music: raw/music/tomorrows-light.mp3, converted the same way.
#
# clips.json maps every clip name in the content ("opstaan.inf", "opstaan.s", "samen1", "quiz1", …)
# to [t0, t1] seconds in the recording. Without a recording the timeline gets estimated
# clip lengths, so the video can be previewed before the voice is there.
import sys, wave, array, math, json

REEL = "--reel" in sys.argv
if REEL: sys.argv.remove("--reel")
content_path, out_json = sys.argv[1:3]
REC = len(sys.argv) > 3
CONTENT = json.load(open(content_path))
if REEL:
    by_id = {s["id"]: s for s in CONTENT["scenes"]}
    scenes = [{**by_id[i], **({"dur": CONTENT["reel"]["dur"][i]} if i in CONTENT["reel"]["dur"] else {})} for i in CONTENT["reel"]["scenes"]]
else:
    scenes = [s for s in CONTENT["scenes"] if s.get("only") != "reel"]
SR = 48000

if REC:
    rec_path, clips_path, out_wav = sys.argv[3:6]
    w = wave.open(rec_path); assert w.getframerate() == SR and w.getnchannels() == 1, "convert: afconvert -f WAVE -d LEI16@48000 -c 1"
    A = array.array("h", w.readframes(w.getnframes())); w.close()
    clips = json.load(open(clips_path))
    # Level every clip to the same loudness (p90 of 20 ms RMS), peaks under -1 dBFS.
    TARGET = -13.0
    def level(a, b):
        x = A[int(a * SR):int(b * SR)]; win = int(0.02 * SR)
        rms = sorted(math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, max(1, len(x) - win), win))
        p90 = rms[int(0.9 * (len(rms) - 1))] / 32768
        g = 10 ** (max(-6.0, min(12.0, TARGET - 20 * math.log10(p90 + 1e-9))) / 20)
        return min(g, (0.89 * 32767) / (max(abs(v) for v in x) or 1))
    GAIN = {k: level(*v) for k, v in clips.items()}
    clip_len = lambda k: clips[k][1] - clips[k][0]
else:
    clip_len = lambda k: 0.9 if k.endswith(".inf") else 2.0

out = array.array("h"); VOICE, DINGS = [], []
now = lambda: len(out) / SR
def silence(sec): out.extend([0] * int(round(sec * SR)))
def clip(k):
    """Append one recorded clip (or silence of its estimated length); returns its start in the track."""
    t = now()
    if not REC: silence(clip_len(k)); return t
    a, b = clips[k]; i0, i1 = int(a * SR), min(len(A), int(b * SR)); f = int(0.015 * SR); g = GAIN[k]
    VOICE.append([len(out)])
    for i in range(i0, i1):
        e = min(1.0, (i - i0) / f, (i1 - i) / f)
        out.append(max(-32767, min(32767, int(A[i] * g * e))))
    VOICE[-1].append(len(out))
    return t

timeline = []
for s in scenes:
    start = now(); t = dict(id=s["id"], start=round(start, 3))
    k = s["kind"]
    if k == "hook":
        # Emma's voice almost at once, then time to read "why does op go to the end?".
        silence(0.25); a = clip(s["clips"][0]); silence(2.4)
        t["voice"] = [round(a - start, 3)]
    elif k == "verb":
        silence(0.5); a = clip(s["clips"][0]); silence(0.7); b = clip(s["clips"][1]); silence(1.6)
        t["voice"] = [round(a - start, 3), round(b - start, 3)]
    elif k == "together":
        silence(0.6); a = clip(s["clips"][0]); silence(1.6); b = clip(s["clips"][1]); silence(2.2)
        t["voice"] = [round(a - start, 3), round(b - start, 3)]
    elif k == "beware":
        silence(0.6); t["voice"] = []
        for gi, g in enumerate(s["groups"]):
            if gi: silence(0.8)
            for v in g["verbs"]:
                t["voice"].append(round(clip(v["clip"]) - start, 3)); silence(0.8)
        silence(1.8)
    elif k == "meaning":
        silence(0.35 + 5.2); t["reveal"] = round(now() - start, 3)
        DINGS.append(len(out)); silence(0.4); a = clip(s["clips"][0]); silence(1.6)
        t["voice"] = [round(a - start, 3)]
    elif k == "quiz":
        silence(0.35 + 3.6); t["reveal"] = round(now() - start, 3)
        DINGS.append(len(out)); silence(0.4); a = clip(s["clips"][0]); silence(1.4)
        t["voice"] = [round(a - start, 3)]
    else:
        silence(s["dur"])
    t["dur"] = round(now() - start, 3)
    timeline.append(t)

if REC:
    # A soft "ding" at every quiz answer.
    n = int(0.8 * SR)
    D = [min(1.0, (i / SR) / 0.005) * math.exp(-(i / SR) / 0.22) * (0.16 * math.sin(2 * math.pi * 1046.5 * i / SR) + 0.10 * math.sin(2 * math.pi * 1568.0 * i / SR) + 0.04 * math.sin(2 * math.pi * 2093.0 * i / SR)) for i in range(n)]
    for p0 in DINGS:
        for i, v in enumerate(D):
            if p0 + i < len(out): out[p0 + i] = max(-32767, min(32767, out[p0 + i] + int(v * 32767)))
    # Music (Tomorrow's Light) when nobody talks for a while, very soft under the talking.
    if len(sys.argv) > 6:
        m = wave.open(sys.argv[6]); assert m.getframerate() == SR and m.getnchannels() == 1
        TL = array.array("h", m.readframes(m.getnframes())); m.close(); N = len(out)
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
            if x["id"] in ("title", "cta"):
                for j in range(int(x["start"] * SR), min(N, int((x["start"] + x["dur"]) * SR))): loud[j] = 1
        g = 0.0
        for i in range(N):
            target = 0.035 if talk[i] else (0.30 if loud[i] else 0.17)
            g += (target - g) * 0.00025
            fade = min(1.0, (N - i) / (2.0 * SR))
            out[i] = max(-32767, min(32767, out[i] + int(TL[i % len(TL)] * g * fade)))
    ww = wave.open(out_wav, "wb"); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes(out.tobytes()); ww.close()

json.dump(dict(total=round(now(), 3), voice=REC, scenes=timeline), open(out_json, "w"), ensure_ascii=False, indent=1)
print(f"{len(timeline)} scenes, {now():.1f}s{'' if REC else ' (estimated, no recording)'}")
