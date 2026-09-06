extends Node2D

signal result(text)

@export var spin_cost := 25
@export_range(0.0, 1.0) var break_chance: float = 0.30
var broken := false
var player_in_range := false
var player = null
var spinning := false

func _ready():
    $Prompt.visible = false

func _physics_process(_delta):
    if player == null:
        player = get_tree().get_first_node_in_group("player")
        return

    player_in_range = global_position.distance_to(player.global_position) < 115.0
    $Prompt.visible = player_in_range

func _unhandled_input(event):
    if spinning or broken or not player_in_range or player.input_locked:
        return
    if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_Z:
        spin()

func spin():
    if spinning or broken or player == null or player.input_locked:
        return
    spinning = true

    if not player.spend_gold(spin_cost):
        result.emit("Slot Machine: need %d gold." % spin_cost)
        spinning = false
        return

    $Prompt.text = "SPINNING..."
    await get_tree().create_timer(0.35).timeout
    if player.dead:
        spinning = false
        return

    var roll: float = randf() + player.luck
    var reward := "bust"
    var text := "BUST — the machine ate your money."

    if roll >= 1.00:
        reward = "jackpot"
        text = "JACKPOT! +100 gold"
    elif roll >= 0.82:
        reward = "curse"
        text = "KAMIKAZE BET: +10 damage, -10 max HP"
    elif roll >= 0.66:
        reward = "crit"
        text = "Loaded Dice: +4% crit chance"
    elif roll >= 0.50:
        reward = "damage"
        text = "Hot Powder: +4 attack damage"
    elif roll >= 0.34:
        reward = "health"
        text = "Body Armor: +15 max HP"
    elif roll >= 0.20:
        reward = "speed"
        text = "Adrenaline: +18 move speed"

    player.gambling_reward(reward)
    if randf() < break_chance:
        broken = true
        $Body.color = Color(0.3, 0.28, 0.25)
        $Screen.color = Color(0.025, 0.025, 0.025)
        get_node("777").text = "X X X"
        text += "  MACHINE BROKE! Defeat the boss for a fresh map."
    result.emit(text)

    $Prompt.text = "BROKEN — OUT OF SERVICE" if broken else "Z — SPIN (%d GOLD)" % spin_cost
    await get_tree().create_timer(0.25).timeout
    spinning = false
