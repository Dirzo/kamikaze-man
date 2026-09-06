extends CharacterBody2D

signal boss_defeated
signal defeated(souls: int)

@export var enemy_name := "Punk"
@export var max_hp := 55
@export var contact_damage := 10
@export var move_speed := 105.0
@export var aggro_range := 430.0
@export var xp_reward := 40
@export var gold_reward := 12
@export var respawn_delay := 2.5
@export var is_boss := false
@export var ranged := false
var shot_timer := 1.4

var hp := 55
var target = null
var start_position := Vector2.ZERO
var hit_timer := 0.0
var alive := true

const GRAVITY := 1500.0

func _ready():
    add_to_group("enemies")
    hp = max_hp
    start_position = global_position
    $Name.text = enemy_name
    update_healthbar()
    call_deferred("find_target")

func find_target():
    if not is_inside_tree():
        return
    target = get_tree().get_first_node_in_group("player")

func _physics_process(delta):
    if not alive:
        return

    hit_timer = max(hit_timer - delta, 0.0)

    if not is_on_floor():
        velocity.y += GRAVITY * delta

    if target == null:
        find_target()
        move_and_slide()
        return

    if target.input_locked:
        return
    shot_timer -= delta
    if ranged and global_position.distance_to(target.global_position) < 650.0:
        $Body.modulate = Color(1.5, 1.2, 0.5) if shot_timer < 0.6 else Color.WHITE
        if shot_timer <= 0:
            shoot()
            shot_timer = 2.4 if is_boss else 2.0

    var dx = target.global_position.x - global_position.x
    var distance = abs(dx)
    var horizontal_reach: float = 17.0 + 19.0 * absf(global_scale.x) + 6.0

    if distance < aggro_range:
        if distance > horizontal_reach:
            velocity.x = sign(dx) * move_speed
        else:
            velocity.x = 0.0
            var vertical_reach: float = 25.0 + 22.0 * absf(global_scale.y)
            if absf(target.global_position.y - global_position.y) < vertical_reach and hit_timer <= 0.0 and not target.input_locked and target.has_method("take_damage"):
                target.take_damage(contact_damage)
                hit_timer = 0.8
    else:
        velocity.x = move_toward(velocity.x, 0.0, 800.0 * delta)

    move_and_slide()

func shoot():
    for angle in ([-0.2, 0.0, 0.2] if is_boss else [0.0]):
        var shot = load("res://scripts/projectile.gd").new()
        shot.attacker = self
        shot.hostile = true
        shot.damage = contact_damage
        shot.remaining = 2.4
        shot.position = global_position
        shot.velocity = global_position.direction_to(target.global_position).rotated(angle) * 320
        get_parent().add_child(shot)

func take_damage(amount: int, attacker, is_crit := false):
    if not alive:
        return

    hp -= amount
    update_healthbar()
    if is_crit and attacker.has_signal("message_requested"):
        attacker.message_requested.emit("CRIT! %d" % amount)
    if hp <= 0:
        die(attacker)
        return
    $Body.modulate = Color(1.6, 1.6, 1.6)
    await get_tree().create_timer(0.05).timeout
    $Body.modulate = Color.WHITE

func die(attacker):
    if not alive:
        return
    alive = false
    visible = false
    $CollisionShape2D.set_deferred("disabled", true)
    velocity = Vector2.ZERO

    defeated.emit(5 if is_boss else 1)

    if attacker.has_method("gain_xp"):
        attacker.gain_xp(xp_reward)
    if attacker.has_method("add_gold"):
        attacker.add_gold(gold_reward)

    if is_boss and attacker.has_signal("message_requested"):
        attacker.message_requested.emit("BOSS DOWN — +%d gold" % gold_reward)

    if is_boss:
        boss_defeated.emit()

func respawn():
    hp = max_hp
    global_position = start_position
    visible = true
    alive = true
    hit_timer = 0.0
    shot_timer = 1.4
    $Body.modulate = Color.WHITE
    $CollisionShape2D.set_deferred("disabled", false)
    update_healthbar()

func update_healthbar():
    if has_node("HealthBar"):
        $HealthBar.max_value = max_hp
        $HealthBar.value = hp
