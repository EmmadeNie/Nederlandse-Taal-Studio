# Build the voice track and scene timeline for the Sinterklaas YouTube video.
# python3 -I build_track.py <rec2_48k.wav> <segs.json> <out_voice.wav> <out_timeline.json>
import sys, wave, array, math, json

src, segs_path, out_wav, out_json = sys.argv[1:5]
w = wave.open(src); SR = w.getframerate(); A = array.array("h", w.readframes(w.getnframes())); w.close()
segs = json.load(open(segs_path))

def db(x): return 20 * math.log10(x + 1e-9)

# 1. Level every speech segment to the same loudness (p90 of 20 ms RMS) so Lamak matches Emma.
TARGET = -13.0
L = array.array("f", (float(x) for x in A))
for s in segs:
    i0, i1 = int(s["t0"] * SR), int(s["t1"] * SR)
    gain_db = max(-6.0, min(12.0, TARGET - s["lvl"]))
    g = 10 ** (gain_db / 20)
    peak = max(abs(v) for v in A[i0:i1]) or 1
    g = min(g, (0.89 * 32767) / peak)  # keep peaks under -1 dBFS
    fade = int(0.02 * SR)
    for i in range(i0, i1):
        k = min(1.0, (i - i0) / fade, (i1 - i) / fade)  # ramp the gain in and out
        L[i] = A[i] * (1 + (g - 1) * k)
# Quiet the room between segments a little.
inside = bytearray(len(A))
for s in segs:
    for i in range(int(s["t0"] * SR), int(s["t1"] * SR)): inside[i] = 1
for i in range(len(L)):
    if not inside[i]: L[i] *= 0.5

def cut(lo, hi):
    """Quietest 10 ms point between lo and hi seconds: a safe place to cut inside running speech."""
    win = int(0.01 * SR); best = (1e18, lo)
    for i in range(int(lo * SR), int(hi * SR) - win, win):
        e = sum(L[j] * L[j] for j in range(i, i + win))
        if e < best[0]: best = (e, i / SR)
    return round(best[1] + 0.005, 3)

c_w2 = cut(60.2, 61.8)     # "…pakjesavond. | Op pakjesavond…"
c_g = cut(253.4, 254.8)    # "…een gedicht. | Het gedicht rijmt niet."
c_aan = cut(271.2, 272.6)  # "Aankomen. | Sinterklaas komt morgen aan."

# 2. Scenes. kind: title / word / line / verbsIntro / verb / verbsTip / quizIntro / quiz / outro / cta
W = [
  dict(art=None, nl="Sinterklaas", en="Saint Nicholas", syl=["Sin", "ter", "klaas"], stress=2,
       tip="*aa* is a long “ah”, like in *father*."),
  dict(art="de", nl="pakjesavond", en="“gifts or parcels evening”", syl=["pak", "jes", "a", "vond"], stress=0,
       tip="The *j* sounds like the English *y* in *yes*."),
  dict(art=None, nl="je schoen zetten", en="to put out your shoe", syl=["schoen", "zet", "ten"], stress=0,
       tip="*sch* is *s* + the throaty *ch*. And *oe* sounds like *oo* in *food*."),
  dict(art="de", nl="pepernoten", en="small spiced biscuits", syl=["pe", "per", "no", "ten"], stress=0,
       tip="A syllable that ends in a vowel has a long vowel: *pe* like *pay*, *no* like *no*."),
  dict(art="de", nl="chocoladeletter", en="a chocolate letter", syl=["cho", "co", "la", "de", "let", "ter"], stress=2,
       tip="Here *ch* sounds like the English *sh*."),
  dict(art="de", nl="surprise", en="a disguised homemade gift", syl=["sur", "pri", "se"], stress=1,
       tip="A French word: the *s* at the end sounds like a *z*."),
  dict(art="het", nl="gedicht", en="a poem", syl=["ge", "dicht"], stress=1,
       tip="*g* and *ch* are the same throaty sound, from the back of your throat."),
]
S = []
def word(i, a, b): S.append(dict(kind="word", w=i, a=a, b=b))
def line(i, a, b, nl, en, hl=None): S.append(dict(kind="line", w=i, a=a, b=b, nl=nl, en=en, hl=hl))

S.append(dict(kind="title", dur=5.5))
S.append(dict(kind="repeat", a=0.82, b=2.09))
word(0, 3.06, 9.85)
line(0, 10.66, 16.47, "Sinterklaas komt met de stoomboot.", "Sinterklaas comes by steamboat.", "stoomboot")
line(0, 23.66, 30.05, "Sinterklaas rijdt op een wit paard.", "Sinterklaas rides a white horse.", "paard")
S[-1]["fix"] = dict(at=26.62 - 23.66, wrong="witte", right="wit", note="*het* paard → *een wit* paard. No *-e* here! 🐴")
line(0, 30.84, 34.87, "Waar is Sinterklaas nu?", "Where is Sinterklaas now?", "Sinterklaas")
word(1, 35.96, 39.41)
S.append(dict(kind="slow", w=1, a=39.70, b=45.15))
word(1, 45.60, 48.25)
line(1, 53.32, c_w2, "Vanavond is het pakjesavond!", "Tonight is the night of presents!", "pakjesavond")
line(1, c_w2, 70.03, "Op pakjesavond krijgen we cadeautjes.", "On pakjesavond we get presents.", "cadeautjes")
line(1, 73.68, 88.37, "Wat heb jij gekregen op pakjesavond?", "What did you get on pakjesavond?", "gekregen")
word(2, 96.32, 107.07)
line(2, 107.28, 112.71, "Mag ik vanavond mijn schoen zetten?", "Can I put out my shoe tonight?", "schoen zetten")
line(2, 112.94, 119.43, "Ik zet mijn schoen bij de open haard.", "I put my shoe by the fireplace.", "zet")
line(2, 119.94, 127.71, "Er zit een wortel in mijn schoen, voor het paard.", "There's a carrot in my shoe, for the horse.", "wortel")
word(3, 128.26, 142.67)
line(3, 151.60, 157.11, "Wie wil er pepernoten?", "Who wants some pepernoten?", "pepernoten")
line(3, 157.16, 162.07, "Ik koop een zak pepernoten.", "I'm buying a bag of pepernoten.", "zak")
line(3, 162.12, 168.79, "Pepernoten zijn lekker!", "Pepernoten are tasty!", "lekker")
line(3, 169.54, 172.39, "De pepernoten zijn vies! 😄", "…or not: pepernoten are gross!", "vies")
word(4, 172.76, 184.07)
line(4, 185.62, 188.33, "Mijn chocoladeletter is de E van Emma.", "My chocolate letter is the E for Emma.", "E")
line(4, 188.48, 190.37, "Wat is jouw chocoladeletter?", "What's your chocolate letter?", "jouw")
S.append(dict(kind="line", w=4, parts=[(207.04, 209.79), (210.84, 212.33)], nl="Mijn chocoladeletter is de L van Lamak.",
              en="My chocolate letter is the L for Lamak.", hl="L"))
line(4, 212.80, 217.79, "Ik eet mijn chocoladeletter op.", "I'm eating my chocolate letter.", "eet")
word(5, 217.88, 225.45)
line(5, 225.94, 229.55, "Wat een mooie surprise!", "What a lovely surprise!", "surprise")
line(5, 230.42, 235.15, "Ik maak een surprise voor mijn collega.", "I'm making a surprise for my colleague.", "maak")
line(5, 235.25, 240.12, "Wat zit er in de surprise?", "What's inside the surprise?", "in")
word(6, 240.17, 243.49)
line(6, 243.94, 248.41, "Lees je gedicht maar voor!", "Go on, read your poem out loud!", "voor")
line(6, 248.50, c_g, "Sinterklaas schrijft een gedicht.", "Sinterklaas writes a poem.", "schrijft")
line(6, c_g, 258.37, "Het gedicht rijmt niet!", "The poem doesn't rhyme!", "rijmt")

S.append(dict(kind="verbsIntro", dur=6.0))
S.append(dict(kind="verb", a=268.82, b=277.35, inf=["aan", "komen"], nl="Sinterklaas komt morgen aan.",
              en="Sinterklaas arrives tomorrow.", verb="komt", part="aan"))
S.append(dict(kind="verbsTip", dur=6.0))
S.append(dict(kind="verb", a=409.42, b=416.93, inf=["in", "pakken"], nl="Ik pak het cadeautje in.",
              en="I wrap the present.", verb="pak", part="in"))
S.append(dict(kind="verb", a=416.96, b=423.25, inf=["uit", "pakken"], nl="Ik pak mijn cadeautje uit!",
              en="I unwrap my present!", verb="pak", part="uit"))
S.append(dict(kind="verb", a=423.28, b=430.89, inf=["op", "eten"], nl="Ik eet mijn chocoladeletter op.",
              en="I eat up my chocolate letter.", verb="eet", part="op"))

S.append(dict(kind="quizIntro", dur=4.5))
Q = [
  ("Sinterklaas komt met de ___.", "stoomboot", "Sinterklaas comes by …", 10.66, 13.25),
  ("Mag ik vanavond mijn ___ zetten?", "schoen", "Can I put out my … tonight?", 107.28, 109.37),
  ("Wie wil er ___?", "pepernoten", "Who wants some …?", 151.60, 154.23),
  ("Mijn ___ is de E van Emma.", "chocoladeletter", "My … is the E for Emma.", 185.62, 188.33),
  ("Wat een mooie ___!", "surprise", "What a lovely …!", 225.94, 227.53),
  ("Een Sinterklaasgedicht moet ___.", "rijmen", "A Sinterklaas poem has to …", 383.20, 385.47),
  ("Ik pak mijn cadeautje ___!", "uit", "I unwrap my present!", 418.26, 421.17),
  ("Lees je ___ maar voor!", "gedicht", "Go on, read your … out loud!", 243.94, 245.95),
]
for i, (q, ans, en, a, b) in enumerate(Q):
    S.append(dict(kind="quiz", n=i + 1, total=len(Q), q=q, ans=ans, en=en, think=5.0, a=a, b=b))
S.append(dict(kind="outro", a=431.84, b=433.27))
S.append(dict(kind="cta", dur=7.0))

# 3. Lay the scenes out on the timeline and write the voice track.
LEAD, TAIL = 0.35, 0.6
out = array.array("h"); t = 0.0
DINGS, VOICE = [], []
def silence(sec): out.extend([0] * int(round(sec * SR)))
def clip(a, b):
    i0, i1 = int(a * SR), int(b * SR); f = int(0.015 * SR)
    for i in range(i0, i1):
        k = min(1.0, (i - i0) / f, (i1 - i) / f)
        out.append(max(-32767, min(32767, int(L[i] * k))))
for s in S:
    s["start"] = round(len(out) / SR, 3)
    if s["kind"] == "quiz":
        silence(LEAD + s["think"]); s["reveal"] = round(len(out) / SR - s["start"], 3)
        DINGS.append(len(out)); silence(0.45)
        VOICE.append([len(out)]); clip(s["a"], s["b"]); VOICE[-1].append(len(out)); silence(1.2)
    elif "a" in s or "parts" in s:
        silence(LEAD + (2.0 if s["kind"] == "word" else 0)); s["voice"] = round(len(out) / SR - s["start"], 3)
        for j, (a, b) in enumerate(s.pop("parts", None) or [(s["a"], s["b"])]):
            if j: silence(0.25)
            VOICE.append([len(out)]); clip(a, b); VOICE[-1].append(len(out))
        silence(TAIL)
    else:
        silence(s["dur"])
    s["dur"] = round(len(out) / SR - s["start"], 3)
    for k in ("a", "b"): s.pop(k, None)

# 4. A soft "ding" at every quiz answer.
def ding():
    n = int(0.8 * SR); d = []
    for i in range(n):
        x = i / SR; env = min(1.0, x / 0.005) * math.exp(-x / 0.22)
        d.append(env * (0.16 * math.sin(2 * math.pi * 1046.5 * x) + 0.10 * math.sin(2 * math.pi * 1568.0 * x) + 0.04 * math.sin(2 * math.pi * 2093.0 * x)))
    return d
D = ding()
for p0 in DINGS:
    for i, v in enumerate(D):
        if p0 + i < len(out): out[p0 + i] = max(-32767, min(32767, out[p0 + i] + int(v * 32767)))

# 5. Music: Tomorrow's Light, playing whenever nobody talks for a while (title, the
# start of every word, the verbs intro, quiz thinking time, the end) and fully off while
# anyone speaks. Short pauses between lines stay silent so the music doesn't pump.
def load(path):
    m = wave.open(path); assert m.getframerate() == SR and m.getnchannels() == 1
    x = array.array("h", m.readframes(m.getnframes())); m.close(); return x
if len(sys.argv) > 5:
    TL = load(sys.argv[5]); N = len(out)
    talk = bytearray(N)
    for a0, a1 in VOICE:
        for i in range(max(0, a0 - int(0.35 * SR)), min(N, a1 + int(0.45 * SR))): talk[i] = 1
    # Close gaps shorter than 1.5 s (after the margins) between talking.
    i = 0; last_end = None
    while i < N:
        if talk[i]:
            if last_end is not None and i - last_end < int(1.5 * SR):
                for k in range(last_end, i): talk[k] = 1
            while i < N and talk[i]: i += 1
            last_end = i
        else: i += 1
    loud = bytearray(N)  # title and end: a bit louder
    for kind in ("title", "outro", "cta"):
        for x in S:
            if x["kind"] == kind:
                for k in range(int(x["start"] * SR), min(N, int((x["start"] + x["dur"]) * SR))): loud[k] = 1
    soft = bytearray([1]) * N  # very quiet music under sentences; none under the pronunciation of a word
    for x in S:
        if x["kind"] in ("word", "slow", "repeat"):
            for k in range(int(x["start"] * SR), min(N, int((x["start"] + x["dur"]) * SR))): soft[k] = 0
    g = 0.0
    for i in range(N):
        target = (0.035 if soft[i] else 0.0) if talk[i] else (0.30 if loud[i] else 0.17)
        g += (target - g) * 0.00025  # ~80 ms ramps
        fade = min(1.0, (N - i) / (2.0 * SR))
        if g > 1e-4: out[i] = max(-32767, min(32767, out[i] + int(TL[i % len(TL)] * g * fade)))

ww = wave.open(out_wav, "wb"); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes(out.tobytes()); ww.close()
json.dump(dict(total=round(len(out) / SR, 3), words=W, scenes=S), open(out_json, "w"), ensure_ascii=False, indent=1)
print(f"{len(S)} scenes, {len(out) / SR:.1f}s; cuts {c_w2} {c_g} {c_aan}")
