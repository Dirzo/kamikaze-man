"""Original Canopy Daydream. Python + numpy + soundfile; no external samples.
24 bars at 88 BPM, stereo 44.1 kHz. Soft electric piano, plucked strings,
rounded bass and brushed percussion. No melody from the reference is used.
"""
from pathlib import Path
import numpy as np
import soundfile as sf

SR, BPM = 44100, 88
BEAT = 60 / BPM
N = round(96 * BEAT * SR)
mix = np.zeros((N, 2))
rng = np.random.default_rng(427)

def place(signal, beat, gain, pan=0):
    start = round(beat * BEAT * SR)
    index = (start + np.arange(len(signal))) % N
    gains = np.sqrt([(1-pan)/2, (1+pan)/2]) * gain
    for channel in range(2):
        np.add.at(mix[:, channel], index, signal * gains[channel])
    for delay, level, side in [(.19,.12,-.5),(.33,.10,.5),(.51,.065,-.25),(.73,.04,.25)]:
        shifted = (index + round(delay * SR)) % N
        echo = np.sqrt([(1-side)/2,(1+side)/2]) * gain * level
        for channel in range(2):
            np.add.at(mix[:,channel], shifted, signal * echo[channel])

def note(beat, pitch, length, gain, voice='keys', pan=0):
    t = np.arange(round((length * BEAT + 1.5) * SR)) / SR
    f = 440 * 2 ** ((pitch - 69) / 12)
    phase = 2 * np.pi * f * t
    release = np.minimum(1, np.maximum(0,(length*BEAT+1.5-t)/1.5)) ** 2
    if voice == 'keys':
        # A mellow tine-piano attack whose upper partials decay quickly.
        signal = np.sin(phase + 1.4*np.exp(-t*5)*np.sin(phase)) * np.exp(-t*.9)
        signal += .17*np.sin(phase*2.003)*np.exp(-t*2.8)
        signal += .06*np.sin(phase*3.99)*np.exp(-t*4)
        envelope = np.minimum(t/.007,1)*release
    elif voice == 'pluck':
        signal = np.zeros_like(t)
        for h in range(1,13):
            amplitude = np.sin(h*np.pi*.23) / h**1.35
            signal += amplitude*np.cos(phase*h*(1+.000015*h*h)) * np.exp(-t*(.85+h*.37))
        envelope = np.minimum(t/.004,1)*release
    elif voice == 'bass':
        signal = (np.sin(phase)+.22*np.sin(phase*2)+.08*np.sin(phase*3))*np.exp(-t*1.2)
        envelope = np.minimum(t/.012,1)*release
    else:
        signal = (np.sin(phase)+.20*np.sin(phase*1.001)+.09*np.sin(phase*2))
        envelope = np.minimum(t/.7,1)*release*.7
    place(signal*envelope,beat,gain,pan)

chords = [[45,52,56,61],[44,51,56,59],[42,49,52,57],[40,47,52,56],
          [38,45,49,54],[40,47,50,56],[45,52,56,61],[40,47,52,56]]
# Original call-and-response phrases with space between motifs.
phrases = [
 [(0,73,1),(1.5,71,.5),(2.5,68,1)],[(.5,71,1),(2,68,.5),(3,66,.5)],
 [(0,69,1.5),(2,66,.5),(3,64,.5)],[(.5,68,1),(2,66,1)],
 [(0,66,.75),(1,69,.75),(2.5,73,1)],[(.5,71,1),(2,68,1.25)],
 [(0,69,1),(1.5,68,.5),(2.5,64,1)],[(0,66,1.5),(2.5,68,.75)],
 [(0,76,1),(1.5,73,.5),(2.5,71,1)],[(0,73,.75),(1,71,.75),(2.5,68,1)],
 [(0,69,1),(1.5,73,.5),(2.5,76,1)],[(.5,75,.75),(1.5,73,.5),(2.5,71,1)],
 [(0,73,1),(1.5,69,.5),(2.5,66,1)],[(.5,68,1),(2,71,1)],
 [(0,73,1.5),(2,69,.75)],[(.5,68,1),(2,64,1.5)]
]
for bar in range(24):
    chord = chords[bar % 8]
    base = bar*4
    for i,pitch in enumerate(chord[1:]):
        note(base+.015*i,pitch+12,2.6,.041,'keys',-.22)
        if bar >= 8:
            note(base+2.5+.012*i,pitch+12,1,.027,'keys',-.22)
    for offset, degree in [(0,0),(.75,2),(1.5,1),(2.25,3),(3,2),(3.5,1)]:
        note(base+offset,chord[degree]+12,.9,.076 if degree==0 else .056,'pluck',.3)
    note(base,chord[0]-12,1.5,.13,'bass')
    note(base+2,chord[0]-12,1,.10,'bass')
    if bar % 2:
        note(base+3.5,chord[0]-5,.4,.055,'bass')
    for offset,pitch,length in phrases[bar if bar<16 else bar-16]:
        note(base+offset,pitch,length,.14 if bar<16 else .12,'keys',-.08)
    if bar >= 8:
        for pitch in chord[1:3]:
            note(base,pitch+12,3,.014,'pad',.15)
    # Quiet brushed pulse; no sharp snare or piercing cymbal.
    for beat in [0,2]:
        t = np.arange(int(.25*SR))/SR
        kick = np.sin(2*np.pi*(48*t+3*(1-np.exp(-t*25))))*np.exp(-t*21)
        place(kick,base+beat,.065)
    for beat in [1,3]:
        t=np.arange(int(.17*SR))/SR
        noise=rng.normal(0,1,len(t))
        brush=np.convolve(noise,np.ones(15)/15,'same')*np.exp(-t*25)*np.minimum(t/.008,1)
        place(brush,base+beat,.052,.2)
mix -= mix.mean(axis=0)
peak = np.abs(mix).max()
mix *= .78/peak
out = Path(__file__).resolve().parents[1]/'assets/audio/canopy_daydream.ogg'
with sf.SoundFile(out, 'w', samplerate=SR, channels=2, format='OGG', subtype='VORBIS') as track:
    for start in range(0, N, 4096):
        track.write(mix[start:start+4096].astype(np.float32))
print(f'{out.name}: {N/SR:.2f}s stereo; peak .78; RMS {np.sqrt(np.mean(mix**2)):.3f}')
