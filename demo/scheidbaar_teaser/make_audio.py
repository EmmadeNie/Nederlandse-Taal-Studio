# The audio of the separable-verbs teaser (remotion/SeparableTeaser.jsx):
#   python3 -I make_audio.py <rec_48k_mono.wav> <out_dir>
# Emma's line (25 Nov 2026, Google Drive "25 Nov at 20-35.m4a"): "Have you ever seen some random
# preposition at the end of this sentence and wondered: what is it doing here? Chances are it actually
# belongs to the verb." Cut [1.1, 12.95] s, levelled like the imperfectum reel (-19 dB), and a soft ding
# for the quiz answers. Writes teaser_sep_voice.wav and teaser_ding.wav.
import sys, wave, array, math
rec, out = sys.argv[1:3]
SR = 48000
w = wave.open(rec); assert w.getframerate() == SR and w.getnchannels() == 1
A = array.array("h", w.readframes(w.getnframes())); w.close()
a, b = 1.1, 12.95
x = A[int(a * SR):int(b * SR)]; win = int(0.02 * SR)
rms = sorted(math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, len(x) - win, win))
p90 = rms[int(0.9 * (len(rms) - 1))] / 32768
g = min(10 ** (max(-6.0, min(12.0, -19.0 - 20 * math.log10(p90 + 1e-9))) / 20), (0.89 * 32767) / max(abs(v) for v in x))
f = int(0.015 * SR)
o = array.array("h", (max(-32767, min(32767, int(v * g * min(1.0, i / f, (len(x) - i) / f)))) for i, v in enumerate(x)))
def save(name, data):
    ww = wave.open(f"{out}/{name}", "wb"); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes(data.tobytes()); ww.close()
save("teaser_sep_voice.wav", o)
n = int(0.8 * SR)
save("teaser_ding.wav", array.array("h", (int(32767 * min(1.0, (i / SR) / 0.005) * math.exp(-(i / SR) / 0.22) * (0.16 * math.sin(2 * math.pi * 1046.5 * i / SR) + 0.10 * math.sin(2 * math.pi * 1568.0 * i / SR) + 0.04 * math.sin(2 * math.pi * 2093.0 * i / SR))) for i in range(n))))
print(f"voice {len(o) / SR:.2f}s")
