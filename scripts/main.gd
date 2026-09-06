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

func _ready():
    randomize()
    $Player.add_to_group("player")
    $Player.stats_changed.connect(update_hud)
    $Player.level_up_requested.connect(show_level_up)
    $Player.message_requested.connect(show_message)
    $SlotMachine.result.connect(show_message)
    update_hud()
    show_message("Arrow keys move | Space jump | Ctrl attack | Shift dash | Z interact")

func _process(delta):
    if message_timer > 0.0:
        message_timer -= delta
        if message_timer <= 0.0:
            $HUD/Message.text = ""

func _unhandled_input(event):
    if not $HUD/LevelUp.visible:
        return
    if event is InputEventKey and event.pressed and not event.echo:
        if event.keycode == KEY_1:
            choose_upgrade(0)
        elif event.keycode == KEY_2:
            choose_upgrade(1)
        elif event.keycode == KEY_3:
            choose_upgrade(2)

func update_hud():
    var p = $Player
    $HUD/Stats.text = "HP %d/%d   LV %d   XP %d/%d   GOLD %d" % [
        p.hp, p.max_hp, p.level, p.xp, p.xp_to_next, p.gold
    ]
    $HUD/Build.text = "DMG %d   CRIT %d%%   SPEED %d" % [
        p.attack_damage, int(round(p.crit_chance * 100.0)), int(p.move_speed)
    ]

func show_level_up():
    current_choices = upgrade_pool.duplicate(true)
    current_choices.shuffle()
    current_choices = current_choices.slice(0, 3)

    $HUD/LevelUp.visible = true
    $HUD/LevelUp/Title.text = "LEVEL UP — PICK YOUR POISON"
    $HUD/LevelUp/Choice1.text = "1  %s\n%s" % [current_choices[0].name, current_choices[0].desc]
    $HUD/LevelUp/Choice2.text = "2  %s\n%s" % [current_choices[1].name, current_choices[1].desc]
    $HUD/LevelUp/Choice3.text = "3  %s\n%s" % [current_choices[2].name, current_choices[2].desc]

func choose_upgrade(index: int):
    if index < 0 or index >= current_choices.size():
        return
    var choice = current_choices[index]
    $HUD/LevelUp.visible = false
    $Player.apply_upgrade(choice.id)
    show_message("%s acquired." % choice.name)

func show_message(text: String):
    $HUD/Message.text = text
    message_timer = 2.3
