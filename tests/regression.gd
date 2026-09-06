extends SceneTree

var failures := 0

func _initialize():
    call_deferred("run")

func check(condition: bool, label: String):
    if condition:
        print("PASS: " + label)
    else:
        push_error("FAIL: " + label)
        failures += 1

func run():
    var game = load("res://scenes/main.tscn").instantiate()
    game.save_path = ""
    root.add_child(game)
    var p = game.get_node("Player")
    var e = game.get_node("Enemy1")
    p.set_physics_process(false)
    for enemy in get_nodes_in_group("enemies"):
        enemy.set_physics_process(false)
    p.crit_chance = 0.0
    p.position = Vector2(500, 550)
    e.position = Vector2(546, 550)
    await create_timer(0.1).timeout
    p.attack()
    await create_timer(0.15).timeout
    check(e.hp == e.max_hp - p.attack_damage, "First melee attack hits an overlapping enemy")

    p.hp = p.max_hp
    e.position = Vector2(500, 550)
    p.position = Vector2(500, 200)
    e.hit_timer = 0.0
    e._physics_process(0.016)
    check(p.hp == p.max_hp, "Enemies cannot hit a player far above them")
    p.position = Vector2(500, 550)
    p.input_locked = true
    e._physics_process(0.016)
    check(p.hp == p.max_hp, "Upgrade selection protects the player from enemy attacks")
    p.input_locked = false
    var boss = game.get_node("Boss")
    boss.position = Vector2(544, 550)
    boss._physics_process(0.016)
    check(p.hp == p.max_hp - boss.contact_damage, "Scaled boss can attack at its collision boundary")

    p.xp = 0
    p.gold = 0
    e.hp = 1
    e.take_damage(1, p)
    e.take_damage(1, p)
    await create_timer(0.1).timeout
    check(p.gold == e.gold_reward and p.xp == e.xp_reward, "Overlapping lethal hits award one kill")

    p.xp = 0
    p.level = 1
    p.xp_to_next = 100
    p.gain_xp(300)
    check(p.level == 3 and p.xp == 72, "Large XP awards grant every earned level")
    game.choose_upgrade(0)
    check(p.input_locked and game.get_node("HUD/LevelUp").visible, "Second earned upgrade remains selectable")
    game.choose_upgrade(0)
    check(not p.input_locked and not game.get_node("HUD/LevelUp").visible, "Final upgrade restores movement")

    var slot = game.get_node("SlotMachine")
    slot.break_chance = 0.0
    p.gold = 25
    p.luck = 1.0
    slot.spin()
    await create_timer(0.7).timeout
    check(p.gold == 100 and not slot.spinning, "Slot machine deducts cost and completes a jackpot spin")
    p.position = Vector2(-100, 2000)
    p._physics_process(0.016)
    check(p.dead and game.death_screen, "Falling ends the run and opens permanent upgrades")
    await create_timer(3.0).timeout
    game.queue_free()
    await process_frame
    print("Regression failures: %d" % failures)
    quit(1 if failures else 0)
