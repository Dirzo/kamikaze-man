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
var slow_timer := 0.0
var slow_factor := 1.0
var burn_timer := 0.0
var burn_tick := 0.0
var burn_damage := 0
var burn_source

var hp := 55
var target = null
var start_position := Vector2.ZERO
var hit_timer := 0.0
var alive := true
var patrol_direction := 1
var patrol_pause := 0.0
var anim_phase := 0.0
var attack_anim := 0.0
var hurt_anim := 0.0
var look_direction := 1

func _process(delta):
    if not alive or (is_instance_valid(target) and target.input_locked):
        return
    anim_phase += delta
    attack_anim = maxf(0, attack_anim - delta)
    hurt_anim = maxf(0, hurt_anim - delta)
    var moving := absf(velocity.x) > 5
    if moving:
        look_direction = 1 if velocity.x > 0 else -1
    var step := sin(anim_phase * (10 if moving else 2.5))
    var sprite = $Body/Portrait
    sprite.flip_h = look_direction < 0
    sprite.position = Vector2(look_direction * sin(attack_anim / 0.3 * PI) * 10, -12 - absf(step) * (4 if moving else 1.0))
    sprite.rotation = step * 0.07 if moving else step * 0.018
    sprite.scale = Vector2(0.14 * (1.0 + step * 0.035), 0.14 * (1.0 - step * 0.035))
    if attack_anim > 0:
        sprite.rotation += look_direction * sin(attack_anim / 0.3 * PI) * 0.2
    if hurt_anim > 0:
        sprite.position.x += sin(hurt_anim * 90) * 4
    $Body.modulate = Color(1.8, 1.45, 1.45) if hurt_anim > 0 else (Color(1.5, 1.2, 0.5) if ranged and shot_timer < 0.6 else Color.WHITE)

const GRAVITY := 1500.0

func _ready():
    add_to_group("enemies")
    load("res://scripts/game_art.gd").character($Body, 7 if is_boss else (6 if ranged else 4 + get_index() % 2))
    $Name.add_theme_color_override("font_outline_color", Color("#193a30"))
    $Name.add_theme_constant_override("outline_size", 5)
    $Name.position.y -= 18
    $HealthBar.position.y -= 12
    hp = max_hp
    start_position = global_position
    patrol_direction = 1 if get_index() % 2 == 0 else -1
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

    if not is_instance_valid(target):
        find_target()
        move_and_slide()
        return

    if target.input_locked:
        return
    slow_timer = maxf(0.0, slow_timer - delta)
    if slow_timer <= 0:
        slow_factor = 1.0
    if burn_timer > 0:
        burn_timer -= delta
        burn_tick -= delta
        if burn_tick <= 0 and is_instance_valid(burn_source) and not burn_source.dead:
            burn_tick = 1.0
            take_damage(burn_damage, burn_source)
            if not alive:
                return
    shot_timer -= delta
    if ranged and global_position.distance_to(target.global_position) < 650.0:
        if shot_timer <= 0:
            shoot()
            shot_timer = 2.4 if is_boss else 2.0

    var dx = target.global_position.x - global_position.x
    var distance = abs(dx)
    var horizontal_reach: float = 17.0 + 19.0 * absf(global_scale.x) + 6.0

    if distance < aggro_range:
        look_direction = 1 if dx >= 0 else -1
        if distance > horizontal_reach:
            velocity.x = sign(dx) * move_speed * slow_factor
        else:
            velocity.x = 0.0
            var vertical_reach: float = 25.0 + 22.0 * absf(global_scale.y)
            if absf(target.global_position.y - global_position.y) < vertical_reach and hit_timer <= 0.0 and not target.input_locked and target.has_method("take_damage"):
                target.take_damage(contact_damage)
                hit_timer = 0.8
                attack_anim = 0.3
    else:
        patrol(delta)

    # Ground probes keep patrols and chases from walking off raised platforms.
    if is_on_floor() and absf(velocity.x) > 0 and not floor_ahead(signf(velocity.x)):
        velocity.x = 0
        patrol_direction *= -1
        patrol_pause = 0.35

    move_and_slide()

func floor_ahead(direction: float) -> bool:
    var from := global_position + Vector2(direction * (24 * absf(global_scale.x) + 10), 0)
    var to := from + Vector2(0, 36 * absf(global_scale.y) + 28)
    var query := PhysicsRayQueryParameters2D.create(from, to, 9)
    query.exclude = [get_rid()]
    return not get_world_2d().direct_space_state.intersect_ray(query).is_empty()

func patrol(delta: float):
    patrol_pause = maxf(0, patrol_pause - delta)
    if patrol_pause > 0:
        velocity.x = 0
        return
    var offset: float = global_position.x - start_position.x
    if (offset > 130 and patrol_direction > 0) or (offset < -130 and patrol_direction < 0) or is_on_wall():
        patrol_direction *= -1
        patrol_pause = 0.45
        velocity.x = 0
        return
    velocity.x = patrol_direction * move_speed * 0.45 * slow_factor

func shoot():
    attack_anim = 0.3
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

    var actual_damage := mini(hp, maxi(0, amount))
    hp -= actual_damage
    if is_instance_valid(attacker) and attacker.has_method("on_damage_dealt"):
        attacker.on_damage_dealt(actual_damage)
    update_healthbar()
    if is_crit and attacker.has_signal("message_requested"):
        attacker.message_requested.emit("CRIT! %d" % amount)
    if hp <= 0:
        die(attacker)
        return
    hurt_anim = 0.18

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
    attack_anim = 0.0
    hurt_anim = 0.0
    patrol_pause = 0.0
    velocity = Vector2.ZERO
    slow_timer = 0.0
    slow_factor = 1.0
    burn_timer = 0.0
    burn_tick = 0.0
    burn_source = null
    hp = max_hp
    global_position = start_position
    visible = true
    alive = true
    hit_timer = 0.0
    shot_timer = 1.4
    $Body.modulate = Color.WHITE
    $CollisionShape2D.set_deferred("disabled", false)
    update_healthbar()

func apply_slow(factor: float, duration: float):
    if not alive:
        return
    slow_factor = minf(slow_factor, factor)
    slow_timer = maxf(slow_timer, duration)

func apply_burn(amount: int, source):
    if not alive:
        return
    burn_damage = amount
    burn_source = source
    if burn_timer <= 0:
        burn_tick = 1.0
    burn_timer = 3.0

func update_healthbar():
    if has_node("HealthBar"):
        $HealthBar.max_value = max_hp
        $HealthBar.value = hp
