extends Node2D

var radius := 100.0
var tint := Color(1, 0.8, 0.3)
var life := 0.35

func _ready():
    add_to_group("combat_effects")

func _process(delta):
    life -= delta
    queue_redraw()
    if life <= 0:
        queue_free()

func _draw():
    var color := tint
    color.a = maxf(0, life)
    draw_circle(Vector2.ZERO, radius * (1.0 - life / 0.35), color)
    draw_arc(Vector2.ZERO, radius, 0, TAU, 40, tint, 2)
