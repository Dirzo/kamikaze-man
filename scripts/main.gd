extends Node2D

var upgrade_pool = [
    {"id":"damage", "name":"HIGH CALIBER", "desc":"+6 attack damage"},
    {"id":"speed", "name":"LIGHT FEET", "desc":"+25 move speed"},
    {"id":"health", "name":"THICK SKIN", "desc":"+20 max HP"},
    {"id":"attack_speed", "name":"HAIR TRIGGER", "desc":"Attack faster"},
    {"id":"crit", "name":"LOADED DICE", "desc":"+6% crit chance"},
    {"id":"dash", "name":"AFTERBURNER", "desc":"Dash cooldown reduced"},
    {"id":"luck", "name":"HOUSE EDGE", "desc":"Better gambling odds"},
]

var current_choices = []
var message_timer := 0.0
var choosing_class := false
var first_boss_defeated := false
@export var save_path := "user://kamikaze_progress.cfg"
var souls := 0
var run_souls := 0
var permanent := [0, 0, 0]
var death_screen := false
var map_number := 1
var next_map_pending := false
var map_rng := RandomNumberGenerator.new()
var class_playtest := false
var class_choices = [
    {"id":"fighter", "name":"FIGHTER", "desc":"Sword • +50 HP, +6 damage • Q: Whirlwind + brief guard"},
    {"id":"mage", "name":"MAGE", "desc":"Explosive magic • +14 damage, -15 HP • Q: Arcane Nova"},
    {"id":"shooter", "name":"SHOOTER", "desc":"Rapid gunfire • Fast movement • Q: Five-shot spread"},
    {"id":"bowman", "name":"BOWMAN", "desc":"Piercing arrows • +10% crit • Q: Triple-damage arrow"},
]

func _ready():
    randomize()
    var fourth = $HUD/LevelUp/Choice3.duplicate()
    fourth.name = "Choice4"
    $HUD/LevelUp.add_child(fourth)
    fourth.hide()
    $Player.add_to_group("player")
    $Player.stats_changed.connect(update_hud)
    $Player.level_up_requested.connect(show_level_up)
    $Player.message_requested.connect(show_message)
    $SlotMachine.result.connect(show_message)
    $Boss.boss_defeated.connect(on_boss_defeated)
    $Player.died.connect(show_death)
    for enemy in [$Enemy1, $Enemy2, $Enemy3, $Boss]:
        enemy.defeated.connect(earn_souls)
    load_progress()
    $Player.max_hp += permanent[0] * 10
    $Player.hp = $Player.max_hp
    $Player.attack_damage += permanent[1] * 3
    $Player.kamikaze_bonus = permanent[2] * 50
    map_rng.randomize()
    generate_map()
    update_hud()
    $HUD/Controls.text = "← → MOVE   ALT JUMP   ↓ + ALT DROP   CTRL ATTACK   Q SKILL   SHIFT DASH   Z SPIN   K KAMIKAZE"
    var practice_hint := Label.new()
    practice_hint.position = Vector2(20, 78)
    practice_hint.text = "F2 — FRESH CLASS PLAYTEST (no permanent rewards)"
    $HUD.add_child(practice_hint)
    show_message("F2 lets you try any class immediately. Alt jumps.")

func _process(delta):
    if is_instance_valid($Player):
        $HUD/Build.text = "%s  |  DMG %d  CRIT %d%%  |  Q: %s %s" % [$Player.class_name_display, $Player.attack_damage, int($Player.crit_chance * 100), $Player.skill_name, "READY" if $Player.skill_timer <= 0 else "%.1fs" % $Player.skill_timer]
    if message_timer > 0.0:
        message_timer -= delta
        if message_timer <= 0.0:
            $HUD/Message.text = ""

func _unhandled_input(event):
    if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F2:
        call_deferred("start_class_playtest")
        return
    if death_screen:
        if event is InputEventKey and event.pressed and not event.echo:
            if event.keycode == KEY_ENTER:
                get_tree().reload_current_scene()
            elif event.keycode in [KEY_1, KEY_2, KEY_3]:
                buy_permanent(event.keycode - KEY_1)
        return
    if not $HUD/LevelUp.visible:
        return
    if event is InputEventKey and event.pressed and not event.echo:
        if event.keycode == KEY_1:
            choose_upgrade(0)
        elif event.keycode == KEY_2:
            choose_upgrade(1)
        elif event.keycode == KEY_3:
            choose_upgrade(2)
        elif event.keycode == KEY_4 and choosing_class:
            choose_class(3)

func update_hud():
    var p = $Player
    $HUD/Stats.text = "MAP %d   HP %d/%d   LV %d   XP %d/%d   GOLD %d" % [
        map_number, p.hp, p.max_hp, p.level, p.xp, p.xp_to_next, p.gold
    ]
    $HUD/Build.text = "%s   DMG %d   CRIT %d%%   SPEED %d" % [
        p.class_name_display, p.attack_damage, int(round(p.crit_chance * 100.0)), int(p.move_speed)
    ]

func show_level_up():
    if choosing_class or death_screen or $Player.dead:
        return
    current_choices = upgrade_pool.duplicate(true)
    layout_choices(false)
    current_choices.shuffle()
    current_choices = current_choices.slice(0, 3)

    $HUD/LevelUp.visible = true
    $HUD/LevelUp/Title.text = "LEVEL UP — PICK YOUR POISON"
    $HUD/LevelUp/Choice1.text = "1  %s\n%s" % [current_choices[0].name, current_choices[0].desc]
    $HUD/LevelUp/Choice2.text = "2  %s\n%s" % [current_choices[1].name, current_choices[1].desc]
    $HUD/LevelUp/Choice3.text = "3  %s\n%s" % [current_choices[2].name, current_choices[2].desc]

func choose_upgrade(index: int):
    if death_screen:
        return
    if not $HUD/LevelUp.visible:
        return
    if choosing_class:
        choose_class(index)
        return
    if index < 0 or index >= current_choices.size():
        return
    var choice = current_choices[index]
    $HUD/LevelUp.visible = false
    $Player.apply_upgrade(choice.id)
    show_message("%s acquired." % choice.name)
    try_next_map()

func show_class_selection():
    if first_boss_defeated:
        return
    first_boss_defeated = true
    layout_choices(true)
    choosing_class = true
    $Player.input_locked = true
    $Player.velocity = Vector2.ZERO
    $Player.dash_timer = 0.0
    $HUD/LevelUp.visible = true
    $HUD/LevelUp/Title.text = "FIRST BOSS DEFEATED — CHOOSE A CLASS"
    for index in range(4):
        var choice = class_choices[index]
        get_node("HUD/LevelUp/Choice%d" % (index + 1)).text = "%d  %s\n%s" % [index + 1, choice.name, choice.desc]

func choose_class(index: int):
    if not choosing_class or index < 0 or index >= class_choices.size():
        return
    if not $Player.select_class(class_choices[index].id):
        return
    choosing_class = false
    layout_choices(false)
    $HUD/LevelUp.visible = false
    $Player.input_locked = $Player.pending_upgrades > 0
    if $Player.input_locked:
        show_level_up()
    show_message("%s chosen. Your new path begins!" % $Player.class_name_display)
    try_next_map()

func on_boss_defeated():
    if $Player.dead or next_map_pending:
        return
    next_map_pending = true
    show_class_selection()
    # Finish the lethal attack before moving any physics bodies.
    call_deferred("try_next_map")

func try_next_map():
    if not next_map_pending or choosing_class or $Player.pending_upgrades > 0 or $Player.dead:
        return
    next_map_pending = false
    map_number += 1
    generate_map()
    show_message("MAP %d — new enemies, new ground, fresh slot machine!" % map_number)

func generate_map():
    for group in ["projectiles", "combat_effects", "extra_enemies", "scenery"]:
        for old in get_tree().get_nodes_in_group(group):
            if old.get_parent() != self:
                continue
            remove_child(old)
            old.queue_free()
    var width: float = 3400.0 + map_rng.randi_range(0, 5) * 120.0
    var ground_shape = RectangleShape2D.new()
    ground_shape.size = Vector2(width, 80)
    $Ground.position = Vector2(width / 2.0, 650)
    $Ground/CollisionShape2D.shape = ground_shape
    $Ground/Visual.polygon = PackedVector2Array([Vector2(-width/2, -40), Vector2(width/2, -40), Vector2(width/2, 40), Vector2(-width/2, 40)])
    var tint := Color.from_hsv(fmod(map_number * 0.17, 1.0), 0.35, 0.28)
    $Ground/Visual.color = tint
    for i in range(6):
        if not has_node("Platform%d" % (i + 1)):
            var extra_platform = $Platform1.duplicate()
            extra_platform.name = "Platform%d" % (i + 1)
            add_child(extra_platform)
        var platform = get_node("Platform%d" % (i + 1))
        platform.position = Vector2(650 + i * (width - 1000) / 6.0 + map_rng.randf_range(-50, 50), map_rng.randf_range(545, 565))
        var span := map_rng.randf_range(260, 420)
        var shape = RectangleShape2D.new()
        shape.size = Vector2(span, 24)
        platform.get_node("CollisionShape2D").shape = shape
        platform.get_node("Visual").polygon = PackedVector2Array([Vector2(-span/2, -12), Vector2(span/2, -12), Vector2(span/2, 12), Vector2(-span/2, 12)])
        platform.get_node("Visual").color = tint.lightened(0.2)
    var enemies = [$Enemy1, $Enemy2, $Enemy3, $Boss]
    for i in range(4):
        var enemy = enemies[i]
        enemy.start_position = Vector2(width - 230 if i == 3 else 750 + i * (width - 1300) / 3.0 + map_rng.randf_range(-80, 80), 560)
        enemy.max_hp = int([55, 75, 90, 260][i] * (1.0 + (map_number - 1) * 0.22))
        enemy.contact_damage = int([10, 10, 14, 22][i] * (1.0 + (map_number - 1) * 0.12))
        if i == 3:
            enemy.move_speed = 65.0 if map_number == 1 else 90.0
            if map_number == 1:
                enemy.max_hp = 160
                enemy.contact_damage = 8
        enemy.velocity = Vector2.ZERO
        enemy.respawn()
        enemy.ranged = i == 1 or (i == 3 and map_number > 1)
    $Enemy2.get_node("Name").text = "GUNNER"
    $Enemy2.get_node("Body").color = Color(1, 0.65, 0.25)
    $Boss.get_node("Name").text = ["THE COLLECTOR", "ARCANE WARDEN", "IRON MARSHAL"][(map_number - 1) % 3]
    for i in range(mini(3 + map_number - 1, 7)):
        var enemy = load("res://scenes/enemy.tscn").instantiate()
        enemy.position = Vector2(1000 + i * (width - 1400) / mini(3 + map_number - 1, 7), 580)
        enemy.ranged = i % 2 == 0
        enemy.enemy_name = "HEX CASTER" if enemy.ranged else "RAIDER"
        enemy.max_hp = int((65 + i * 8) * (1 + (map_number - 1) * 0.22))
        enemy.contact_damage = 10 + map_number * 2
        enemy.xp_reward = 35
        enemy.gold_reward = 12
        enemy.add_to_group("extra_enemies")
        add_child(enemy)
        enemy.defeated.connect(earn_souls)
        enemy.get_node("Body").color = Color(0.8, 0.3, 0.9) if enemy.ranged else Color(1, 0.4, 0.25)
    for i in range(18):
        var building = Polygon2D.new()
        var height := map_rng.randf_range(80, 280)
        building.polygon = PackedVector2Array([Vector2(0, 0), Vector2(130, 0), Vector2(130, -height), Vector2(0, -height)])
        building.position = Vector2(i * width / 18, 610)
        building.color = tint.darkened(0.55)
        building.z_index = -2
        building.add_to_group("scenery")
        add_child(building)
    $HUD/Title.text = ["NEON OUTSKIRTS", "HEX DISTRICT", "IRON BARRICADE"][(map_number - 1) % 3]
    var old_slot = $SlotMachine
    remove_child(old_slot)
    old_slot.queue_free()
    var slot = load("res://scenes/slot_machine.tscn").instantiate()
    slot.name = "SlotMachine"
    slot.position = Vector2(map_rng.randf_range(330, 430), 555)
    add_child(slot)
    slot.result.connect(show_message)
    $Player.global_position = Vector2(180, 520)
    $Player.velocity = Vector2.ZERO
    $Player.dash_timer = 0.0
    $Player.skill_timer = 0.0
    $Player.get_node("Camera2D").reset_smoothing()
    update_hud()

func earn_souls(amount: int):
    if class_playtest:
        return
    run_souls += amount

func load_progress():
    if save_path.is_empty():
        return
    var config := ConfigFile.new()
    if config.load(save_path) != OK:
        return
    souls = maxi(0, int(config.get_value("progress", "souls", 0)))
    for i in range(3):
        permanent[i] = clampi(int(config.get_value("progress", "upgrade_%d" % i, 0)), 0, 100)

func save_progress() -> bool:
    if class_playtest:
        return true
    if save_path.is_empty():
        return true
    var config := ConfigFile.new()
    config.set_value("progress", "souls", souls)
    for i in range(3):
        config.set_value("progress", "upgrade_%d" % i, permanent[i])
    return config.save(save_path) == OK

func show_death():
    if death_screen:
        return
    death_screen = true
    for enemy in get_tree().get_nodes_in_group("enemies"):
        enemy.set_physics_process(false)
    choosing_class = false
    next_map_pending = false
    souls += run_souls
    var earned := run_souls
    run_souls = 0
    refresh_death_screen()
    if not save_progress():
        show_message("Progress could not be saved. Check disk access before quitting.")
    else:
        show_message("Run ended. Earned %d souls." % earned)

func upgrade_cost(index: int) -> int:
    return 3 + permanent[index] * 2

func buy_permanent(index: int):
    if class_playtest:
        show_message("Practice does not change permanent upgrades. Enter starts a normal run.")
        return
    if not death_screen or index < 0 or index > 2:
        return
    var cost := upgrade_cost(index)
    if souls < cost or permanent[index] >= 100:
        show_message("Not enough souls, or upgrade is maxed.")
        return
    souls -= cost
    permanent[index] += 1
    if not save_progress():
        souls += cost
        permanent[index] -= 1
        show_message("Purchase cancelled: could not save progress.")
    refresh_death_screen()

func refresh_death_screen():
    layout_choices(false)
    $HUD/LevelUp.visible = true
    $HUD/LevelUp/Title.text = "RUN ENDED — %d SOULS" % souls
    var labels = ["IRON HEART: +10 starting HP", "SHARP STEEL: +3 starting weapon damage", "LAST WORD: +50 kamikaze damage"]
    for i in range(3):
        get_node("HUD/LevelUp/Choice%d" % (i + 1)).text = "%d  %s\nRank %d • Cost %d souls • Permanent" % [i + 1, labels[i], permanent[i], upgrade_cost(i)]
    $HUD/LevelUp/Hint.text = "1 / 2 / 3 BUY     ENTER START NEW RUN"
    if class_playtest:
        $HUD/LevelUp/Title.text = "CLASS PLAYTEST COMPLETE"
        for i in range(3):
            get_node("HUD/LevelUp/Choice%d" % (i + 1)).text = ["F2 — Try another class with a fresh build", "ENTER — Return to a normal run", "Permanent souls and upgrades are unchanged."][i]
        $HUD/LevelUp/Hint.text = "F2 TRY ANOTHER CLASS     ENTER NORMAL RUN"

func start_class_playtest():
    class_playtest = true
    death_screen = false
    choosing_class = false
    first_boss_defeated = false
    next_map_pending = false
    run_souls = 0
    map_number = 1
    current_choices.clear()
    var old_player = $Player
    remove_child(old_player)
    old_player.queue_free()
    var player = load("res://scenes/player.tscn").instantiate()
    player.name = "Player"
    add_child(player)
    player.add_to_group("player")
    player.stats_changed.connect(update_hud)
    player.level_up_requested.connect(show_level_up)
    player.message_requested.connect(show_message)
    player.died.connect(show_death)
    player.max_hp += permanent[0] * 10
    player.hp = player.max_hp
    player.attack_damage += permanent[1] * 3
    player.kamikaze_bonus = permanent[2] * 50
    generate_map()
    for enemy in get_tree().get_nodes_in_group("enemies"):
        enemy.find_target()
        enemy.set_physics_process(true)
    show_class_selection()
    $HUD/LevelUp/Title.text = "CLASS PLAYTEST — CHOOSE YOUR CLASS"
    show_message("Choose 1–4. F2 starts a fresh test with another class.")

func layout_choices(four: bool):
    $HUD/LevelUp/Choice4.visible = four
    for i in range(4):
        var label = get_node("HUD/LevelUp/Choice%d" % (i + 1))
        label.offset_top = 80 + i * (62 if four else 85)
        label.offset_bottom = label.offset_top + 60
    $HUD/LevelUp/Hint.text = "Press 1, 2, 3, or 4" if four else "Press 1, 2, or 3"

func show_message(text: String):
    $HUD/Message.text = text
    message_timer = 2.3
