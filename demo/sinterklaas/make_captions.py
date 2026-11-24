# Subtitles (EN: Dutch line + English, NL: Dutch only) and YouTube chapters for the
# Sinterklaas video, from remotion/sinterklaasTimeline.json.
# python3 make_captions.py <out_dir>
import json, re, sys

out_dir = sys.argv[1].rstrip("/") + "/"
t = json.load(open("remotion/sinterklaasTimeline.json"))
W = t["words"]
plain = lambda s: re.sub(r"\*([^*]+)\*", r"\1", s)
EN_ANS = {"stoomboot": "steamboat", "schoen": "shoe", "pepernoten": "pepernoten", "chocoladeletter": "chocolate letter",
          "surprise": "surprise", "rijmen": "rhyme", "gedicht": "poem"}
FUNNY_EN = {"Van… avond… is het…": "To… night… it's…", "…pak-jes-avond??": "…pak-jes-avond??", "Op pakjesavond krijgen we cadeautjes.": "On pakjesavond we get presents.", "Op pak… jes… avond… krijgen we… wekkerdootjes?": "On pak… jes… avond… we get… alarm-clock-dootjes? 😄", "Echt, serieus?!": "Really, seriously?!", "De pakjesavond.": "The evening of presents.", "De pak… jes… avond??": "The pak… jes… avond??", "#!@%": "#!@% (bleep)", "😂😂😂": "😂😂😂", "De… surprise?": "The… surprise?", "Sur… sur-prise?": "Sur… sur-prise?", "Ja!": "Yes!",
            "Ah, de surprise!": "Ah, the surprise!", "…op een witte paard.": "…on a white horse (oops: wit, not witte!)",
            "Nee, niet lekker!": "No, not tasty!", "De pepernoten zijn vies!": "The pepernoten are gross!"}

def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

en, nl = [], []
def cue(a, b, e, n):
    if e: en.append((a, b, e))
    if n: nl.append((a, b, n))

for s in t["scenes"]:
    a = s["start"]; b = s["start"] + s["dur"]; k = s["kind"]
    v = a + s.get("voice", 0)
    if k == "funny":
        caps = s["caps"]
        for i, (at, nl_, _) in enumerate(caps):
            end = v + caps[i + 1][0] if i + 1 < len(caps) else b - 0.1
            cue(v + at, end, f"{nl_}\n{FUNNY_EN.get(nl_, '')}", nl_)
    elif k == "title": cue(a + 0.2, b, "Sinterklaas in 7 words · Listen and repeat", "Sinterklaas in 7 woorden")
    elif k == "repeat": cue(a, b, "Repeat after me! Emma says it first, then Lamak repeats.", "Repeat after me!")
    elif k in ("word", "slow"):
        w = W[s["w"]]; word = (w["art"] + " " if w["art"] else "") + w["nl"]
        if k == "slow":
            sl = " – ".join(w["syl"]); cue(v, b - 0.3, f"{sl} (slowly)", sl)
        else: cue(v, b - 0.3, f"{word} = {plain(w['en'])}", word)
    elif k == "line":
        e = f"{s['nl']}\n{s['en']}"
        if "fix" in s:
            fa = v + s["fix"]["at"]
            cue(v, fa, e, s["nl"])
            cue(fa, b - 0.3, f"{s['nl']}\nOops: not “witte paard” but “wit paard” (het paard → een wit paard)", s["nl"])
            continue
        cue(v, b - 0.3, e, s["nl"])
    elif k == "verbsIntro": cue(a + 0.3, b, "Some verbs split in two: aankomen = aan + komen", "aankomen = aan + komen")
    elif k == "verb": cue(v, b - 0.3, f"{s['nl']}\n{s['en']} ({''.join(s['inf'])}: {s['part']} goes to the end)", s["nl"])
    elif k == "verbsTip": cue(a + 0.3, b, "See aan, in, uit or op at the end of a sentence? It often belongs to the verb.", None)
    elif k == "quizIntro": cue(a + 0.3, b, "Quiz time! Say the missing word out loud before it appears.", "Quiz!")
    elif k == "quiz":
        r = a + s["reveal"]; full = s["q"].replace("___", s["ans"])
        cue(a + 0.3, r, f"Question {s['n']}: {s['q']}\n{s['en']}", f"{s['n']}. {s['q']}")
        cue(r, b - 0.2, f"{full}\n{s['en'].replace('…', EN_ANS.get(s['ans'], s['ans']))}", full)
    elif k == "outro": cue(v, b, "Fijne Sinterklaas! = Happy Sinterklaas!", "Fijne Sinterklaas!")
    elif k == "cta": cue(a + 0.2, b, "Practise these words at mijntaalstudio.nl", None)

for name, cues in (("EN", en), ("NL", nl)):
    with open(out_dir + f"sinterklaas_captions_{name}.srt", "w") as f:
        for i, (a, b, x) in enumerate(cues, 1): f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{x}\n\n")

def mmss(x): m, s = divmod(int(x), 60); return f"{m}:{s:02d}"
ch = ["0:00 Bloopers 😅"]; seen = set()
for s in t["scenes"]:
    if s["kind"] == "title": ch.append(f"{mmss(s['start'])} Intro")
    if s["kind"] == "word" and s["w"] not in seen:
        seen.add(s["w"]); w = W[s["w"]]; ch.append(f"{mmss(s['start'])} {(w['art'] + ' ') if w['art'] else ''}{w['nl']}")
    if s["kind"] == "verbsIntro": ch.append(f"{mmss(s['start'])} Bonus: verbs that split in two")
    if s["kind"] == "quizIntro": ch.append(f"{mmss(s['start'])} Quiz")
print("\n".join(ch))
