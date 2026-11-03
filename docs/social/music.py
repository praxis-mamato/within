"""Composes Within's own music for reels and stories: no licences, no copyright claims.

Each track is a chord progression played by a warm pad, a harp arpeggio, a bell melody and a soft bass,
with a gentle pulse on the faster ones, all through a hall reverb. Deterministic: the same script makes
the same files. Run: python3 docs/social/music.py  → docs/social/music/<name>.m4a (64 seconds, loops).
"""
import os
import subprocess
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music')
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
NOTE.update({'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10})


def hz(name):
    """'A4' → 440."""
    n, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[n] + 12 * (octave + 1) - 69) / 12)


def env(n, attack, release, total=None):
    total = total or n
    e = np.ones(n)
    a = min(int(attack * SR), n)
    r = min(int(release * SR), n - a)
    e[:a] = np.linspace(0, 1, a) ** 2
    if r:
        e[n - r:] *= np.linspace(1, 0, r) ** 2
    return e


def pad_note(f, dur, rng):
    """Detuned, softly filtered saw ensemble with a slow swell."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for detune in (-0.11, -0.04, 0.0, 0.05, 0.12):
        ff = f * 2 ** (detune / 12)
        phase = rng.uniform(0, 2 * np.pi)
        for k in range(1, 14):
            if ff * k > 7000:
                break
            out += np.sin(2 * np.pi * ff * k * t + phase * k) * (1 / k) * np.exp(-k / 3.2)
    out *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t + rng.uniform(0, 6))
    return out * env(n, 2.2, 2.6) / 5


def pluck(f, dur=2.6):
    """Harp-like pluck: harmonics that decay faster the higher they are, slightly stretched."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * (1 + 0.0006 * k * k)
        if fk > 12000:
            break
        out += np.sin(2 * np.pi * fk * t) * (0.9 ** k / k) * np.exp(-t * (1.6 + 0.9 * k))
    out *= np.minimum(1, t / 0.004)
    return out


def bell(f, dur=4.5):
    """FM bell (celesta and singing bowl)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = 2.2 * np.exp(-t * 2.5)
    out = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 1.1)
    out += 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 2.2)
    return out * np.minimum(1, t / 0.003)


def bass(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return out * env(n, 0.4, 1.2)


def kick(dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 50 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def shaker(rng, dur=0.12):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    noise = np.diff(np.concatenate([[0], noise]))  # brighter
    return noise * np.exp(-np.arange(n) / SR * 40) * 0.5


def place(buf, sig, at, gain=1.0, pan=0.0):
    """Adds a sound at a time; whatever runs past the end wraps to the start, so the track loops cleanly."""
    n = buf.shape[1]
    idx = (int(at * SR) + np.arange(len(sig))) % n
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    np.add.at(buf[0], idx, sig * gain * l * 1.414)
    np.add.at(buf[1], idx, sig * gain * r * 1.414)


def reverb(x, rng, seconds=3.8, mix=0.32):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.empty_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 6.9 / seconds)
        # Darker tail: smooth the noise a little.
        ir = np.convolve(ir, np.ones(6) / 6, mode='same')
        ir[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
        ir /= np.sqrt(np.sum(ir ** 2))
        size = 1 << int(np.ceil(np.log2(len(x[ch]) + n)))
        wet = np.fft.irfft(np.fft.rfft(x[ch], size) * np.fft.rfft(ir, size), size)[: len(x[ch]) + n]
        # Wrap the tail to the start, so the track loops without a gap.
        wet[: n] += wet[len(x[ch]):]
        out[ch] = (1 - mix) * x[ch] + mix * wet[: len(x[ch])] * 0.9
    return out


def chord_notes(spec):
    """'D3 A3 C4 E4 F4' → frequencies."""
    return [hz(n) for n in spec.split()]


def compose(name, bpm, chords, melody, rng_seed, pulse=False, arp_pattern=(0, 2, 3, 4, 3, 2), dark=False):
    rng = np.random.default_rng(rng_seed)
    beat = 60 / bpm
    bar = 4 * beat
    bars_per_chord = 2
    total = 64.0
    buf = np.zeros((2, int(total * SR)))
    chord_len = bars_per_chord * bar
    n_chords = int(np.ceil(total / chord_len))
    for c in range(n_chords):
        start = c * chord_len
        notes = chord_notes(chords[c % len(chords)])
        # Pad: the upper voices, overlapping the next chord a little.
        for k, f in enumerate(notes[1:]):
            place(buf, pad_note(f, chord_len + 2.0, rng), start - 0.4, 0.075, pan=(k - 1.5) * 0.35)
        # Bass: the root, an octave down.
        place(buf, bass(notes[0] / 2, chord_len), start, 0.16 if dark else 0.12)
        # Harp arpeggio in eighths (the first chord pass enters later, so the opening breathes).
        if c >= 1 or total < 30:
            steps = int(chord_len / (beat / 2))
            for s in range(steps):
                idx = arp_pattern[s % len(arp_pattern)] % len(notes)
                f = notes[idx] * (2 if idx < 2 else 1)
                vel = 0.10 + 0.04 * (s % 4 == 0) + rng.uniform(-0.015, 0.015)
                place(buf, pluck(f), start + s * beat / 2 + rng.uniform(0, 0.012), vel, pan=0.5 * np.sin(s * 0.9))
        if pulse and c >= 2:
            for b in range(int(chord_len / beat)):
                if b % 2 == 0:
                    place(buf, kick(), start + b * beat, 0.32)
                for h in (0.5, 0.75) if b % 2 else (0.5,):
                    place(buf, shaker(rng), start + (b + h) * beat, 0.05, pan=0.3)
    # Bell melody: one phrase per chord, in quarter or half notes, from the melody list.
    t = 2 * bar
    i = 0
    while t < total - 2:
        note, length = melody[i % len(melody)]
        if note != '-':
            place(buf, bell(hz(note)), t, 0.07, pan=-0.25 if i % 2 else 0.25)
        t += length * beat
        i += 1
    buf = reverb(buf, rng, seconds=4.8 if dark else 3.8, mix=0.38 if dark else 0.32)
    # Gentle master: soft saturation, then loudness to suit Instagram (about -14 LUFS).
    buf = np.tanh(buf * 1.4) / 1.4
    buf /= np.max(np.abs(buf)) + 1e-9
    os.makedirs(OUT, exist_ok=True)
    raw = os.path.join(OUT, f'.{name}.f32')
    buf.T.astype('<f4').tofile(raw)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', raw,
                    '-af', 'highpass=f=35,loudnorm=I=-15:TP=-1.5:LRA=9', '-ar', '44100',
                    '-c:a', 'aac', '-b:a', '160k', os.path.join(OUT, f'{name}.m4a')], check=True)
    os.remove(raw)
    print('music', name)


TRACKS = [
    # The Oracle: D minor, mysterious and warm.
    dict(name='oracle', bpm=72, rng_seed=1, chords=['D3 A3 C4 E4 F4', 'Bb2 F3 A3 D4 E4', 'F2 C4 E4 G4 A4', 'C3 G3 C4 E4 A4'],
         melody=[('A5', 2), ('F5', 1), ('E5', 1), ('D5', 3), ('-', 1), ('C5', 2), ('D5', 2), ('E5', 4), ('F5', 2), ('E5', 1), ('C5', 1), ('D5', 4)]),
    # Moonlight: A minor, dreamy.
    dict(name='moonlight', bpm=66, rng_seed=2, chords=['A2 E3 B3 C4 E4', 'F2 C4 E4 A4 G4', 'C3 G3 E4 G4 D5', 'G2 D4 E4 G4 B4'],
         melody=[('E5', 3), ('D5', 1), ('C5', 2), ('B4', 2), ('A4', 4), ('-', 2), ('G5', 2), ('E5', 3), ('D5', 1), ('E5', 4)]),
    # Venus: D-flat major, tender, with a soft pulse.
    dict(name='venus', bpm=78, rng_seed=3, pulse=True, chords=['Db3 Ab3 C4 F4 Eb4', 'Bb2 F3 Ab3 Db4 C4', 'Gb2 Db4 F4 Ab4 Bb4', 'Ab2 Eb4 F4 Ab4 C5'],
         melody=[('F5', 2), ('Ab5', 2), ('Eb5', 3), ('-', 1), ('Db5', 2), ('C5', 2), ('Bb4', 4), ('C5', 2), ('Eb5', 2), ('F5', 4)]),
    # Scorpio: E minor, deep and slow.
    dict(name='scorpio', bpm=60, rng_seed=4, dark=True, arp_pattern=(0, 3, 4, 2), chords=['E2 B2 G3 D4 F#4', 'C2 G3 B3 E4 G4', 'A2 E3 G3 C4 E4', 'B1 F#3 A3 D4 E4'],
         melody=[('B4', 4), ('G4', 2), ('F#4', 2), ('E4', 6), ('-', 2), ('D5', 3), ('B4', 1), ('A4', 4)]),
    # Cosmic pulse: F minor, the brightest energy, for hooks and countdowns.
    dict(name='pulse', bpm=92, rng_seed=5, pulse=True, arp_pattern=(0, 2, 4, 3, 4, 2, 1, 2), chords=['F2 C4 Eb4 Ab4 G4', 'Db3 Ab3 C4 F4 Eb4', 'Ab2 Eb4 G4 C5 Bb4', 'Eb3 Bb3 Eb4 G4 F4'],
         melody=[('C6', 1), ('Ab5', 1), ('G5', 2), ('F5', 2), ('Eb5', 2), ('F5', 1), ('G5', 1), ('Ab5', 2), ('G5', 4)]),
    # Dawn: C major seventh colours, hopeful.
    dict(name='dawn', bpm=74, rng_seed=6, chords=['C3 G3 B3 E4 D4', 'E2 B3 D4 G4 F#4', 'A2 E3 G3 C4 B4', 'F2 C4 E4 A4 B4'],
         melody=[('G5', 2), ('E5', 2), ('D5', 3), ('-', 1), ('B4', 2), ('C5', 2), ('D5', 4), ('E5', 2), ('G5', 2), ('A5', 4)]),
]

if __name__ == '__main__':
    for tr in TRACKS:
        compose(**tr)
