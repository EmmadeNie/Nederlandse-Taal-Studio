# Lay out the scenes of the inversie short on Emma's recording (the voice version):
# writes the voice track and remotion/inversionTimeline.json.
#
#   python3 -I inversie/build_voice.py remotion/inversion.json inversie/clips.json raw/inversie/rec_all.wav remotion/inversionTimeline.json raw/inversie/voice.wav
#
# Every scene keeps its own length (dur in inversion.json) unless its clips need more.
# A scene's vo lists [clip, at]: the clip starts at `at` seconds into the scene, or, with
# at 0, right after the clip before it. The timeline gives each clip's [start, end] in the
# scene, so InversionShort.jsx can time its animations to the voice. Music is mixed in Remotion.
import sys, wave, array, math, json

content_path, clips_path, rec_path, out_json, out_wav = sys.argv[1:6]
scenes = json.load(open(content_path))["scenes"]
clips = {k: v for k, v in json.load(open(clips_path)).items() if not k.startswith("_")}
SR = 48000
GAP = 0.45   # between two clips in one scene
TAIL = 1.4   # after the last clip, before the scene ends
PAD = 0.08   # extra recording around each clip (breath in, decay)

w = wave.open(rec_path); assert w.getframerate() == SR and w.getnchannels() == 1, "convert to 48 kHz mono WAV first"
A = array.array("h", w.readframes(w.getnframes())); w.close()

# Level every clip to the same loudness (p90 of 20 ms RMS), peaks under -1 dBFS.
TARGET = -12.0
def level(a, b):
    x = A[int(a * SR):int(b * SR)]; win = int(0.02 * SR)
    rms = sorted(math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, max(1, len(x) - win), win))
    p90 = rms[int(0.9 * (len(rms) - 1))] / 32768
    g = 10 ** (max(-6.0, min(12.0, TARGET - 20 * math.log10(p90 + 1e-9))) / 20)
    return min(g, (0.89 * 32767) / (max(abs(v) for v in x) or 1))

span = lambda k: (max(0.0, clips[k][0] - PAD), min(len(A) / SR, clips[k][1] + PAD))
total = 0.0; timeline = []; place = []
for s in scenes:
    t = dict(id=s["id"], start=round(total, 3)); end = 0.0; voice = []
    for k, at in s.get("vo", []):
        a, b = span(k)
        st = (end - at if at < 0 else max(at, end + GAP)) if voice else at  # at < 0: that long after the clip before
        voice.append([round(st, 3), round(st + b - a, 3)]); end = st + b - a
        place.append((total + st, k))
    t["dur"] = round(max(s["dur"], end + s.get("tail", TAIL)) if voice else s["dur"], 3)
    if voice: t["voice"] = voice
    timeline.append(t); total += t["dur"]

out = array.array("h", [0] * int(math.ceil(total * SR)))
for at, k in place:
    a, b = span(k); i0, i1 = int(a * SR), int(b * SR); g = level(*clips[k]); f = int(0.015 * SR); o = int(at * SR)
    for i in range(i0, i1):
        e = min(1.0, (i - i0) / f, (i1 - i) / f)
        out[o + i - i0] = max(-32767, min(32767, out[o + i - i0] + int(A[i] * g * e)))

ww = wave.open(out_wav, "wb"); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes(out.tobytes()); ww.close()
json.dump(dict(total=round(total, 3), scenes=timeline), open(out_json, "w"), ensure_ascii=False, indent=1)
print(f"{len(timeline)} scenes, {total:.1f}s, {len(place)} clips")
