extends SceneTree
var failures := 0
func _initialize():
    call_deferred("run")
func check(ok: bool, label: String):
    print(("PASS: " if ok else "FAIL: ") + label)
    if not ok:
        failures += 1
func run():
    var game = load("res://scenes/main.tscn").instantiate()
    game.save_path = ""
    root.add_child(game)
    var p = game.get_node("Player")
    p.set_physics_process(false)
    check(game.get_node("Boss").max_hp == 160 and game.get_node("Boss").contact_damage == 8 and not game.get_node("Boss").ranged, "First Collector has introductory stats and no bullets")
    p.take_damage(8)
    p.take_damage(8)
    check(p.hp == 92, "Consecutive hits respect damage grace period")
    game.souls = 20
    var key = InputEventKey.new()
    key.keycode = KEY_F2
    key.pressed = true
    game._unhandled_input(key)
    await process_frame
    check(game.class_playtest and game.choosing_class, "F2 opens immediate class playtest")
    for i in range(4):
        if i > 0:
            game.start_class_playtest()
        p = game.get_node("Player")
        game.choose_class(i)
        p.set_physics_process(false)
        for enemy in get_nodes_in_group("enemies"):
            enemy.set_physics_process(false)
        check(p.combat_class == ["fighter", "mage", "shooter", "bowman"][i] and not p.input_locked and p.hp == p.max_hp, "Fresh class test %d has full health and controls" % (i + 1))
        check(p.gold == 0 and p.level == 1, "Fresh test resets run stats")
    p.die()
    game.earn_souls(100)
    game.buy_permanent(0)
    check(game.death_screen and game.souls == 20 and game.permanent[0] == 0 and game.run_souls == 0, "Practice never earns or spends permanent rewards")
    game._unhandled_input(key)
    await process_frame
    check(game.choosing_class and not game.death_screen, "F2 escapes the death screen")
    game.choose_class(0)
    game.map_number = 2
    game.generate_map()
    check(game.get_node("Boss").ranged and game.get_node("Boss").max_hp > 260, "Later bosses retain advanced attacks")
    game.queue_free()
    await process_frame
    print("Playtest failures: %d" % failures)
    quit(1 if failures else 0)

