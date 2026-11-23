# Speech segments with their loudness (p90 of 20 ms RMS, dBFS): [{"t0","t1","lvl"}]
import sys, wave, array, math, json
w = wave.open(sys.argv[1]); SR = w.getframerate(); A = array.array("h", w.readframes(w.getnframes())); w.close()
F = int(0.02 * SR); db = []
for i in range(0, len(A) - F, F):
    e = sum(x * x for x in A[i:i + F]) / F
    db.append(20 * math.log10(math.sqrt(e) / 32768 + 1e-9))
floor = sorted(db)[len(db) // 10]
th = floor + 12
on = [d > th for d in db]
segs = []; i = 0
while i < len(on):
    if on[i]:
        j = i
        while j < len(on) and on[j]: j += 1
        segs.append([i, j]); i = j
    else: i += 1
m = []
for s in segs:
    if m and s[0] - m[-1][1] < 15: m[-1][1] = s[1]   # merge gaps < 0.3 s
    else: m.append(s)
out = []
for a, b in m:
    if b - a < 5: continue
    v = sorted(db[a:b]); lvl = v[int(len(v) * 0.9) - 1]
    out.append(dict(t0=round(max(0, a - 3) * 0.02, 3), t1=round((b + 3) * 0.02, 3), lvl=round(lvl, 2)))
json.dump(out, open(sys.argv[2], "w"))
print(len(out), "segments, floor", round(floor, 1))
