extends CharacterBody2D

signal stats_changed
signal level_up_requested
signal message_requested(text)

@export var move_speed := 290.0
@export var jump_velocity := -510.0
@export var attack_damage := 22
@export var max_hp := 100

var hp := 100
var level := 1
var xp := 0
var xp_to_next := 100
var gold := 0
var crit_chance := 0.08
var luck := 0.0

var facing := 1
var attack_cooldown := 0.32
var attack_timer := 0.0
var dash_cooldown := 0.9
var dash_cooldown_timer := 0.0
var dash_timer := 0.0
var dash_direction := 1
var dash_speed := 760.0
var input_locked := false
var dropping := false
var pending_upgrades := 0

const GRAVITY := 1500.0

func _ready():
    hp = max_hp
    stats_changed.emit()

func _physics_process(delta):
    if global_position.y > 1200.0:
        die()
        return
    attack_timer = max(attack_timer - delta, 0.0)
    dash_cooldown_timer = max(dash_cooldown_timer - delta, 0.0)
    dash_timer = max(dash_timer - delta, 0.0)

    if not is_on_floor():
        velocity.y += GRAVITY * delta

    if input_locked:
        velocity.x = move_toward(velocity.x, 0.0, move_speed * 8.0 * delta)
        move_and_slide()
        return

    var direction := 0.0
    if Input.is_key_pressed(KEY_LEFT):
        direction -= 1.0
    if Input.is_key_pressed(KEY_RIGHT):
        direction += 1.0

    if direction != 0.0:
        facing = int(sign(direction))
        $AttackArea.position.x = 46.0 * facing
        $Body.scale.x = facing

    if dash_timer > 0.0:
        velocity.x = dash_direction * dash_speed
        velocity.y = 0.0
    else:
        velocity.x = direction * move_speed

    if Input.is_key_pressed(KEY_CTRL) and attack_timer <= 0.0:
        attack()

    move_and_slide()

func _unhandled_input(event):
    if input_locked or not event is InputEventKey or not event.pressed or event.echo:
        return

    if event.keycode == KEY_SPACE:
        if Input.is_key_pressed(KEY_DOWN) and is_on_floor():
            drop_through_platform()
        elif is_on_floor():
            velocity.y = jump_velocity

    if event.keycode == KEY_SHIFT:
        start_dash()

func attack():
    attack_timer = attack_cooldown
    $AttackArea/AttackShape.set_deferred("disabled", false)
    await get_tree().physics_frame
    # The first signal fires before physics updates the newly enabled shape.
    await get_tree().physics_frame

    for body in $AttackArea.get_overlapping_bodies():
        if body.has_method("take_damage"):
            var damage := attack_damage
            var is_crit := randf() < crit_chance
            if is_crit:
                damage = int(round(damage * 1.8))
            body.take_damage(damage, self, is_crit)

    $AttackArea/AttackShape.set_deferred("disabled", true)

func start_dash():
    if dash_cooldown_timer > 0.0:
        return
    dash_direction = facing
    dash_timer = 0.13
    dash_cooldown_timer = dash_cooldown

func drop_through_platform():
    if dropping:
        return
    dropping = true
    set_collision_mask_value(4, false)
    position.y += 6.0
    await get_tree().create_timer(0.22).timeout
    set_collision_mask_value(4, true)
    dropping = false

func take_damage(amount: int):
    hp = max(hp - amount, 0)
    stats_changed.emit()

    if hp <= 0:
        die()

func die():
    var lost: int = mini(gold, int(ceil(gold * 0.25)))
    gold -= lost
    hp = max_hp
    global_position = Vector2(180, 520)
    velocity = Vector2.ZERO
    dash_timer = 0.0
    message_requested.emit("You wiped out. Lost %d gold." % lost)
    stats_changed.emit()

func gain_xp(amount: int):
    xp += amount
    var was_locked := input_locked

    while xp >= xp_to_next:
        xp -= xp_to_next
        level += 1
        xp_to_next = int(round(xp_to_next * 1.28))
        pending_upgrades += 1

    stats_changed.emit()

    if pending_upgrades > 0 and not was_locked:
        input_locked = true
        level_up_requested.emit()

func add_gold(amount: int):
    gold += amount
    stats_changed.emit()

func spend_gold(amount: int) -> bool:
    if gold < amount:
        return false
    gold -= amount
    stats_changed.emit()
    return true

func apply_upgrade(id: String):
    match id:
        "damage":
            attack_damage += 6
        "speed":
            move_speed += 25.0
        "health":
            max_hp += 20
            hp += 20
        "attack_speed":
            attack_cooldown = max(0.14, attack_cooldown - 0.035)
        "crit":
            crit_chance = min(0.65, crit_chance + 0.06)
        "dash":
            dash_cooldown = max(0.3, dash_cooldown - 0.12)
        "luck":
            luck += 0.08

    pending_upgrades = maxi(0, pending_upgrades - 1)
    input_locked = pending_upgrades > 0
    stats_changed.emit()
    if input_locked:
        level_up_requested.emit()

func gambling_reward(id: String):
    match id:
        "jackpot":
            add_gold(100)
        "damage":
            attack_damage += 4
        "crit":
            crit_chance = min(0.70, crit_chance + 0.04)
        "health":
            max_hp += 15
            hp += 15
        "speed":
            move_speed += 18.0
        "curse":
            max_hp = max(35, max_hp - 10)
            hp = min(hp, max_hp)
            attack_damage += 10
        "bust":
            pass
    stats_changed.emit()
