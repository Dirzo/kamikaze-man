extends SceneTree
var failures := 0
var checks := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
    checks += 1
    print(("PASS: " if ok else "FAIL: ") + label)
    if not ok: failures += 1
func run():
    for index in range(4):
        var game = load("res://scenes/main.tscn").instantiate()
        game.save_path = ""
        root.add_child(game)
        game.choose_class(index)
        var p = game.get_node("Player")
        p.set_physics_process(false)
        for e in get_nodes_in_group("enemies"):
            e.position = Vector2(3500,580)
            e.set_physics_process(false)
        var audio = game.get_node("CombatAudio")
        p.attack()
        check(audio.played_count == 1, p.combat_class + " weapon plays sound")
        p.attack()
        check(audio.played_count == 1, "Attack cooldown does not spam sound")
        p.use_skill()
        p.use_ability()
        p.use_mobbing()
        check(audio.played_count == 4, "Q, E and R each play a cast sound")
        p.input_locked = true
        p.skill_timer = 0
        p.use_skill()
        check(audio.played_count == 4, "Blocked menu cast remains silent")
        p.input_locked = false
        p.guard_timer = 0
        p.take_damage(1)
        check(audio.played_count == 5, "Player damage plays hurt sound")
        for i in range(25): audio.play_sound("mage")
        check(audio.voices.size() == 8, "Rapid casting stays within eight sound voices")
        var before: int = audio.played_count
        audio.toggle()
        audio.play_sound("fighter")
        check(audio.played_count == before and audio.voices.all(func(v):return not v.playing), "Mute silences effects immediately")
        check(not game.music.stream_paused, "Sound mute leaves music independent")
        audio.toggle()
        await create_timer(0.1).timeout
        game.queue_free()
        await process_frame
    var script = load("res://scripts/combat_audio.gd")
    for id in ["fighter","mage","shooter","bowman","skill_fighter","skill_mage","skill_shooter","skill_bowman","heal","hurt","hit"]:
        var stream = script.synthesize(id)
        check(stream.get_length() >= 0.16 and stream.data.size() > 7000, id + " has valid PCM audio")
        var peak := 0
        for i in range(0,stream.data.size(),2): peak = maxi(peak, absi(stream.data.decode_s16(i)))
        check(peak > 100 and peak < 32767, id + " is audible without clipping")
    await create_timer(0.5).timeout
    print("%d checks, %d failures" % [checks,failures])
    quit(1 if failures else 0)
