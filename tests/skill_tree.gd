extends SceneTree
var failures := 0
func _initialize():
    call_deferred("run")
func check(ok: bool, label: String):
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
func run():
    var game = setup()
    var p = game.get_node("Player")
    var e = game.get_node("Enemy1")
    p.hp = 50
    e.hp = 10
    e.take_damage(1000, p)
    check(p.hp == 50 and is_equal_approx(p.heal_fraction, 0.5), "Overkill lifesteal uses actual remaining enemy health")
    e.respawn()
    e.take_damage(10, p)
    check(p.hp == 51, "Fractional lifesteal accumulates instead of rounding every hit")
    p.hp = p.max_hp - 1
    p.on_damage_dealt(1000)
    check(p.hp == p.max_hp, "Healing cannot exceed maximum HP")
    p.dead = true
    p.hp = 0
    p.on_damage_dealt(1000)
    check(p.hp == 0, "Lifesteal cannot revive a dead or kamikaze player")
    game.queue_free()
    await process_frame
    for id in ["fighter", "mage", "shooter", "bowman"]:
        for branch in range(3):
            game = setup()
            p = game.get_node("Player")
            e = game.get_node("Enemy1")
            p.select_class(id)
            p.skill_points = 6
            p.position = Vector2(500, 400)
            e.position = Vector2(580, 400)
            e.max_hp = 2000
            e.hp = 2000
            for rank in range(3):
                check(p.invest_style(branch), id + " branch %d rank %d can be learned" % [branch, rank + 1])
            check(p.skill_points == 0 and not p.invest_style(branch) and not p.invest_style((branch + 1) % 3), id + " branch costs, cap, and exclusivity are enforced")
            p.use_skill()
            await create_timer(0.4).timeout
            check(e.hp < 2000, p.style_id + " skill deals real damage")
            if p.style_id in ["bloodblade", "siphon", "thorn"]:
                check(p.lifesteal_rate() >= 0.20, p.style_id + " has meaningful lifesteal")
            if p.style_id == "guardian":
                check(p.guard_timer == 3.0 and e.slow_factor <= 0.3, "Guardian guards and slows")
            if p.style_id == "pyromancer":
                check(e.burn_timer > 0, "Pyromancer applies burning")
                var before = e.hp
                e.target = p
                e._physics_process(1.01)
                check(e.hp < before, "Burn deals a delayed damage tick")
            if p.style_id == "cryomancer":
                check(e.slow_factor <= 0.15, "Cryomancer applies strong crowd control")
            game.queue_free()
            await process_frame
    game = setup()
    p = game.get_node("Player")
    p.select_class("mage")
    var event = InputEventKey.new()
    event.keycode = KEY_T
    event.pressed = true
    game._unhandled_input(event)
    check(game.tree_open and p.input_locked and game.tree_panel.visible, "T opens a safe skill tree")
    event.keycode = KEY_1
    game._unhandled_input(event)
    check(p.style_id == "pyromancer" and p.style_rank == 1, "Tree keyboard selection purchases a branch")
    event.keycode = KEY_ESCAPE
    game._unhandled_input(event)
    check(not game.tree_open and not p.input_locked, "Escape restores gameplay")
    game.start_class_playtest()
    game.choose_class(2)
    check(game.get_node("Player").skill_points == 6 and game.get_node("Player").style_id.is_empty(), "F2 grants enough points to fully test any fresh branch")
    game.queue_free()
    await process_frame
    print("Skill-tree failures: %d" % failures)
    # Let the audio thread release stopped playback before engine shutdown.
    await create_timer(0.4).timeout
    quit(1 if failures else 0)

