# Sound effects for the imperfectum quiz teaser (remotion/ImperfectumTeaser.jsx), into raw/:
#   python3 -I teaser_sfx.py <out_dir>
# tick.wav: a short wooden click for the countdown; buzz.wav: a soft two-tone "nope" for the wrong answer.
# (The ding for the right answer is teaser_ding.wav from scheidbaar_teaser/make_audio.py.)
import sys, wave, array, math
out = sys.argv[1]; SR = 48000
def save(name, xs):
    w = wave.open(f"{out}/{name}", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(array.array("h", (max(-32767, min(32767, int(v * 32767))) for v in xs)).tobytes()); w.close()
n = int(0.06 * SR)
save("teaser_tick.wav", [0.35 * math.exp(-(i / SR) / 0.012) * math.sin(2 * math.pi * 1800 * i / SR) for i in range(n)])
n = int(0.34 * SR)
def buzz(i):
    t = i / SR; f = 220 if t < 0.15 else 175
    env = min(1.0, t / 0.01) * min(1.0, (0.34 - t) / 0.04)
    return 0.13 * env * (math.sin(2 * math.pi * f * t) + 0.4 * math.sin(2 * math.pi * 2 * f * t))
save("teaser_buzz.wav", [buzz(i) for i in range(n)])
print("ok")
