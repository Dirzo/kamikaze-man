extends SceneTree
var failures := 0
func _initialize():
    call_deferred("run")
func check(ok: bool, label: String):
    print(("PASS: " if ok else "FAIL: ") + label)
    if not ok:
        failures += 1
func run():
    for id in ["fighter", "mage", "shooter", "bowman"]:
        var game = load("res://scenes/main.tscn").instantiate()
        game.save_path = ""
        game.start_with_class_menu = false
        root.add_child(game)
        var p = game.get_node("Player")
        p.set_physics_process(false)
        for enemy in get_nodes_in_group("enemies"):
            enemy.set_physics_process(false)
            enemy.position = Vector2(3000, 400)
        var e = game.get_node("Enemy1")
        var second = game.get_node("Enemy2")
        p.position = Vector2(500, 400)
        p.crit_chance = 0.0
        p.select_class(id)
        p.crit_chance = 0.0
        e.position = Vector2(560 if id == "fighter" else 700, 400)
        second.position = Vector2(750, 400)
        e.max_hp = 500
        e.hp = 500
        second.max_hp = 500
        second.hp = 500
        await create_timer(0.05).timeout
        p.attack()
        await create_timer(0.7).timeout
        check(e.hp < 500, id + " primary attack deals damage")
        if id in ["mage", "bowman"]:
            check(second.hp < 500, id + " damages multiple targets")
        elif id == "shooter":
            check(second.hp == 500, "Bullet stops at the first enemy")
        p.skill_timer = 0
        e.position = p.position + Vector2(80, 0)
        var before = e.hp
        p.use_skill()
        var count = get_nodes_in_group("projectiles").size()
        p.use_skill()
        check(p.skill_timer > 0 and get_nodes_in_group("projectiles").size() == count, id + " skill has a cooldown")
        await create_timer(0.5).timeout
        check(e.hp < before, id + " Q skill deals damage")
        if id == "fighter":
            p.guard_timer = 0.5
            var health = p.hp
            p.take_damage(10)
            check(p.hp == health, "Whirlwind guard blocks damage")
        p.input_locked = true
        p.skill_timer = 0
        p.use_skill()
        check(p.skill_timer == 0, id + " skill respects menus")
        game.queue_free()
        await process_frame
    var game = load("res://scenes/main.tscn").instantiate()
    game.save_path = ""
    game.start_with_class_menu = false
    root.add_child(game)
    var p = game.get_node("Player")
    p.set_physics_process(false)
    for enemy in get_nodes_in_group("enemies"):
        enemy.set_physics_process(false)
    game.show_class_selection()
    check(game.get_node("HUD/LevelUp/Choice4").visible, "Class screen displays all four choices")
    var key = InputEventKey.new()
    key.keycode = KEY_4
    key.pressed = true
    game._unhandled_input(key)
    check(p.combat_class == "bowman" and not p.input_locked, "Key 4 selects Bowman")
    check(get_nodes_in_group("enemies").size() == 7 and game.has_node("Platform6"), "Expanded first map contains seven enemies and six platforms")
    var gunner = game.get_node("Enemy2")
    p.position = Vector2(500, 400)
    gunner.position = Vector2(650, 400)
    gunner.target = p
    gunner.shoot()
    var health = p.hp
    await create_timer(0.6).timeout
    check(p.hp < health, "Enemy projectiles can damage the player")
    p.fire_projectile("bowman")
    game.generate_map()
    check(get_nodes_in_group("projectiles").is_empty(), "Map generation removes old projectiles")
    game.queue_free()
    await process_frame
    print("Class-combat failures: %d" % failures)
    # Let the audio thread release stopped playback before engine shutdown.
    await create_timer(0.15).timeout
    quit(1 if failures else 0)

