# Lay out the scenes of the past-tense Reel (remotion/imperfectumReel.json) on Emma's recording:
# writes the voice track and remotion/imperfectumReelTimeline.json. After scheidbaar/build_track.py.
#
#   python3 -I build_track.py <content.json> <out_timeline.json> [<rec_48k_mono.wav> <clips.json> <out_voice.wav> [<music_48k_mono.wav>]]
#
# The script Emma reads: ontwerpen/Video's/Lessen/lesson_imperfectum_reel_inspreektekst.txt.
# Convert the recording first (afconvert writes a WAV Python's wave can't read):
#   npx remotion ffmpeg -i <take>.m4a -ac 1 -ar 48000 -c:a pcm_s16le rec.wav
# clips.json maps the clip names in the content to [t0, t1] seconds in the recording. Since 25 Nov only
# the intro is recorded ("intro.1", "intro.2"); every clip that isn't in clips.json is silence of a
# reading length (EST), so the rest runs on text and music. Music: raw/music/a-stroll.mp3 (the
# lesson's track), converted the same way. Without a recording the timeline gets estimated clip
# lengths, so the video can be previewed before the voice is there.
import sys, wave, array, math, json

content_path, out_json = sys.argv[1:3]
REC = len(sys.argv) > 3
scenes = json.load(open(content_path))["scenes"]
SR = 48000

if REC:
    rec_path, clips_path, out_wav = sys.argv[3:6]
    w = wave.open(rec_path); assert w.getframerate() == SR and w.getnchannels() == 1, "convert to 48 kHz mono 16-bit"
    A = array.array("h", w.readframes(w.getnframes())); w.close()
    clips = {k: v for k, v in json.load(open(clips_path)).items() if not k.startswith("_")}
    # Level every clip to the same loudness (p90 of 20 ms RMS), peaks under -1 dBFS.
    TARGET = -19.0  # Emma, 25 Nov: "een stuk zachter" (was -13)
    def level(a, b):
        x = A[int(a * SR):int(b * SR)]; win = int(0.02 * SR)
        rms = sorted(math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, max(1, len(x) - win), win))
        p90 = rms[int(0.9 * (len(rms) - 1))] / 32768
        g = 10 ** (max(-6.0, min(12.0, TARGET - 20 * math.log10(p90 + 1e-9))) / 20)
        return min(g, (0.89 * 32767) / (max(abs(v) for v in x) or 1))
    GAIN = {k: level(*v) for k, v in clips.items()}
else:
    clips = {}
has = lambda k: k in clips
# Lines that aren't recorded (only the intro is, since 25 Nov) get time to read instead.
EST = {"intro.1": 2.4, "intro.2": 2.6, "intro.3": 2.8, "rule.word": 1.0, "rule.letters": 3.2, "cta": 1.6}
clip_len = lambda k: (clips[k][1] - clips[k][0]) if has(k) else EST.get(k, 0.9 if k.endswith(".inf") else 1.9)

out = array.array("h"); VOICE, DINGS, ENDS = [], [], []
now = lambda: len(out) / SR
def silence(sec): out.extend([0] * int(round(sec * SR)))
def clip(k):
    """Append one recorded clip (or silence of its estimated length); returns its start in the track."""
    t = now(); ENDS.append(None)
    if not has(k): silence(clip_len(k)); ENDS[-1] = now(); return t
    a, b = clips[k]; i0, i1 = int(a * SR), min(len(A), int(b * SR)); f = int(0.015 * SR); g = GAIN[k]
    VOICE.append([len(out)])
    for i in range(i0, i1):
        e = min(1.0, (i - i0) / f, (i1 - i) / f)
        out.append(max(-32767, min(32767, int(A[i] * g * e))))
    VOICE[-1].append(len(out)); ENDS[-1] = now()
    return t

timeline = []
for s in scenes:
    start = now(); t = dict(id=s["id"], start=round(start, 3)); ENDS.clear()
    k = s["kind"]
    rel = lambda x: round(x - start, 3)
    if k == "open":
        # The opening (28 Nov): 't kofschip = soft ketchup on frame 0, Emma's intro after 2 s of music,
        # then quickly on to the title screen.
        silence(2.0); t["voice"] = []  # 2 s of music first, then Emma (25 Nov)
        for i, c in enumerate(s["clips"]):
            if i: silence(s.get("gap", 0.4))  # Emma, 28 Nov: more space between the two sentences
            t["voice"].append(rel(clip(c)))
        silence(0.5)
    elif k == "hook":
        # The title screen, no voice: title + first example, the second at beats[1], then "werkte, but
        # belde. Why?" and time to read it.
        t["voice"] = list(s["beats"]); t["ends"] = [b + 0.5 for b in s["beats"]]
        silence(s["dur"])
    elif k == "rule":
        silence(0.4); a = clip(s["clips"][0]); silence(0.5); b = clip(s["clips"][1]); t["voice"] = [rel(a), rel(b)]
        # Then the soft ketchup card (with time to read it), then the -te / -de rows.
        silence(5.2)
    elif k == "verb":
        silence(0.4); a = clip(s["clips"][0]); silence(0.9 if s.get("trap") else 0.6); b = clip(s["clips"][1]); silence(2.4 if s.get("trap") else 1.4)
        t["voice"] = [rel(a), rel(b)]
    elif k == "quiz":
        silence(0.35 + 3.0); t["reveal"] = rel(now())
        DINGS.append(len(out)); silence(0.35); a = clip(s["clips"][0]); silence(1.5)
        t["voice"] = [rel(a)]
    elif k == "cta" and has(s["clips"][0]):
        silence(0.5); a = clip(s["clips"][0]); silence(max(0.0, s["dur"] - 0.5 - clip_len(s["clips"][0])))
        t["voice"] = [rel(a)]
    else:
        silence(s["dur"])
    if ENDS and k != "hook": t["ends"] = [round(e - start, 3) for e in ENDS]  # where each clip of the scene ends
    t["dur"] = round(now() - start, 3)
    timeline.append(t)

if REC:
    # A soft "ding" at the quiz answer.
    n = int(0.8 * SR)
    D = [min(1.0, (i / SR) / 0.005) * math.exp(-(i / SR) / 0.22) * (0.16 * math.sin(2 * math.pi * 1046.5 * i / SR) + 0.10 * math.sin(2 * math.pi * 1568.0 * i / SR) + 0.04 * math.sin(2 * math.pi * 2093.0 * i / SR)) for i in range(n)]
    for p0 in DINGS:
        for i, v in enumerate(D):
            if p0 + i < len(out): out[p0 + i] = max(-32767, min(32767, out[p0 + i] + int(v * 32767)))
    # Music: louder on the call to action and wherever nobody talks, very soft under the talking.
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
            if x["id"] in ("open", "hook", "cta"):
                for j in range(int(x["start"] * SR), min(N, int((x["start"] + x["dur"]) * SR))): loud[j] = 1
        g = 0.30  # the music is there from the first frame
        for i in range(N):
            target = 0.035 if talk[i] else (0.30 if loud[i] else 0.17)
            g += (target - g) * 0.00025
            fade = min(1.0, (N - i) / (2.0 * SR))
            out[i] = max(-32767, min(32767, out[i] + int(TL[i % len(TL)] * g * fade)))
    ww = wave.open(out_wav, "wb"); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes(out.tobytes()); ww.close()

json.dump(dict(total=round(now(), 3), voice=REC, scenes=timeline), open(out_json, "w"), ensure_ascii=False, indent=1)
print(f"{len(timeline)} scenes, {now():.1f}s{'' if REC else ' (estimated, no recording)'}")
