# Voice track + timeline for the vertical Short "Teaching my friend Dutch: Sinterklaas in
# 7 words": the funniest moments of the recording, one per word. Same leveling as
# build_track.py. Caption times are seconds into the scene's voice (Whisper word times).
# python3 -I build_short.py <rec_48k.wav> <segs.json> <music.wav> <out_voice.wav> <out_timeline.json> [part2]
import sys, wave, array, math, json

src, segs_path, music_path, out_wav, out_json = sys.argv[1:6]
w = wave.open(src); SR = w.getframerate(); A = array.array("h", w.readframes(w.getnframes())); w.close()
segs = json.load(open(segs_path))

TARGET = -13.0
L = array.array("f", (float(x) for x in A))
for s in segs:
    i0, i1 = int(s["t0"] * SR), min(len(A), int(s["t1"] * SR))
    g = 10 ** (max(-6.0, min(12.0, TARGET - s["lvl"])) / 20)
    peak = max(abs(v) for v in A[i0:i1]) or 1
    g = min(g, (0.89 * 32767) / peak)
    fade = int(0.02 * SR)
    for i in range(i0, i1):
        k = min(1.0, (i - i0) / fade, (i1 - i) / fade)
        L[i] = A[i] * (1 + (g - 1) * k)

def bleep(t0, t1):
    B0, B1 = int(t0 * SR), int(t1 * SR)
    for i in range(B0, B1):
        k = min(1.0, (i - B0) / (0.01 * SR), (B1 - i) / (0.01 * SR))
        L[i] = 0.12 * 32767 * k * math.sin(2 * math.pi * 1000 * (i - B0) / SR)

# label: the word on top of the scene. caps: (seconds into the voice, Dutch, English, emoji).
# parts: stretches of the recording. Caption times are for the plain cut with 0.25 s between parts.
M = [
    # Hook: Emma explains rijmen.
    dict(n=0, hook=True, label="Teaching my friend Dutch 😅", parts=[(389.95, 408.75)], caps=[
        (0.15, "Weet je wat rijmen betekent?", "Do you know what *rijmen* means?", None),
        (2.61, "Rijmen?", None, "🤔"),
        (4.05, "Nee, rijmen: het laatste woord van elke zin moet rijmen…", "No, *rijmen*: the last word of every line has to rhyme…", None),
        (10.47, "…net als Eminem.", "…like Eminem.", "🎤"),
        (11.59, "Oké, oké, oké, oké…", None, "😅"),
        (13.99, "Rijmen… op dezelfde toon?", "Rhyme… the same sound?", None),
        (16.75, "Ja, oké.", "Yes, okay.", "✓")]),
    dict(n=1, word="Sinterklaas", en="Saint Nicholas", parts=[(23.66, 30.05)], caps=[
        (0.00, "Sinterklaas rijdt op een wit paard.", "Sinterklaas rides a white horse.", None),
        (2.96, "Sinterklaas rijdt op een witte paard.", None, None)],
        fix=dict(at=4.4, wrong="witte", right="wit paard")),
    dict(n=2, word="de pakjesavond", en="the evening of presents (5 December)", parts=[(78.30, 91.00)], caps=[
        (0.10, "Wat heb jij gekregen op pakjesavond?", "What did you get on *pakjesavond*?", None),
        (2.55, "Wat heb jij gekregen op die pakjesavond vorig jaar?", "What did you get on that *pakjesavond* last year?", None),
        (7.20, "Afgelopen jaar.", "Last year.", None),
        (8.60, "Afgelopen jaar.", None, "✓"),
        (10.14, "Ik doe niet aan Sinterklaas.", "I don't do Sinterklaas.", "🤷")]),
    dict(n=3, word="je schoen zetten", en="to put out your shoe", parts=[(107.20, 109.15), (110.12, 112.50)], caps=[
        (0.05, "Mag ik vanavond mijn schoen zetten?", "Can I put out my shoe tonight?", None),
        (2.25, "Mag ik vanavond mijn schoen zetten?", None, "👟")]),
    dict(n=4, word="de pepernoten", en="small spiced biscuits", parts=[(162.12, 172.39)], caps=[
        (0.14, "Pepernoten zijn lekker!", "*Pepernoten* are tasty!", None),
        (1.72, "Pepernoten zijn lekker…", None, None),
        (3.71, "De pepernoten zijn lekker!", None, None),
        (5.24, "Nee, niet lekker!", "No, not tasty!", "😬"),
        (7.24, "De pepernoten zijn vies!", "*Pepernoten* are gross!", "😄")]),
    dict(n=5, word="de chocoladeletter", en="a chocolate letter", parts=[(185.58, 190.20), (207.04, 209.79), (210.84, 212.33)], caps=[
        (0.05, "Mijn chocoladeletter is de E van Emma.", "My chocolate letter is the E for Emma.", None),
        (2.91, "Wat is jouw chocoladeletter?", "What's your chocolate letter?", None),
        (4.92, "Mijn chocoladeletter is de L van Lamak.", "My chocolate letter is the L for Lamak.", "🍫")]),
    dict(n=6, word="de surprise", en="a homemade gift in disguise", parts=[(217.88, 225.45)], caps=[
        (0.14, "De surprise.", None, None),
        (1.84, "De… surprise?", None, "🤔"),
        (3.32, "Sur… sur-prise?", None, None),
        (4.92, "Ja!", "Yes!", None),
        (5.84, "Ah, de surprise!", "Ah, the surprise!", "✓")]),
    dict(n=6, word="de surprise", en="made for you, about something you love", parts=[(349.05, 360.66)], caps=[
        (0.16, "Oké, oké, oké, oké, oké.", None, "😅"),
        (2.80, "Dus jij houdt van tatoeëren…", "So you love tattoos…", None),
        (4.10, "…dan zou ik misschien een hele grote naald voor jou maken.", "…then I'd make you a giant needle.", "💉"),
        (7.49, "Oké.", None, "😂"),
        (8.49, "En dan moet je dat openbreken, en dan zit er een cadeautje in.", "Then you break it open, and there's a present inside.", "🎁")]),
    dict(n=7, word="het gedicht", en="a poem", parts=[(240.17, 243.49), (253.965, 258.37)], caps=[
        (0.10, "Het gedicht.", "The poem.", None),
        (3.65, "Het gedicht rijmt niet!", "The poem doesn't rhyme!", "😄")]),
    # Ending: Emma says "Fijne Sinterklaas!", Lamak "En tot morgen!".
    dict(n=8, label="Doei! 👋", parts=[(431.75, 433.15), (438.80, 440.95)], caps=[
        (0.05, "Fijne Sinterklaas!", "Happy Sinterklaas!", "🎁"),
        (1.70, "En tot morgen!", "And see you tomorrow!", "👋")]),
]
# Part 2: the funny bits part 1 left out. None of these are in part 1 or in the
# Instagram story (surprise, witte paard, pepernoten lekker/vies).
M2 = [
    dict(n=0, hook=True, label="Bloopers", parts=[(45.45, 57.55)], caps=[
        (0.10, "De pakjesavond.", "*Pakjesavond*: the evening of presents.", None),
        (1.25, "De pakjesavond.", None, None),
        (2.90, "😂😂😂", None, None),
        (7.85, "Vanavond… is het… pakjesavond?", "Tonight… is… *pakjesavond*?", "🤔")]),
    dict(n=2, word="de pakjesavond", en="the evening of presents (5 December)",
         desc="The night before Sinterklaas's birthday. Families swap presents, often with a homemade *surprise* and a poem.",
         parts=[(60.85, 76.70)], caps=[
        (0.20, "Op pakjesavond krijgen we cadeautjes.", "On *pakjesavond* we get presents.", None),
        (3.75, "Op pakjesavond krijgen we cadeautjes.", None, None),
        (7.70, "Echt, serieus?!", "Really, seriously?!", "😂"),
        (9.25, "Waar is mijn cadeautje?", "Where's my present?", "🎁"),
        (13.00, "Wat heb jij gekregen op pakjesavond?", "What did you get on *pakjesavond*?", None)]),
    dict(n=3, word="je schoen zetten", en="to put out your shoe",
         desc="Before bed, kids put a shoe by the fireplace, with a carrot for Sinterklaas's horse. In the morning there's a treat inside.",
         parts=[(119.80, 127.75)], caps=[
        (0.10, "Er zit een wortel in mijn schoen, voor het paard.", "There's a carrot in my shoe, for the horse.", None),
        (3.48, "Er zit een wortel in mijn schoen…", None, None),
        (6.72, "…voor het paard.", None, "🥕🐴")]),
]
if len(sys.argv) > 6 and sys.argv[6] == "part2": M = M2
# GAP: silence around each scene. PART_GAP: between parts. EXTRA: added to every pause
# inside a part, so each sentence (Dutch + English) stays on screen a little longer.
GAP, PART_GAP, EXTRA, END = 0.6, 0.35, 0.4, 4.0

out = array.array("h")
def silence(sec): out.extend([0] * int(round(sec * SR)))
def clip(a, b):
    i0, i1 = int(a * SR), int(b * SR); f = int(0.015 * SR)
    for i in range(i0, i1):
        k = min(1.0, (i - i0) / f, (i1 - i) / f)
        out.append(max(-32767, min(32767, int(L[i] * k))))

def chunks(a, b):
    """Split a part at the pauses between speech segments (cut in the middle of each pause)."""
    inside = sorted((max(a, x["t0"]), min(b, x["t1"])) for x in segs if x["t1"] > a and x["t0"] < b)
    cuts = [(p[1] + q[0]) / 2 for p, q in zip(inside, inside[1:]) if q[0] - p[1] >= 0.15]
    edges = [a] + cuts + [b]
    return list(zip(edges, edges[1:]))

# Speech onsets in the recording (10 ms frames): where someone starts talking after at
# least 100 ms of quiet. Captions snap to these, so they appear exactly with the voice.
FR = int(0.01 * SR)
DB = [20 * math.log10(math.sqrt(sum(x * x for x in A[i:i + FR]) / FR) / 32768 + 1e-9) for i in range(0, len(A) - FR, FR)]
FLOOR = sorted(DB)[len(DB) // 10]
ON = [d > FLOOR + 14 for d in DB]
ONSETS = []  # (onset, start of the quiet before it)
run = 0
for i, o in enumerate(ON):
    if o and run >= 10: ONSETS.append((i * 0.01, (i - run) * 0.01))
    run = 0 if o else run + 1

def snap(src, lo, hi):
    c = [o for o in ONSETS if lo <= o[0] <= hi and src - 0.8 <= o[0] <= src + 0.5]
    return min(c, key=lambda o: abs(o[0] - src)) if c else None

def reading(c):
    """Seconds a caption needs on screen: longer Dutch + English text needs longer."""
    n = len(c[1]) + len(c[2] or "")
    return 0.6 + n / 20

scenes = []
for m in M:
    parts = m["parts"]
    starts, o = [], 0.0  # where each part starts in the plain cut (0.25 s between parts)
    for j, (a, b) in enumerate(parts):
        starts.append(o); o += (b - a) + 0.25
    def to_src(t):
        j = max([i for i, st0 in enumerate(starts) if st0 - 0.3 <= t] or [0])
        a, b = parts[j]
        return j, min(b - 0.05, max(a, a + t - starts[j]))
    # Each caption's moment in the recording, snapped to the onset of the speech.
    csrc, cuts = [], [set() for _ in parts]
    for i, c in enumerate(m["caps"]):
        j, src = to_src(c[0]); a, b = parts[j]
        hit = snap(src, a, b - 0.1)
        if hit:
            src = hit[0]
            if i and src - a > 0.15: cuts[j].add(round(max((hit[1] + src) / 2, src - 0.2), 3))
        csrc.append((j, src))
    # Chunks: split at caption onsets and at pauses between speech segments.
    ch = []
    for j, (a, b) in enumerate(parts):
        pts = sorted(cuts[j])
        for c0, c1 in chunks(a, b)[:-1]:
            if all(abs(c1 - p) > 0.25 for p in pts): pts.append(c1)
        edges = [a] + sorted(p for p in pts if a + 0.1 < p < b - 0.1) + [b]
        for k, (c0, c1) in enumerate(zip(edges, edges[1:])):
            ch.append(dict(j=j, c0=c0, c1=c1, pause=(PART_GAP if j else EXTRA) if (j or k) else 0.0))
    def chunk_at(j, src):
        return max(i for i, x in enumerate(ch) if x["j"] == j and x["c0"] <= src + 1e-6) if any(x["j"] == j and x["c0"] <= src + 1e-6 for x in ch) else min(i for i, x in enumerate(ch) if x["j"] == j)
    def pos(j, src):
        k = chunk_at(j, src)
        return sum(x["pause"] for x in ch[:k + 1]) + sum(x["c1"] - x["c0"] for x in ch[:k]) + max(0.0, src - ch[k]["c0"])
    # Lengthen the pause before the next caption until each caption has had its reading time.
    caps = m["caps"]; tail = GAP
    for i, c in enumerate(caps):
        if i + 1 < len(caps):
            short = reading(c) - (pos(*csrc[i + 1]) - pos(*csrc[i]))
            k0, k1 = chunk_at(*csrc[i]), chunk_at(*csrc[i + 1])
            if short > 0 and k1 > k0: ch[k1]["pause"] += min(2.0, short)
        else:
            end = sum(x["pause"] + x["c1"] - x["c0"] for x in ch)
            tail = max(GAP, min(2.5, GAP + reading(c) - (end - pos(*csrc[i]))))
    st = len(out) / SR
    silence(GAP if scenes else 0.15)
    if "desc" in m: silence(min(4.0, 1.0 + len(m["desc"]) / 40))  # read the description first
    v = len(out) / SR
    for x in ch:
        silence(x["pause"]); clip(x["c0"], x["c1"])
    silence(tail)
    s = dict(kind="moment", start=round(st, 3), dur=round(len(out) / SR - st, 3), voice=round(v - st, 3), n=m["n"],
             caps=[dict(at=round(max(0.0, pos(*csrc[i]) - 0.06), 3), nl=c[1], en=c[2], emoji=c[3], src=round(csrc[i][1], 2)) for i, c in enumerate(caps)])
    for k in ("label", "word", "en", "desc", "hook"):
        if k in m: s[k] = m[k]
    if "fix" in m: s["fix"] = dict(m["fix"], at=round(pos(*to_src(m["fix"]["at"])), 3))
    scenes.append(s)
st = len(out) / SR; silence(END); scenes.append(dict(kind="end", start=round(st, 3), dur=END))

# Tomorrow's Light: soft under the talking, up at the end card.
m = wave.open(music_path); MU = array.array("h", m.readframes(m.getnframes())); m.close()
N = len(out); g = 0.0
for i in range(N):
    target = 0.30 if i / SR >= st else 0.045
    g += (target - g) * 0.00025
    fade = min(1.0, (N - i) / (1.5 * SR))
    out[i] = max(-32767, min(32767, out[i] + int(MU[i % len(MU)] * g * fade)))

ww = wave.open(out_wav, "wb"); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes(out.tobytes()); ww.close()
json.dump(dict(total=round(N / SR, 3), scenes=scenes), open(out_json, "w"), ensure_ascii=False, indent=1)
print(f"{N / SR:.1f}s")
