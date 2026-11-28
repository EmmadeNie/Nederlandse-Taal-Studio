# Time the niet/geen lesson on Emma's recording: writes the voice track (raw/niet-geen/voice.wav)
# and the timing into remotion/nietGeen.json (scene dur, story beats, split, row times, quiz reveal).
#
#   python3 -I niet-geen/build_voice.py remotion/nietGeen.json niet-geen/clips.json raw/niet-geen/rec.wav raw/niet-geen/voice.wav
#   python3 -I niet-geen/build_voice.py remotion/nietGeen.json niet-geen/clips_reel.json raw/niet-geen/rec_reel.wav raw/niet-geen/voice_reel.wav reel
#
# The last argument is the cut (default: the full lesson); its voice goes into voice[cut] = {file, talk}.
#
# Convert the recording first: npx remotion ffmpeg -i rec.m4a -ac 1 -ar 48000 -c:a pcm_s16le rec.wav
# Each scene of the full lesson plays one continuous chunk of the recording (clips.json says which,
# and when its sentences appear). A quiz keeps its thinking time: Emma's answer starts at the reveal.
# Music is mixed in Remotion: soft while she talks (talk = when, in the full lesson), back up in between.
import sys, wave, array, math, json

content_path, clips_path, rec_path, out_wav = sys.argv[1:5]
cut = sys.argv[5] if len(sys.argv) > 5 else "full"
C = json.load(open(content_path))
clips = {k: v for k, v in json.load(open(clips_path)).items() if not k.startswith("_")}
SR = 48000
w = wave.open(rec_path); assert w.getframerate() == SR and w.getnchannels() == 1, "convert to 48 kHz mono WAV first"
A = array.array("h", w.readframes(w.getnframes())); w.close()

TARGET = -13.0  # every chunk to the same loudness (p90 of 20 ms RMS), peaks under -1 dBFS
def gain(a, b):
    x = A[int(a * SR):int(b * SR)]; win = int(0.02 * SR)
    rms = sorted(math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, max(1, len(x) - win), win))
    p90 = rms[int(0.9 * (len(rms) - 1))] / 32768
    g = 10 ** (max(-6.0, min(12.0, TARGET - 20 * math.log10(p90 + 1e-9))) / 20)
    return min(g, (0.89 * 32767) / (max(abs(v) for v in x) or 1))

out = array.array("h")
talk = []  # [start, end] of each chunk in the track, for the music ducking
def put(at, a, b):
    """Recording [a, b] into the track at `at` seconds, with 15 ms fades."""
    talk.append([round(at, 2), round(at + b - a, 2)])
    i0 = int(round(at * SR)); n = int((b - a) * SR); f = int(0.015 * SR); g = gain(a, b); s0 = int(a * SR)
    if len(out) < i0 + n: out.extend([0] * (i0 + n - len(out)))
    for i in range(n):
        e = min(1.0, i / f, (n - i) / f)
        out[i0 + i] = max(-32767, min(32767, out[i0 + i] + int(A[s0 + i] * g * e)))

r3 = lambda x: round(x, 2)
total = 0.0
byId = {s["id"]: s for s in C["scenes"]}
for s in [s for s in C["scenes"] if not s.get("cut")] if cut == "full" else [byId[i] for i in C["cuts"][cut]]:
    c = clips.get(s["id"])
    if c and "chunk" in c:
        a, b = c["chunk"]; lead = c["lead"]
        at = lambda r: r3(lead + r - a)  # recording time -> time in the scene
        dur = lead + (b - a) + c["tail"]
        put(total + lead, a, b)
        if s["kind"] == "story":
            starts = [0.0] + [at(x["at"]) for x in c["beats"][1:]] + [dur]
            for i, (beat, x) in enumerate(zip(s["beats"], c["beats"])):
                beat["dur"] = r3(starts[i + 1] - starts[i])
                if "card" in x: beat["card"] = r3(at(x["card"]) - starts[i])
                else: beat.pop("card", None)
        if s["kind"] == "split":
            for col, ts in zip(s["cols"], c["cols"]): col["at"] = [at(t) for t in ts]
            s["punchAt"] = at(c["punch"])
        if s["kind"] == "rule":
            for row, t in zip(s["rows"], c["rows"]): row["at"] = at(t)
        if s["kind"] == "trick":
            s["rowsAt"] = [at(t) for t in c["rows"]]
        if s["kind"] != "story": s["dur"] = r3(dur)
        total += sum(x["dur"] for x in s["beats"]) if s["kind"] == "story" else s["dur"]
    elif c and "answer" in c:
        a, b = c["answer"]
        put(total + s["reveal"] - 0.1, a, b)
        s["dur"] = r3(s["reveal"] - 0.1 + (b - a) + 1.4)
        total += s["dur"]
    else:
        total += s["dur"]
out.extend([0] * max(0, int(total * SR) - len(out)))

C.setdefault("voice", {})[cut] = {"file": "niet-geen/" + out_wav.split("/")[-1], "talk": talk}
open(content_path, "w").write(json.dumps(C, ensure_ascii=False, indent=2) + "\n")
o = wave.open(out_wav, "w"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes(out.tobytes()); o.close()
print(f"{out_wav}: {total:.1f} s")
