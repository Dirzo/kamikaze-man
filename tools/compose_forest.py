"""Rebuild the original Sunleaf Reverie loop. Requires Python and numpy.
No samples or melodies from MapleStory are used. A 16-bar, 72-BPM original
in D major with soft flute, bell arpeggios, sustained chords and echo tails.
"""
from pathlib import Path
import wave
import numpy as np

RATE = 16000
BEAT = 60 / 72
LENGTH = int(64 * BEAT * RATE)
mix = np.zeros(LENGTH, dtype=np.float64)

def note(beat, pitch, beats, volume, voice):
    count = int((beats * BEAT + 1.2) * RATE)
    t = np.arange(count) / RATE
    frequency = 440 * 2 ** ((pitch - 69) / 12)
    phase = 2 * np.pi * frequency * t
    release = np.clip((beats * BEAT + 1.2 - t) / 1.2, 0, 1) ** 2
    if voice == 'bell':
        sound = (np.sin(phase) * np.exp(-t * 2.2) +
                 .25 * np.sin(phase * 2) * np.exp(-t * 4) +
                 .08 * np.sin(phase * 3) * np.exp(-t * 6))
        envelope = np.minimum(t / .012, 1) * release
    elif voice == 'flute':
        vibrato = .022 * np.sin(2 * np.pi * 4.4 * t) * np.minimum(t / .4, 1)
        sound = np.sin(phase + vibrato) + .16 * np.sin(phase * 2) + .04 * np.sin(phase * 3)
        envelope = np.minimum(t / .12, 1) * np.exp(-t * .16) * release
    else:
        sound = (np.sin(phase) + .28 * np.sin(phase * 1.0015) + .16 * np.sin(phase * 2))
        envelope = np.minimum(t / .6, 1) * release
    sound *= envelope * volume
    indices = (int(beat * BEAT * RATE) + np.arange(count)) % LENGTH
    np.add.at(mix, indices, sound)
    # Circular echoes retain the previous phrase's tail across the loop seam.
    for delay, gain in [(.31, .22), (.57, .12), (.91, .065)]:
        np.add.at(mix, (indices + int(delay * RATE)) % LENGTH, sound * gain)

chords = [[50,57,61,66], [47,54,57,62], [43,50,57,59], [45,52,57,61],
          [50,57,61,66], [47,54,57,62], [43,50,54,59], [45,52,55,61],
          [54,57,61,66], [47,54,57,62], [43,50,57,59], [45,52,57,61],
          [43,50,54,59], [45,52,57,61], [50,54,57,61], [45,52,57,61]]
# Sparse two-part phrases, not an existing tune.
melody = [
    [(0,78,1),(1.5,76,.5),(2,73,1.5)], [(0,74,1.5),(2,78,.75),(3,76,.5)],
    [(.5,71,1),(2,74,1.5)], [(0,73,1),(1.5,69,.5),(2.5,76,1)],
    [(0,78,.75),(1,81,1),(2.5,78,1)], [(.5,76,1),(2,74,1.5)],
    [(0,71,1),(1.5,73,.5),(2,74,1)], [(0,73,2.5)],
    [(0,81,1.5),(2,78,.75),(3,76,.5)], [(0,78,1),(1.5,74,1.5)],
    [(.5,79,1),(2,78,.5),(3,74,.5)], [(0,76,1.5),(2,73,1)],
    [(0,74,1),(1.5,71,1),(3,69,.5)], [(0,73,1),(1.5,76,1.5)],
    [(0,78,1.5),(2,74,1.5)], [(0,73,1),(1.5,69,1),(3,73,.5)]
]
for bar, chord in enumerate(chords):
    for pitch in chord:
        note(bar * 4, pitch, 3.7, .027, 'pad')
    for step, index in enumerate([0,2,1,3,2,1]):
        note(bar * 4 + step * .5, chord[index] + 12, .7, .075 if step == 0 else .043, 'bell')
    for offset, pitch, length in melody[bar]:
        note(bar * 4 + offset, pitch, length, .12, 'flute')
mix -= mix.mean()
mix *= .79 / np.max(np.abs(mix))
output = Path(__file__).resolve().parents[1] / 'assets/audio/sunleaf_reverie.wav'
output.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(output), 'wb') as track:
    track.setnchannels(1)
    track.setsampwidth(2)
    track.setframerate(RATE)
    track.writeframes((mix * 32767).astype('<i2').tobytes())
print(f'{output.name}: {LENGTH/RATE:.2f}s, peak {np.max(np.abs(mix)):.2f}, seam {abs(mix[-1]-mix[0]):.5f}')
