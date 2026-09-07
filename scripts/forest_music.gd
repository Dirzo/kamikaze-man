extends AudioStreamPlayer

func _ready():
    stream = load("res://assets/audio/sunleaf_reverie.wav")
    stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
    stream.loop_begin = 0
    stream.loop_end = roundi(stream.get_length() * stream.mix_rate)
    volume_db = -12.0
    # Remember mute across fresh runs without modifying the progression save.
    play()
    stream_paused = bool(get_tree().get_meta("forest_music_muted", false))

func toggle():
    stream_paused = not stream_paused
    get_tree().set_meta("forest_music_muted", stream_paused)

func _exit_tree():
    stop()
    stream = null
