# Median pitch per stretch (autocorrelation on 16 kHz audio): ~200+ Hz = Emma, ~100-150 Hz = Lamak.
import sys, wave, array, math
w = wave.open(sys.argv[1]); SR = w.getframerate(); A = array.array("h", w.readframes(w.getnframes()))
def f0(a, b):
    out = []
    N = int(0.04 * SR)
    for i in range(int(a * SR), int(b * SR) - N, int(0.02 * SR)):
        x = A[i:i + N]
        e = sum(v * v for v in x)
        if e / N < 300 ** 2: continue
        best, lag = 0, 0
        for L in range(SR // 400, SR // 70):
            r = sum(x[k] * x[k + L] for k in range(0, N - L, 2))
            if r > best: best, lag = r, L
        if best > 0.4 * e / 2: out.append(SR / lag)
    out.sort()
    return round(out[len(out) // 2]) if out else None
for arg in sys.argv[2:]:
    a, b = map(float, arg.split("-"))
    print(arg, f0(a, b))
