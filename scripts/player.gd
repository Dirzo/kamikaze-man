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
const Abilities = preload("res://scripts/abilities.gd")
var ability_index := 0
var ability_timer := 0.0
var guard_timer := 0.0
var hurt_timer := 0.0
var lifesteal := 0.05
var heal_fraction := 0.0
var skill_points := 0
var style_id := ""
var style_rank := 0
var style_index := -1
var art_phase := 0.0
var heal_popup := 0
var heal_popup_timer := 0.0
const SkillTree = preload("res://scripts/skill_tree.gd")
var class_selected := false
var sword_timer := 0.0
var dead := false
var kamikaze_bonus := 0
var blast_time := 0.0
const BLAST_RADIUS := 300.0

func _process(delta):
    art_phase += delta
    heal_popup_timer = maxf(0.0, heal_popup_timer - delta)
    if has_node("Body/Portrait") and not dead:
        var moving := absf(velocity.x) > 5
        var step := sin(art_phase * (12 if moving else 3))
        var sprite = $Body/Portrait
        sprite.position.y = -13 - absf(step) * (3 if moving else 0.6)
        sprite.rotation = step * 0.04 if moving else 0.0
        sprite.scale = Vector2(0.15 * (1 + step * 0.025), 0.15 * (1 - step * 0.025))
        if not is_on_floor() and not input_locked:
            sprite.scale = Vector2(0.14, 0.16)
            sprite.rotation = clampf(velocity.y / 3000, -0.12, 0.12)
        if attack_timer > attack_cooldown - 0.12:
            sprite.rotation -= 0.12
        if hurt_timer > 0.4:
            sprite.position.x = sin(hurt_timer * 90) * 3
        else:
            sprite.position.x = 0
    blast_time = maxf(0.0, blast_time - delta)
    queue_redraw()

func _draw():
    if guard_timer > 0 and not dead:
        draw_arc(Vector2(0, -10), 36, 0, TAU, 48, Color(0.7, 0.9, 1, 0.8), 3)
    if heal_popup_timer > 0:
        draw_string(ThemeDB.fallback_font, Vector2(-18, -65 - (1.0 - heal_popup_timer) * 12), "+%d HP" % heal_popup, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(0.25, 1, 0.45))
    if blast_time > 0.0:
        draw_circle(Vector2.ZERO, BLAST_RADIUS * (1.0 - blast_time / 0.6), Color(1, 0.45, 0.12, blast_time))

const GRAVITY := 1500.0

func _ready():
    z_index = 5
    var weapon = load("res://scripts/weapon.gd").new()
    weapon.name = "Weapon"
    $Body.add_child(weapon)
    load("res://scripts/game_art.gd").character($Body, 0, true)
    $Body/Face.hide()
    $Body/Sword.z_index = 1
    $Body/Weapon.z_index = 1
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
    if not input_locked:
        ability_timer = maxf(ability_timer - delta, 0.0)
    guard_timer = maxf(guard_timer - delta, 0.0)
    hurt_timer = maxf(hurt_timer - delta, 0.0)
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
    if event.keycode == KEY_E:
        use_ability()

func ability_data() -> Dictionary:
    return Abilities.OPTIONS[combat_class][ability_index]

func equip_ability(index: int) -> bool:
    if not class_selected or dead or index < 0 or index > 2:
        return false
    ability_index = index
    # Keep the remaining cooldown so swapping cannot bypass a recovery ability's limit.
    stats_changed.emit()
    return true

func use_ability() -> bool:
    if dead or input_locked or not class_selected or ability_timer > 0:
        return false
    var data := ability_data()
    ability_timer = data.cooldown
    Abilities.cast(self, data.id)
    message_requested.emit(data.name)
    stats_changed.emit()
    return true

func restore_health(amount: int):
    if dead or amount <= 0:
        return
    var restored := mini(amount, max_hp - hp)
    hp += restored
    if restored > 0:
        heal_popup = restored
        heal_popup_timer = 1.0
    stats_changed.emit()

func attack():
    if input_locked or attack_timer > 0.0:
        return
    attack_timer = attack_cooldown
    if style_id in ["cyclone", "gunslinger"]:
        attack_timer *= 0.75 if style_id == "cyclone" else 0.8
    if style_id in ["sniper", "marksman"]:
        attack_timer *= 1.5 if style_id == "sniper" else 1.3
    if combat_class != "fighter":
        if style_id == "ranger":
            for angle in [-0.12, 0.0, 0.12]:
                fire_projectile(combat_class, 0.65, angle)
        else:
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
            apply_hit_effects(body)

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
    skill_points += 3
    combat_class = id
    $Body/Sword.visible = id == "fighter"
    $Body/Weapon.kind = id
    $Body/Weapon.queue_redraw()
    $Body/Portrait.frame = ["fighter", "mage", "shooter", "bowman"].find(id)
    stats_changed.emit()
    return true

func fire_projectile(kind: String, multiplier := 1.0, angle := 0.0, empowered := false):
    var shot = load("res://scripts/projectile.gd").new()
    shot.attacker = self
    shot.damage = int(attack_damage * multiplier)
    shot.position = global_position + Vector2(28 * facing, -4)
    var speed := 850.0
    if style_id == "sniper":
        shot.damage = int(shot.damage * 1.8)
        shot.pierce = 2 if style_rank >= 2 else 1
        speed = 1100
    if style_id == "marksman":
        shot.damage = int(shot.damage * 1.5)
    match kind:
        "mage":
            shot.kind = "orb"
            shot.explosion_radius = 90.0
            if style_id == "cryomancer":
                shot.explosion_radius = 140.0
            speed = 460.0
        "bowman":
            shot.kind = "arrow"
            shot.pierce = 6 if empowered else 3
            if style_id == "ranger" and style_rank >= 3 and not empowered:
                shot.pierce = 4
            shot.remaining = 1.4
            speed = 750.0
        _:
            shot.kind = "bullet"
            if style_id == "demolitioner":
                shot.explosion_radius = 90.0 if style_rank >= 2 else 60.0
                shot.kind = "orb"
    shot.velocity = Vector2(facing, 0).rotated(angle) * speed
    get_parent().add_child(shot)
    return shot

func use_skill():
    if dead or input_locked or skill_timer > 0:
        return
    skill_timer = skill_cooldown
    if style_rank >= 2 and style_id in ["cyclone", "gunslinger", "siphon", "marksman"]:
        skill_timer *= 0.65 if style_id in ["cyclone", "gunslinger"] else (0.7 if style_id == "marksman" else 0.75)
    if style_id == "cryomancer" and style_rank >= 3:
        skill_timer *= 0.6
    if not style_id.is_empty():
        use_style_skill()
        return
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

func invest_style(index: int) -> bool:
    if not class_selected or index < 0 or index > 2 or skill_points < style_rank + 1 or style_rank >= 3:
        return false
    if style_index >= 0 and style_index != index:
        return false
    var data = SkillTree.STYLES[combat_class][index]
    style_index = index
    style_id = data.id
    style_rank += 1
    skill_points -= style_rank
    skill_name = data.skill
    stats_changed.emit()
    return true

func lifesteal_rate() -> float:
    var bonus := 0.0
    if style_id == "bloodblade":
        bonus = 0.10 if style_rank == 1 else 0.15
    elif style_id == "siphon":
        bonus = 0.15 if style_rank < 3 else 0.25
    elif style_id == "thorn":
        bonus = 0.10 if style_rank == 1 else 0.20
    return minf(0.5, lifesteal + bonus)

func on_damage_dealt(actual_damage: int):
    if dead or actual_damage <= 0 or hp >= max_hp:
        return
    heal_fraction += actual_damage * lifesteal_rate()
    var amount := int(heal_fraction)
    heal_fraction -= amount
    var healed := mini(amount, max_hp - hp)
    hp += healed
    if healed > 0:
        heal_popup = healed
        heal_popup_timer = 1.0
    if hp == max_hp:
        heal_fraction = 0.0
    stats_changed.emit()

func apply_hit_effects(enemy):
    if not enemy.alive:
        return
    if style_id == "pyromancer":
        enemy.apply_burn(maxi(1, int(attack_damage * (0.5 if style_rank >= 2 else 0.25))), self)
    if style_id in ["cryomancer", "thorn"]:
        enemy.apply_slow(0.5 if style_id == "cryomancer" else 0.6, 2.5)

func use_style_skill():
    if combat_class == "shooter":
        if style_id == "sniper":
            var shot = fire_projectile("shooter", (6.0 if style_rank >= 3 else 4.0) / 1.8)
            shot.pierce = 8
        else:
            var angles = [-0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3] if style_id == "gunslinger" else [-0.15, 0.0, 0.15]
            for angle in angles:
                var multiplier := (2.2 if style_rank >= 3 else 1.6) if style_id == "gunslinger" else (3.0 if style_rank >= 3 else 2.0)
                fire_projectile("shooter", multiplier, angle)
        return
    if combat_class == "bowman":
        var angles = [0.0]
        if style_id == "ranger":
            angles = [-0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3] if style_rank >= 2 else [-0.2, -0.1, 0.0, 0.1, 0.2]
        elif style_id == "thorn" and style_rank >= 3:
            angles = [-0.12, 0.0, 0.12]
        for angle in angles:
            fire_projectile("bowman", 4.0 if style_id == "marksman" and style_rank >= 3 else 3.0, angle, true)
        return
    var radius := 140.0
    var multiplier := 2.0
    match style_id:
        "bloodblade":
            multiplier = 4.0 if style_rank >= 3 else 3.0
        "guardian":
            guard_timer = 3.0 if style_rank >= 3 else 2.0
            radius = 200.0 if style_rank >= 3 else 140.0
        "cyclone":
            radius = 200.0
            multiplier = 3.5 if style_rank >= 3 else 2.0
        "pyromancer":
            radius = 300.0 if style_rank >= 3 else 220.0
            multiplier = 4.0 if style_rank >= 3 else 2.5
        "cryomancer":
            radius = 260.0
            multiplier = 2.5
        "siphon":
            radius = 280.0 if style_rank >= 3 else 220.0
            multiplier = 3.0
    var effect = load("res://scripts/combat_effect.gd").new()
    effect.position = global_position
    effect.radius = radius
    effect.tint = Color(0.95, 0.3, 0.4) if style_id in ["bloodblade", "siphon"] else Color(0.4, 0.8, 1)
    get_parent().add_child(effect)
    for enemy in get_tree().get_nodes_in_group("enemies"):
        if enemy.alive and global_position.distance_to(enemy.global_position) <= radius:
            enemy.take_damage(int(attack_damage * multiplier), self)
            apply_hit_effects(enemy)
            if style_rank >= 2 and style_id in ["guardian", "cryomancer"]:
                enemy.apply_slow(0.3 if style_id == "guardian" else 0.15, 3.0)

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
    if dead or input_locked or guard_timer > 0.0 or hurt_timer > 0.0:
        return
    hurt_timer = 0.6
    if style_id == "guardian":
        amount = maxi(1, int(ceil(amount * 0.75)))
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
        skill_points += 1
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
        "lifesteal":
            lifesteal = minf(0.35, lifesteal + 0.03)

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
