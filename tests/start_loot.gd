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
    root.add_child(game)
    game.get_node("Player").set_physics_process(false)
    for e in get_nodes_in_group("enemies"):
        e.set_physics_process(false)
    return game
func run():
    for index in range(4):
        var game = setup()
        var p = game.get_node("Player")
        check(game.choosing_class and p.input_locked and game.get_node("HUD/LevelUp/Choice4").visible, "Fresh run offers four classes safely")
        var key := InputEventKey.new()
        key.pressed = true
        key.keycode = KEY_1 + index
        game._unhandled_input(key)
        check(p.combat_class == ["fighter","mage","shooter","bowman"][index] and p.class_selected, "Starting choice selects class %d" % index)
        check(not p.input_locked and p.skill_points == 3 and p.hp == p.max_hp, "Chosen class starts ready with skill points and full HP")
        check(p.use_ability(), "E ability is available before any boss")
        game.queue_free()
        await process_frame
    var game = setup()
    game.choose_class(0)
    var p = game.get_node("Player")
    var enemy = game.get_node("Enemy1")
    p.position = Vector2(200, 500)
    enemy.position = Vector2(1000, 550)
    enemy.hp = 1
    enemy.take_damage(999, p)
    enemy.take_damage(999, p)
    var gold := 0
    for drop in get_nodes_in_group("loot"):
        if drop.kind == "gold":
            gold += drop.amount
    check(p.gold == 0 and gold == enemy.gold_reward, "Kill drops exact gold once instead of crediting remotely")
    for drop in get_nodes_in_group("loot"):
        if drop.kind == "gold":
            check(drop.collect(p) and not drop.collect(p), "Pickup awards only once")
    check(p.gold == enemy.gold_reward, "Collected gold reaches player wallet")
    await process_frame
    for drop in get_nodes_in_group("loot"):
        drop.free()
    var loot = load("res://scripts/loot.gd")
    for kind in ["tonic","fang","heart","ruby"]:
        var item = loot.new()
        item.kind = kind
        game.add_child(item)
        p.hp = 30
        var before_hp: int = p.hp
        var before_max: int = p.max_hp
        var before_damage: int = p.attack_damage
        var before_leech: float = p.lifesteal
        item.collect(p)
        match kind:
            "tonic": check(p.hp == before_hp + 30, "Tonic heals 30 HP")
            "fang": check(p.attack_damage == before_damage + 3, "Fang adds run damage")
            "heart": check(p.max_hp == before_max + 8 and p.hp == before_hp + 8, "Heartstone grants max HP and healing")
            "ruby": check(is_equal_approx(p.lifesteal, before_leech + 0.01), "Ruby adds lifesteal")
    await process_frame
    p.hp = p.max_hp
    var tonic = loot.new()
    tonic.kind = "tonic"
    game.add_child(tonic)
    check(not tonic.collect(p) and not tonic.collected, "Full-health player leaves tonic available")
    tonic.free()
    var coin = loot.new()
    coin.amount = 5
    coin.position = p.position + Vector2(20, 0)
    game.add_child(coin)
    var wallet: int = p.gold
    await create_timer(0.7).timeout
    check(p.gold == wallet + 5, "Nearby coin physically attracts and collects")
    var boss = game.get_node("Boss")
    boss.hp = 1
    boss.take_damage(999, p)
    var item_count := 0
    for drop in get_nodes_in_group("loot"):
        if drop.kind != "gold": item_count += 1
    check(item_count == 1, "Boss guarantees one item")
    check(not game.choosing_class and game.next_map_pending, "Boss keeps starting class and queues next map")
    while p.pending_upgrades > 0:
        game.choose_upgrade(0)
    await process_frame
    check(game.reward_phase and game.map_number == 1 and p.gold == wallet + 5 + boss.gold_reward, "Map clear collects boss gold before the reward shop")
    game.continue_run()
    check(get_nodes_in_group("loot").is_empty(), "Old drops do not leak into new map")
    var dead_drop = loot.new()
    game.add_child(dead_drop)
    p.dead = true
    check(not dead_drop.collect(p), "Dead player cannot collect rewards")
    game.queue_free()
    await create_timer(0.4).timeout
    print("%d checks, %d failures" % [checks,failures])
    quit(1 if failures else 0)
