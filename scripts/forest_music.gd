extends AudioStreamPlayer

func _ready():
    stream = load("res://assets/audio/canopy_daydream.ogg")
    stream.loop = true
    stream.loop_offset = 0.0
    volume_db = -9.0
    # Remember mute across fresh runs without modifying the progression save.
    play()
    stream_paused = bool(get_tree().get_meta("forest_music_muted", false))

func toggle():
    stream_paused = not stream_paused
    get_tree().set_meta("forest_music_muted", stream_paused)

func _exit_tree():
    stop()
    stream = null
