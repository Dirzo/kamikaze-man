extends CharacterBody2D
var kind := "gold"
var amount := 1
var collected := false
var age := 0.0
const INFO = {
    "gold": ["Gold", Color("#ffda61")],
    "tonic": ["Forest Tonic: +30 HP", Color("#70e4ac")],
    "fang": ["Sharp Fang: +3 damage", Color("#ffe7c4")],
    "heart": ["Heartstone: +8 max HP", Color("#ef91b6")],
    "ruby": ["Vampire Ruby: +1% lifesteal", Color("#fa677e")]
}
func _ready():
    add_to_group("loot")
    collision_layer = 0
    collision_mask = 9
    z_index = 7
    var collider := CollisionShape2D.new()
    var shape := CircleShape2D.new()
    shape.radius = 6
    collider.shape = shape
    add_child(collider)
func _physics_process(delta):
    var p = get_tree().get_first_node_in_group("player")
    if not is_instance_valid(p) or p.dead or p.input_locked or collected:
        return
    age += delta
    queue_redraw()
    var distance: float = global_position.distance_to(p.global_position)
    var usable: bool = kind != "tonic" or p.hp < p.max_hp
    if age > 0.35 and distance < 100 and usable:
        velocity = global_position.direction_to(p.global_position) * 340
    else:
        velocity.y += 800 * delta
        velocity.x = move_toward(velocity.x, 0, 130 * delta)
    move_and_slide()
    if age > 0.35 and distance < 32 and usable:
        collect(p)
func collect(p) -> bool:
    if collected or p.dead:
        return false
    if kind == "tonic" and p.hp >= p.max_hp:
        return false
    collected = true
    match kind:
        "gold": p.add_gold(amount)
        "tonic": p.restore_health(30)
        "fang": p.attack_damage += 3
        "heart":
            p.max_hp += 8
            p.restore_health(8)
        "ruby": p.lifesteal = minf(0.5, p.lifesteal + 0.01)
    if kind != "gold":
        p.message_requested.emit(INFO[kind][0])
    p.stats_changed.emit()
    hide()
    queue_free()
    return true
func _draw():
    var center := Vector2(0, sin(age * 4) * 2 - 5)
    var tint: Color = INFO[kind][1]
    draw_circle(center, 15, Color(tint, 0.12))
    if kind == "gold":
        draw_circle(center, 7, Color("#b87624"))
        draw_circle(center + Vector2(0, -1), 6, tint)
        draw_line(center + Vector2(0, -5), center + Vector2(0, 3), Color("#fff7bf"), 2)
    elif kind == "tonic":
        draw_style_box(bottle_style(), Rect2(center + Vector2(-7, -5), Vector2(14, 16)))
        draw_rect(Rect2(center + Vector2(-4, -9), Vector2(8, 5)), Color("#edd9ac"))
        draw_line(center + Vector2(-4, 3), center + Vector2(4, 3), Color.WHITE, 2)
        draw_line(center + Vector2(0, -1), center + Vector2(0, 7), Color.WHITE, 2)
    else:
        draw_colored_polygon(PackedVector2Array([center + Vector2(0,-11), center + Vector2(9,-2), center + Vector2(0,11), center + Vector2(-9,-2)]), tint)
        draw_line(center + Vector2(-5,-3), center + Vector2(0,-8), Color.WHITE, 2)
static func bottle_style() -> StyleBoxFlat:
    var box := StyleBoxFlat.new()
    box.bg_color = Color("#70e4ac")
    box.border_color = Color.WHITE
    box.set_border_width_all(1)
    box.set_corner_radius_all(4)
    return box
