extends Node2D

var attacker
var velocity := Vector2.ZERO
var damage := 10
var kind := "bullet"
var pierce := 1
var explosion_radius := 0.0
var remaining := 1.2
var hostile := false
var hit_ids: Array[int] = []

func _ready():
    add_to_group("projectiles")
    rotation = velocity.angle()
    queue_redraw()

func _draw():
    match kind:
        "orb":
            draw_circle(Vector2.ZERO, 10, Color(0.65, 0.35, 1))
            draw_circle(Vector2(-2, -2), 4, Color(1, 0.85, 1))
        "arrow":
            draw_line(Vector2(-20, 0), Vector2(10, 0), Color(0.7, 0.95, 0.5), 3)
            draw_colored_polygon(PackedVector2Array([Vector2(16, 0), Vector2(6, -5), Vector2(6, 5)]), Color.WHITE)
        _:
            draw_line(Vector2(-12, 0), Vector2(6, 0), Color(1, 0.35, 0.2) if hostile else Color(1, 0.9, 0.3), 4)

func _physics_process(delta):
    if not is_instance_valid(attacker) or (not hostile and attacker.dead):
        queue_free()
        return
    var player = get_tree().get_first_node_in_group("player")
    if player != null and player.input_locked:
        return
    remaining -= delta
    if remaining <= 0:
        queue_free()
        return
    var end: Vector2 = global_position + velocity * delta
    var query := PhysicsRayQueryParameters2D.create(global_position, end, 1)
    var wall := get_world_2d().direct_space_state.intersect_ray(query)
    if not wall.is_empty():
        end = wall.position
    var targets: Array = [player] if hostile else get_tree().get_nodes_in_group("enemies")
    targets.sort_custom(func(a, b): return global_position.distance_squared_to(a.global_position) < global_position.distance_squared_to(b.global_position))
    for target in targets:
        if not is_instance_valid(target) or hit_ids.has(target.get_instance_id()):
            continue
        if (hostile and target.dead) or (not hostile and not target.alive):
            continue
        var closest := Geometry2D.get_closest_point_to_segment(target.global_position, global_position, end)
        if closest.distance_to(target.global_position) > 24.0 * absf(target.global_scale.x) + 4.0:
            continue
        hit_ids.append(target.get_instance_id())
        if hostile:
            target.take_damage(damage)
        elif explosion_radius > 0:
            var critical: bool = randf() < attacker.crit_chance
            for enemy in get_tree().get_nodes_in_group("enemies"):
                if enemy.alive and closest.distance_to(enemy.global_position) <= explosion_radius:
                    enemy.take_damage(int(damage * 1.8) if critical else damage, attacker, critical)
                    attacker.apply_hit_effects(enemy)
            var effect = load("res://scripts/combat_effect.gd").new()
            effect.position = closest
            effect.radius = explosion_radius
            effect.tint = Color(0.7, 0.3, 1)
            get_parent().add_child(effect)
        else:
            var critical: bool = randf() < attacker.crit_chance
            target.take_damage(int(damage * 1.8) if critical else damage, attacker, critical)
            attacker.apply_hit_effects(target)
        pierce -= 1
        if pierce <= 0:
            queue_free()
            return
    global_position = end
    if not wall.is_empty():
        queue_free()
