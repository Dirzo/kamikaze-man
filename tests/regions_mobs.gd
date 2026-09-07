extends SceneTree
var checks := 0
var failures := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
    checks += 1
    print(("PASS: " if ok else "FAIL: ") + label)
    if not ok: failures += 1
func run():
    for class_index in range(4):
        var game = load("res://scenes/main.tscn").instantiate()
        game.save_path = ""
        root.add_child(game)
        game.choose_class(class_index)
        var p = game.get_node("Player")
        p.set_physics_process(false)
        p.position = Vector2(500,400)
        for enemy in get_nodes_in_group("enemies"):
            enemy.set_physics_process(false)
            enemy.position = Vector2(3000,500)
        var victims = [game.get_node("Enemy1"),game.get_node("Enemy2"),game.get_node("Enemy3")]
        for i in range(3):
            victims[i].position = Vector2(550+i*70,400)
            victims[i].max_hp = 5000
            victims[i].hp = 5000
        check(p.use_mobbing(), p.combat_class + " R activates")
        check(victims.all(func(e): return e.hp < 5000), p.combat_class + " R damages all nearby targets")
        check(not p.use_mobbing() and p.mob_timer == 8, "Mobbing cooldown prevents spam")
        check(p.ability_timer == 0 and p.skill_timer == 0, "R has independent cooldown from Q and E")
        p.mob_timer = 0
        p.input_locked = true
        check(not p.use_mobbing(), "Menus block R")
        p.input_locked = false
        p.dead = true
        check(not p.use_mobbing(), "Dead players cannot use R")
        game.queue_free()
        await process_frame
    var game = load("res://scenes/main.tscn").instantiate()
    game.save_path = ""
    root.add_child(game)
    game.choose_class(0)
    var p = game.get_node("Player")
    p.set_physics_process(false)
    for map in range(1,14):
        game.map_number = map
        game.generate_map()
        var expected: int = ((map-1)/3)%4
        check(game.biome_index == expected, "Correct three-map region on map %d" % map)
        check(get_nodes_in_group("enemies").size() == 4 + mini(14+(map-1)*4,36), "Increased population on map %d" % map)
        check(game.get_node("Ground/GrassArt").biome_index == expected, "Terrain matches region")
        var enemy = game.get_node("Enemy2")
        check(enemy.biome_index == expected and enemy.get_node("Name").text == game.Biomes.ENEMIES[expected][2].to_upper(), "Monster name and region match")
        check(enemy.get_node("Body/Portrait").texture.resource_path.ends_with("characters.png" if expected == 0 else "biome_enemies.png"), "Monster uses correct art atlas")
        if expected > 0:
            var background = game.get_node("Backdrop/RegionBackground").texture
            check(background is AtlasTexture and background.region.size.x > 600, "Region background has a valid atlas crop")
    game.map_number = 3
    game.generate_map()
    for e in get_nodes_in_group("enemies"): e.set_physics_process(false)
    game.get_node("Boss").take_damage(999999,p)
    while p.pending_upgrades > 0: game.choose_upgrade(0)
    await process_frame
    check(game.biome_index == 0 and game.reward_phase, "Mega reward shop stays in completed region")
    game.continue_run()
    check(game.map_number == 4 and game.biome_index == 1, "Leaving mega reward shop enters snowy region")
    game.queue_free()
    await create_timer(0.4).timeout
    print("%d checks, %d failures" % [checks,failures])
    quit(1 if failures else 0)
