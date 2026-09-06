extends CharacterBody2D

signal stats_changed
signal level_up_requested
signal message_requested(text)
signal died

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
var class_name_display := "Recruit"
var combat_class := "fighter"
var skill_timer := 0.0
var skill_cooldown := 5.0
var skill_name := "Whirlwind"
var guard_timer := 0.0
var class_selected := false
var sword_timer := 0.0
var dead := false
var kamikaze_bonus := 0
var blast_time := 0.0
const BLAST_RADIUS := 300.0

func _process(delta):
    blast_time = maxf(0.0, blast_time - delta)
    queue_redraw()

func _draw():
    if blast_time > 0.0:
        draw_circle(Vector2.ZERO, BLAST_RADIUS * (1.0 - blast_time / 0.6), Color(1, 0.45, 0.12, blast_time))

const GRAVITY := 1500.0

func _ready():
    var weapon = load("res://scripts/weapon.gd").new()
    weapon.name = "Weapon"
    $Body.add_child(weapon)
    hp = max_hp
    stats_changed.emit()

func _physics_process(delta):
    if dead:
        return
    if global_position.y > 1200.0:
        die()
        return
    attack_timer = max(attack_timer - delta, 0.0)
    dash_cooldown_timer = max(dash_cooldown_timer - delta, 0.0)
    dash_timer = max(dash_timer - delta, 0.0)
    sword_timer = maxf(sword_timer - delta, 0.0)
    skill_timer = maxf(skill_timer - delta, 0.0)
    guard_timer = maxf(guard_timer - delta, 0.0)
    $Body/Sword.rotation = lerpf(-0.65, 0.55, 1.0 - sword_timer / 0.16) if sword_timer > 0.0 else -0.65
    $Body/Slash.visible = sword_timer > 0.0

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
        $AttackArea.position.x = 55.0 * facing
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

    if event.keycode == KEY_ALT:
        if Input.is_key_pressed(KEY_DOWN) and is_on_floor():
            drop_through_platform()
        elif is_on_floor():
            velocity.y = jump_velocity

    if event.keycode == KEY_SHIFT:
        start_dash()
    if event.keycode == KEY_K:
        kamikaze()
    if event.keycode == KEY_Q:
        use_skill()

func attack():
    if input_locked or attack_timer > 0.0:
        return
    attack_timer = attack_cooldown
    if combat_class != "fighter":
        fire_projectile(combat_class)
        return
    sword_timer = 0.16
    $Body/Slash.visible = true
    $AttackArea/AttackShape.set_deferred("disabled", false)
    await get_tree().physics_frame
    # The first signal fires before physics updates the newly enabled shape.
    await get_tree().physics_frame

    if dead:
        $AttackArea/AttackShape.set_deferred("disabled", true)
        return
    for body in $AttackArea.get_overlapping_bodies():
        if body.has_method("take_damage"):
            var damage := attack_damage
            var is_crit := randf() < crit_chance
            if is_crit:
                damage = int(round(damage * 1.8))
            body.take_damage(damage, self, is_crit)

    $AttackArea/AttackShape.set_deferred("disabled", true)

func select_class(id: String) -> bool:
    if class_selected:
        return false
    match id:
        "fighter":
            class_name_display = "Fighter"
            max_hp += 50
            hp += 50
            attack_damage += 6
            $Body.color = Color(0.35, 0.65, 1.0)
        "mage":
            class_name_display = "Mage"
            attack_damage += 14
            attack_cooldown += 0.30
            max_hp = maxi(35, max_hp - 15)
            hp = mini(hp, max_hp)
            skill_name = "Arcane Nova"
            skill_cooldown = 6.0
            $Body.color = Color(0.7, 0.35, 1.0)
        "shooter":
            class_name_display = "Shooter"
            attack_damage = maxi(5, attack_damage - 8)
            attack_cooldown = maxf(0.10, attack_cooldown - 0.16)
            move_speed += 30.0
            skill_name = "Scattershot"
            skill_cooldown = 3.0
            $Body.color = Color(1.0, 0.75, 0.3)
        "bowman":
            class_name_display = "Bowman"
            attack_damage += 6
            attack_cooldown += 0.14
            move_speed += 35.0
            crit_chance = minf(0.70, crit_chance + 0.10)
            skill_name = "Power Arrow"
            skill_cooldown = 4.0
            $Body.color = Color(0.45, 1.0, 0.65)
        _:
            return false
    class_selected = true
    combat_class = id
    $Body/Sword.visible = id == "fighter"
    $Body/Weapon.kind = id
    $Body/Weapon.queue_redraw()
    stats_changed.emit()
    return true

func fire_projectile(kind: String, multiplier := 1.0, angle := 0.0, empowered := false):
    var shot = load("res://scripts/projectile.gd").new()
    shot.attacker = self
    shot.damage = int(attack_damage * multiplier)
    shot.position = global_position + Vector2(28 * facing, -4)
    var speed := 850.0
    match kind:
        "mage":
            shot.kind = "orb"
            shot.explosion_radius = 90.0
            speed = 460.0
        "bowman":
            shot.kind = "arrow"
            shot.pierce = 6 if empowered else 3
            shot.remaining = 1.4
            speed = 750.0
        _:
            shot.kind = "bullet"
    shot.velocity = Vector2(facing, 0).rotated(angle) * speed
    get_parent().add_child(shot)

func use_skill():
    if dead or input_locked or skill_timer > 0:
        return
    skill_timer = skill_cooldown
    match combat_class:
        "shooter":
            for angle in [-0.22, -0.11, 0.0, 0.11, 0.22]:
                fire_projectile("shooter", 1.6, angle)
        "bowman":
            fire_projectile("bowman", 3.0, 0.0, true)
        _:
            var radius := 220.0 if combat_class == "mage" else 140.0
            var multiplier := 2.5 if combat_class == "mage" else 2.0
            var effect = load("res://scripts/combat_effect.gd").new()
            effect.position = global_position
            effect.radius = radius
            effect.tint = Color(0.7, 0.3, 1) if combat_class == "mage" else Color(0.5, 0.8, 1)
            get_parent().add_child(effect)
            if combat_class == "fighter":
                guard_timer = 0.5
            for enemy in get_tree().get_nodes_in_group("enemies"):
                if enemy.alive and global_position.distance_to(enemy.global_position) <= radius:
                    enemy.take_damage(int(attack_damage * multiplier), self)

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
    if dead or input_locked or guard_timer > 0.0:
        return
    hp = max(hp - amount, 0)
    stats_changed.emit()

    if hp <= 0:
        die()

func die():
    if dead:
        return
    dead = true
    finish_death()

func finish_death():
    hp = 0
    input_locked = true
    velocity = Vector2.ZERO
    dash_timer = 0.0
    $Body/Slash.visible = false
    $AttackArea/AttackShape.set_deferred("disabled", true)
    stats_changed.emit()
    died.emit()

func kamikaze():
    if dead or input_locked:
        return
    # Mark death first so a blast boss kill cannot advance the map.
    dead = true
    input_locked = true
    blast_time = 0.6
    var damage: int = 150 + attack_damage * 5 + kamikaze_bonus
    for enemy in get_tree().get_nodes_in_group("enemies"):
        if enemy.alive and global_position.distance_to(enemy.global_position) <= BLAST_RADIUS:
            enemy.take_damage(damage, self)
    finish_death()

func gain_xp(amount: int):
    if dead:
        return
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
