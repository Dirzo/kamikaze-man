extends SceneTree
var failures := 0
var checks := 0
func _initialize(): call_deferred("run")
func check(ok: bool, label: String):
    checks += 1
    print(("PASS: " if ok else "FAIL: ") + label)
    if not ok: failures += 1
func run():
    var game = load("res://scenes/main.tscn").instantiate()
    game.save_path = ""
    root.add_child(game)
    game.choose_class(0)
    var p = game.get_node("Player")
    p.set_physics_process(false)
    var slot = game.get_node("SlotMachine")
    check(not slot.visible and not slot.enabled, "Combat starts without a slot machine")
    p.gold = 100
    slot.player = p
    slot.spin()
    check(p.gold == 100 and not slot.spinning, "Disabled machine cannot charge gold")
    var last_hp := 0
    var last_count := 0
    for map in range(1, 7):
        game.map_number = map
        game.generate_map()
        var boss = game.get_node("Boss")
        check(boss.mega == (map % 3 == 0), "Mega boss schedule on map %d" % map)
        check(game.get_node("Enemy1").max_hp > last_hp, "Ordinary enemy health rises on map %d" % map)
        check(get_nodes_in_group("enemies").size() >= last_count, "Enemy count grows on map %d" % map)
        last_hp = game.get_node("Enemy1").max_hp
        last_count = get_nodes_in_group("enemies").size()
        if boss.mega:
            check(boss.max_hp > 700 and boss.scale.x == 2, "Mega boss has increased size and health")
            boss.target = p
            boss.shoot()
            check(get_nodes_in_group("projectiles").size() == 5, "Mega boss fires a five-shot fan")
            for shot in get_nodes_in_group("projectiles"): shot.free()
    var boss = game.get_node("Boss")
    for e in get_nodes_in_group("enemies"): e.set_physics_process(false)
    p.position = Vector2(500, 500)
    boss.position = Vector2(590, 500)
    boss.target = p
    boss.slam_timer = 0
    boss._physics_process(0.016)
    check(boss.slam_warning > 1, "Mega slam warns before dealing damage")
    var health: int = p.hp
    boss._physics_process(0.1)
    check(p.hp == health, "Slam warning gives time to dodge")
    p.position = Vector2(100, 500)
    boss._physics_process(1.2)
    check(p.hp == health, "Moving out of the warning avoids slam damage")
    p.position = Vector2(500, 500)
    boss.slam_warning = 0.01
    boss._physics_process(0.02)
    check(p.hp < health, "Standing in the slam takes damage")
    p.hp = p.max_hp
    boss.hp = 1
    boss.take_damage(99999,p)
    while p.pending_upgrades > 0: game.choose_upgrade(0)
    await process_frame
    check(game.reward_phase and game.shop_panel.visible, "Boss victory opens the item shop")
    slot = game.get_node("SlotMachine")
    check(slot.visible and slot.enabled, "Cleared map unlocks a slot machine")
    check(not p.is_processing_unhandled_input(), "Reward area blocks combat hotkeys")
    p.gold = 0
    check(not game.buy_shop(1), "Shop rejects unaffordable purchase")
    p.gold = 500
    var damage: int = p.attack_damage
    var cost: int = game.SHOP[1].cost + (game.map_number - 1) * 5
    check(game.buy_shop(1) and p.attack_damage == damage + 6 and p.gold == 500 - cost, "Weapon purchase charges exact price and applies bonus")
    check(not game.buy_shop(1), "Each shop item sells only once per clear")
    check(not game.buy_shop(0), "Full health prevents wasting gold on healing")
    p.hp -= 60
    check(game.buy_shop(0) and p.hp == p.max_hp - 10, "Shop tonic restores 50 HP")
    slot.spinning = true
    check(not game.continue_run(), "Cannot leave during a paid spin")
    slot.spinning = false
    check(game.continue_run() and game.map_number == 7, "Enter continuation begins the next combat map")
    check(not game.shop_panel.visible and not game.get_node("SlotMachine").enabled, "Shop and slot close during combat")
    check(p.is_processing_unhandled_input(), "Next map restores combat hotkeys")
    game.queue_free()
    await create_timer(0.4).timeout
    print("%d checks, %d failures" % [checks, failures])
    quit(1 if failures else 0)
