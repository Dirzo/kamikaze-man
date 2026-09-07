extends SceneTree

var failures := 0

func _initialize():
    call_deferred("run")

func check(ok: bool, label: String):
    if ok:
        print("PASS: " + label)
    else:
        push_error("FAIL: " + label)
        failures += 1

func run():
    var game = load("res://scenes/main.tscn").instantiate()
    game.save_path = ""
    game.start_with_class_menu = false
    root.add_child(game)
    var p = game.get_node("Player")
    var slot = game.get_node("SlotMachine")
    var boss = game.get_node("Boss")
    p.set_physics_process(false)
    for enemy in get_nodes_in_group("enemies"):
        enemy.set_physics_process(false)
    await create_timer(0.1).timeout
    check(is_equal_approx(slot.break_chance, 0.30), "Default breakdown chance is 30 percent")
    slot.break_chance = 1.0
    p.gold = 0
    slot.spin()
    check(not slot.broken and not slot.spinning, "Unaffordable spin does not break the machine")
    p.gold = 25
    p.luck = 1.0
    slot.spin()
    slot.spin()
    await create_timer(0.7).timeout
    check(slot.broken and p.gold == 100, "Breaking spin pays once before going out of service")
    slot.spin()
    await create_timer(0.7).timeout
    check(p.gold == 100 and slot.get_node("Prompt").text.contains("BROKEN"), "Broken machine blocks further charges")

    var e = game.get_node("Enemy1")
    p.position = Vector2(500, 500)
    p.crit_chance = 0.0
    e.position = Vector2(585, 500)
    await create_timer(0.1).timeout
    p.attack()
    await create_timer(0.1).timeout
    check(e.hp == e.max_hp - p.attack_damage, "Sword hits at its extended reach")
    p.attack_timer = 0.0
    e.hp = e.max_hp
    e.position = Vector2(620, 500)
    await create_timer(0.1).timeout
    p.attack()
    await create_timer(0.1).timeout
    check(e.hp == e.max_hp, "Sword does not hit outside melee range")
    p.attack_timer = 0.0
    p.get_node("AttackArea").position.x = -55
    p.get_node("Body").scale.x = -1
    e.position = Vector2(415, 500)
    await create_timer(0.1).timeout
    p.attack()
    await create_timer(0.1).timeout
    check(e.hp == e.max_hp - p.attack_damage, "Sword also hits to the left")
    p.input_locked = true
    p.attack_timer = 0.0
    p.attack()
    check(p.attack_timer == 0.0, "Menus block new sword attacks")
    p.input_locked = false

    game.show_class_selection()
    game.choose_class(0)
    p.xp = 90
    boss.respawn_delay = 0.15
    boss.take_damage(999, p)
    check(not game.choosing_class and p.input_locked, "Boss victory opens earned upgrades, not class selection")
    check(p.pending_upgrades == 2, "Boss XP queues all earned levels")
    check(game.get_node("HUD/LevelUp/Title").text.contains("LEVEL UP"), "Boss victory shows level-up options")
    check(p.class_name_display == "Fighter", "Starting class survives boss victory")
    game.choose_upgrade(0)
    game.choose_upgrade(0)
    check(not p.input_locked, "All queued choices return control")
    await create_timer(0.25).timeout
    boss.take_damage(999, p)
    check(not game.choosing_class, "Later-map boss never repeats class selection")
    while p.pending_upgrades > 0:
        game.choose_upgrade(0)
    p.die()
    check(game.death_screen and not p.select_class("bowman"), "Death opens shop and prevents stacking classes on the ended run")

    for id in ["mage", "shooter", "bowman"]:
        var fighter = load("res://scenes/player.tscn").instantiate()
        root.add_child(fighter)
        fighter.set_physics_process(false)
        fighter.select_class(id)
        if id == "mage":
            check(fighter.attack_damage == 36 and fighter.max_hp == 85, "Mage applies damage and health tradeoff")
        elif id == "shooter":
            check(fighter.attack_damage == 14 and is_equal_approx(fighter.attack_cooldown, 0.16), "Shooter applies rapid-fire stats")
        else:
            check(fighter.move_speed == 325.0 and is_equal_approx(fighter.crit_chance, 0.18), "Bowman applies movement and crit bonuses")
        fighter.queue_free()
    await create_timer(0.3).timeout
    game.queue_free()
    await process_frame
    print("Feature failures: %d" % failures)
    # Let the audio thread release stopped playback before engine shutdown.
    await create_timer(0.15).timeout
    quit(1 if failures else 0)
