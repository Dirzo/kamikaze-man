extends SceneTree
var failures := 0
func _initialize():
    call_deferred("run")
func check(ok: bool, label: String):
    print(("PASS: " if ok else "FAIL: ") + label)
    if not ok:
        failures += 1
func new_game():
    var game = load("res://scenes/main.tscn").instantiate()
    game.save_path = ""
    root.add_child(game)
    game.get_node("Player").set_physics_process(false)
    for enemy in get_nodes_in_group("enemies"):
        enemy.set_physics_process(false)
    return game
func run():
    var game = new_game()
    var p = game.get_node("Player")
    var boss = game.get_node("Boss")
    var platform_position = game.get_node("Platform1").position
    game.get_node("SlotMachine").broken = true
    boss.take_damage(9999, p)
    check(game.choosing_class and game.map_number == 1, "First boss waits for class selection")
    game.choose_class(0)
    while p.pending_upgrades > 0:
        game.choose_upgrade(0)
    await process_frame
    check(game.map_number == 2 and boss.alive, "Boss victory generates next map")
    check(not game.get_node("SlotMachine").broken, "New map has a working slot machine")
    check(game.get_node("Platform1").position != platform_position and boss.max_hp > 260, "Map layout varies and difficulty increases")
    check(p.class_name_display == "Fighter" and p.gold == 80, "Run build and gold survive map transition")
    for enemy in get_nodes_in_group("extra_enemies"):
        enemy.position = Vector2(4000, 500)
        enemy.set_physics_process(false)
    p.position = Vector2(1000, 500)
    boss.position = Vector2(1100, 500)
    boss.hp = 1
    game.get_node("Enemy1").position = Vector2(1050, 500)
    game.get_node("Enemy2").position = Vector2(1800, 500)
    game.get_node("Enemy3").position = Vector2(2200, 500)
    var distant_hp = game.get_node("Enemy2").hp
    p.kamikaze()
    await process_frame
    check(p.dead and p.hp == 0 and game.death_screen, "Kamikaze ends the life and opens death upgrades")
    check(not boss.alive and not game.get_node("Enemy1").alive, "Kamikaze damages nearby enemies and boss")
    check(game.get_node("Enemy2").hp == distant_hp, "Kamikaze respects blast radius")
    check(game.map_number == 2 and not game.choosing_class, "Kamikaze boss kill cannot advance a dead run")
    var bank = game.souls
    p.kamikaze()
    p.die()
    check(game.souls == bank and bank == 11, "Soul rewards include blast kills and bank only once")
    var path = "user://test_progress_%d.cfg" % Time.get_ticks_usec()
    game.save_path = path
    game.buy_permanent(0)
    check(game.permanent[0] == 1 and game.souls == bank - 3, "Permanent upgrade spends souls")
    var saved = load("res://scenes/main.tscn").instantiate()
    saved.save_path = path
    root.add_child(saved)
    saved.get_node("Player").set_physics_process(false)
    check(saved.get_node("Player").max_hp == 110 and saved.souls == bank - 3, "Upgrades and currency persist into a fresh run")
    check(saved.map_number == 1 and saved.get_node("Player").class_name_display == "Recruit" and saved.get_node("Player").gold == 0, "Fresh run resets map, class, and gold")
    DirAccess.remove_absolute(path)
    saved.queue_free()
    game.queue_free()
    await process_frame
    var jump_game = new_game()
    var jumper = jump_game.get_node("Player")
    jumper.position = Vector2(180, 584)
    jumper.velocity = Vector2(0, 100)
    await physics_frame
    jumper.move_and_slide()
    await physics_frame
    jumper.move_and_slide()
    var key = InputEventKey.new()
    key.keycode = KEY_ALT
    key.pressed = true
    jumper._unhandled_input(key)
    check(jumper.velocity.y == jumper.jump_velocity, "Alt triggers jump on the ground")
    jumper.velocity.y = 0
    key.keycode = KEY_SPACE
    jumper._unhandled_input(key)
    check(jumper.velocity.y == 0, "Space no longer triggers jump")
    jump_game.queue_free()
    await process_frame
    print("Run-loop failures: %d" % failures)
    # Let the audio thread release stopped playback before engine shutdown.
    await create_timer(0.15).timeout
    quit(1 if failures else 0)
