extends RefCounted

# E abilities are independent of the permanent fighting-style choice for this run.
const OPTIONS = {
    "fighter": [
        {"id":"wave", "name":"Crescent Wave", "cooldown":6.0, "desc":"Send a sword wave through up to 6 enemies. Deals 250% weapon damage.", "role":"REACH / DAMAGE"},
        {"id":"rally", "name":"Second Wind", "cooldown":15.0, "desc":"Restore 20% of maximum HP and block damage for 1 second.", "role":"RECOVERY / GUARD"},
        {"id":"reap", "name":"Blood Harvest", "cooldown":10.0, "desc":"Strike nearby enemies for 200% damage. Heal for 40% of actual damage dealt, plus your lifesteal.", "role":"CLOSE RANGE / DRAIN"}
    ],
    "mage": [
        {"id":"comet", "name":"Starfall", "cooldown":8.0, "desc":"Blast the nearest enemy for 350% damage in a wide area. Casts forward if no enemy is in range.", "role":"TARGETED BURST"},
        {"id":"frost", "name":"Winter Bloom", "cooldown":10.0, "desc":"Deal 150% damage around you and slow enemies by 85% for 4 seconds.", "role":"CROWD CONTROL"},
        {"id":"ward", "name":"Moonlit Ward", "cooldown":14.0, "desc":"A magical shield blocks all damage for 2.5 seconds. Restore 10% of maximum HP.", "role":"SURVIVAL"}
    ],
    "shooter": [
        {"id":"grenade", "name":"Firecracker", "cooldown":7.0, "desc":"Fire an explosive round: 400% damage in a 180-pixel blast on enemy impact.", "role":"AREA BURST"},
        {"id":"flash", "name":"Flash Powder", "cooldown":9.0, "desc":"Deal 100% damage nearby and slow enemies by 90% for 3 seconds.", "role":"ESCAPE / CONTROL"},
        {"id":"retreat", "name":"Parting Shots", "cooldown":8.0, "desc":"Dash backward with 0.7 seconds of guard while firing three 150%-damage bullets forward.", "role":"EVASION / DAMAGE"}
    ],
    "bowman": [
        {"id":"volley", "name":"Starling Volley", "cooldown":7.0, "desc":"Fire five piercing arrows in a fan. Each deals 120% damage and hits up to 3 enemies.", "role":"MULTI TARGET"},
        {"id":"bramble", "name":"Bramble Snare", "cooldown":10.0, "desc":"Roots erupt in front of you: 200% damage in a 220-pixel area and 90% slow for 4 seconds.", "role":"RANGED CONTROL"},
        {"id":"mend", "name":"Forest Renewal", "cooldown":16.0, "desc":"Restore 25% of maximum HP. Gain 0.5 seconds of guard to make room for your next shot.", "role":"RECOVERY"}
    ]
}

static func cast(p, id: String):
    match id:
        "wave":
            shot(p, "arrow", 2.5, 0, 6, 0, 720)
        "rally":
            p.restore_health(ceili(p.max_hp * 0.2))
            p.guard_timer = maxf(p.guard_timer, 1.0)
            pulse(p, p.global_position, 95, Color("#ffe8a0"))
        "reap":
            area(p, p.global_position, 175, 2.0, Color("#f77995"), 1.0, 0.0, 0.4)
        "comet":
            var center: Vector2 = p.global_position + Vector2(p.facing * 260, 0)
            var nearest := 600.0
            for enemy in p.get_tree().get_nodes_in_group("enemies"):
                var distance: float = p.global_position.distance_to(enemy.global_position)
                if enemy.alive and distance < nearest:
                    nearest = distance
                    center = enemy.global_position
            area(p, center, 160, 3.5, Color("#ffe6a3"))
        "frost":
            area(p, p.global_position, 260, 1.5, Color("#a7eaff"), 0.15, 4.0)
        "ward":
            p.guard_timer = maxf(p.guard_timer, 2.5)
            p.restore_health(ceili(p.max_hp * 0.1))
            pulse(p, p.global_position, 90, Color("#c6bdff"))
        "grenade":
            shot(p, "orb", 4.0, 0, 1, 180, 560)
        "flash":
            area(p, p.global_position, 220, 1.0, Color("#fff6cc"), 0.1, 3.0)
        "retreat":
            p.dash_direction = -p.facing
            p.dash_timer = 0.2
            p.guard_timer = maxf(p.guard_timer, 0.7)
            for angle in [-0.12, 0.0, 0.12]:
                shot(p, "bullet", 1.5, angle, 1, 0, 950)
        "volley":
            for angle in [-0.24, -0.12, 0.0, 0.12, 0.24]:
                shot(p, "arrow", 1.2, angle, 3, 0, 750)
        "bramble":
            area(p, p.global_position + Vector2(p.facing * 180, 0), 220, 2.0, Color("#b5ed85"), 0.1, 4.0)
        "mend":
            p.restore_health(ceili(p.max_hp * 0.25))
            p.guard_timer = maxf(p.guard_timer, 0.5)
            pulse(p, p.global_position, 110, Color("#a3f3b2"))

static func pulse(p, center: Vector2, radius: float, tint: Color):
    var effect = preload("res://scripts/combat_effect.gd").new()
    effect.position = center
    effect.radius = radius
    effect.tint = tint
    p.get_parent().add_child(effect)

static func area(p, center: Vector2, radius: float, multiplier: float, tint: Color, slow := 1.0, duration := 0.0, drain := 0.0):
    pulse(p, center, radius, tint)
    var actual := 0
    for enemy in p.get_tree().get_nodes_in_group("enemies"):
        if enemy.alive and center.distance_to(enemy.global_position) <= radius:
            var amount := int(p.attack_damage * multiplier)
            actual += mini(enemy.hp, amount)
            enemy.take_damage(amount, p)
            p.apply_hit_effects(enemy)
            if enemy.alive and duration > 0:
                enemy.apply_slow(slow, duration)
    if drain > 0:
        p.restore_health(int(actual * drain))

static func shot(p, kind: String, multiplier: float, angle: float, pierce: int, splash: float, speed: float):
    # Explicit base damage keeps the displayed value independent of primary-fire style modifiers.
    var projectile = preload("res://scripts/projectile.gd").new()
    projectile.attacker = p
    projectile.position = p.global_position + Vector2(p.facing * 28, -4)
    projectile.kind = kind
    projectile.damage = int(p.attack_damage * multiplier)
    projectile.velocity = Vector2(p.facing, 0).rotated(angle) * speed
    projectile.pierce = pierce
    projectile.explosion_radius = splash
    projectile.remaining = 1.5
    p.get_parent().add_child(projectile)
