extends Node
# Original short synthesized effects. Cached in memory; no external sound samples.
static var sounds: Dictionary = {}
var voices: Array[AudioStreamPlayer] = []
var cursor := 0
var muted := false
var played_count := 0
var last_hit := -1000

func _ready():
    add_to_group("combat_audio")
    muted = bool(get_tree().get_meta("combat_muted", false))
    for i in range(8):
        var voice := AudioStreamPlayer.new()
        voice.volume_db = -14
        add_child(voice)
        voices.append(voice)

func toggle():
    muted = not muted
    get_tree().set_meta("combat_muted", muted)
    if muted:
        for voice in voices: voice.stop()

func play_sound(id: String):
    if muted or voices.is_empty(): return
    if id == "hit":
        var now := Time.get_ticks_msec()
        if now - last_hit < 65: return
        last_hit = now
    if not sounds.has(id): sounds[id] = synthesize(id)
    var voice := voices[cursor]
    cursor = (cursor + 1) % voices.size()
    voice.stream = sounds[id]
    voice.pitch_scale = randf_range(0.96, 1.04)
    voice.play()
    played_count += 1

static func emit_from(node: Node, id: String):
    var audio = node.get_tree().get_first_node_in_group("combat_audio")
    if audio != null: audio.play_sound(id)

static func synthesize(id: String) -> AudioStreamWAV:
    var skill := id.begins_with("skill_")
    var kind := id.trim_prefix("skill_")
    var length := 0.48 if skill else 0.17
    if kind == "heal": length = 0.38
    var rate := 22050
    var count := int(length * rate)
    var bytes := PackedByteArray()
    bytes.resize(count * 2)
    var rng := RandomNumberGenerator.new()
    rng.seed = hash(id)
    var smooth := 0.0
    for i in range(count):
        var t := float(i) / rate
        var u := t / length
        smooth = lerpf(smooth, rng.randf_range(-1,1), 0.28)
        var sample := 0.0
        # Short fades on both ends prevent clicks.
        var fade := minf(1, t / 0.003) * minf(1, (length-t) / 0.015)
        match kind:
            "fighter":
                sample = smooth * sin(PI*u) * 1.4 + sin(TAU*(210*t-130*t*t))*exp(-u*8)*0.22
            "mage":
                sample = (sin(TAU*(440*t+450*t*t)) + 0.3*sin(TAU*880*t))*exp(-u*4)*0.45
            "shooter":
                sample = smooth*exp(-u*18)*2 + sin(TAU*(100*t-40*t*t))*exp(-u*12)*0.5
                if skill: sample += smooth * pow(maxf(0,sin(t*TAU*12)),8) * exp(-u*2)
            "bowman":
                sample = sin(TAU*(240*t-90*t*t))*exp(-u*13)*0.6 + smooth*sin(PI*u)*0.35
                if skill: sample += smooth * sin(PI*u) * 0.5
            "heal":
                sample = (sin(TAU*523.25*t)+sin(TAU*659.25*t)*0.6+sin(TAU*783.99*t)*0.35)*sin(PI*u)*0.25
            "hurt":
                sample = sin(TAU*(135*t-180*t*t))*exp(-u*8)*0.6 + smooth*exp(-u*10)*0.4
            _:
                sample = smooth*exp(-u*20) + sin(TAU*180*t)*exp(-u*18)*0.35
        if skill: sample += sin(TAU*70*t)*sin(PI*u)*0.16
        bytes.encode_s16(i*2, int(clampf(sample*fade,-0.9,0.9)*32767))
    var stream := AudioStreamWAV.new()
    stream.format = AudioStreamWAV.FORMAT_16_BITS
    stream.mix_rate = rate
    stream.data = bytes
    return stream

func _exit_tree():
    for voice in voices:
        voice.stop()
        voice.stream = null
