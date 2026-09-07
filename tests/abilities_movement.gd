extends SceneTree
var failures := 0
var checks := 0
func _initialize():
    call_deferred("run")
func check(ok: bool, label: String):
    checks += 1
    print(("PASS: " if ok else "FAIL: ") + label)
    if not ok:
        failures += 1
func setup():
    var game = load("res://scenes/main.tscn").instantiate()
    game.save_path = ""
    game.start_with_class_menu = false
    root.add_child(game)
    game.get_node("Player").set_physics_process(false)
    for enemy in get_nodes_in_group("enemies"):
        enemy.set_physics_process(false)
        enemy.position = Vector2(3000, 500)
    return game
func key(game, code):
    var event := InputEventKey.new()
    event.keycode = code
    event.pressed = true
    game._unhandled_input(event)
func run():
    var game = setup()
    var p = game.get_node("Player")
    check(not p.use_ability(), "Recruit cannot use class abilities")
    var music = game.music
    check(music.stream is AudioStreamOggVorbis and music.playing, "Forest music loaded and playing")
    check(music.stream.loop and music.stream.get_length() > 50, "Full forest composition loops")
    check(music.stream.loop_offset == 0, "Loop endpoint covers the full compressed audio stream")
    key(game, KEY_M)
    check(music.stream_paused, "M mutes music")
    game.queue_free()
    await process_frame
    game = setup()
    check(game.music.stream_paused, "Mute survives fresh runs")
    key(game, KEY_M)
    check(not game.music.stream_paused, "M resumes music")
    game.queue_free()
    await process_frame
    for id in ["fighter", "mage", "shooter", "bowman"]:
        for option in range(3):
            game = setup()
            p = game.get_node("Player")
            p.select_class(id)
            p.position = Vector2(500, 400)
            p.hp = 25
            p.crit_chance = 0
            var e = game.get_node("Enemy1")
            e.position = Vector2(590, 400)
            e.max_hp = 5000
            e.hp = 5000
            check(p.equip_ability(option), "%s option %d equips" % [id, option])
            var data = p.ability_data()
            check(p.use_ability(), data.name + " activates")
            check(not p.use_ability() and p.ability_timer == data.cooldown, data.name + " enforces cooldown")
            for shot in get_nodes_in_group("projectiles"):
                shot.set_physics_process(false)
                shot._physics_process(0.1)
            if data.id in ["rally", "ward", "mend"]:
                check(p.hp > 25 and p.guard_timer > 0, data.name + " heals and guards")
            else:
                check(e.hp < 5000, data.name + " damages enemies")
            if data.id in ["frost", "flash", "bramble"]:
                check(e.slow_factor <= 0.15 and e.slow_timer >= 3, data.name + " applies crowd control")
            if data.id == "reap":
                check(p.hp > 25, "Blood Harvest drains actual damage")
            if data.id == "retreat":
                check(p.dash_direction == -p.facing and p.guard_timer > 0, "Parting Shots retreats with guard")
            var previous: float = p.ability_timer
            p.equip_ability((option + 1) % 3)
            check(p.ability_timer == previous and not p.use_ability(), "Swapping cannot reset cooldown")
            p.ability_timer = 0
            p.input_locked = true
            check(not p.use_ability(), "Menu blocks E ability")
            p.input_locked = false
            p.dead = true
            p.hp = 0
            p.restore_health(1000)
            check(not p.use_ability() and p.hp == 0, "Dead players cannot cast or heal")
            game.queue_free()
            await process_frame
    game = setup()
    p = game.get_node("Player")
    p.select_class("mage")
    key(game, KEY_T)
    key(game, KEY_TAB)
    key(game, KEY_3)
    check(game.tree_open and game.tree_panel.ability_mode and p.ability_index == 2, "T / Tab / 3 equips through menu")
    key(game, KEY_TAB)
    key(game, KEY_2)
    check(p.style_id == "cryomancer" and p.ability_index == 2, "Style and E loadout remain independent")
    key(game, KEY_ESCAPE)
    check(not p.input_locked, "Closing build menu restores control")
    var e = game.get_node("Enemy1")
    p.position = Vector2(50, 560)
    e.position = Vector2(1600, 580)
    e.start_position = e.position
    e.patrol_direction = 1
    e.patrol(0.1)
    check(e.velocity.x > 0, "Idle enemy patrols outside aggro range")
    e.position.x += 140
    e.patrol(0.1)
    check(e.patrol_direction == -1 and e.patrol_pause > 0, "Patrol turns and pauses at boundary")
    e.patrol_pause = 0
    e.patrol(0.1)
    check(e.velocity.x < 0, "Patrol returns toward spawn")
    var pose: Vector2 = e.get_node("Body/Portrait").position
    e._process(0.1)
    check(e.get_node("Body/Portrait").position != pose, "Enemy walk pose animates")
    e.take_damage(1, p)
    check(e.hurt_anim > 0, "Taking damage starts hit reaction")
    e.position = Vector2(1000, 585)
    e.start_position = e.position
    e.patrol_pause = 0
    e.patrol_direction = 1
    e.set_physics_process(true)
    var before: float = e.position.x
    await create_timer(0.5).timeout
    check(absf(e.position.x - before) > 5, "Enemy patrol actually moves through physics world")
    check(e.floor_ahead(1), "Ground probe detects walkable terrain")
    e.set_physics_process(false)
    e.position = Vector2(-100, -500)
    check(not e.floor_ahead(-1), "Ground probe rejects empty space")
    e.respawn()
    check(e.hurt_anim == 0 and e.attack_anim == 0, "New map resets animation state")
    game.queue_free()
    await process_frame
    print("%d checks, %d failures" % [checks, failures])
    await create_timer(0.4).timeout
    quit(1 if failures else 0)
