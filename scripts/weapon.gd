extends Node2D

var kind := "fighter"

func _draw():
    match kind:
        "mage":
            draw_line(Vector2(20, 22), Vector2(25, -25), Color(0.6, 0.35, 0.15), 5)
            draw_circle(Vector2(25, -28), 9, Color(0.7, 0.4, 1))
        "shooter":
            draw_rect(Rect2(12, -6, 33, 11), Color(0.4, 0.45, 0.55))
            draw_rect(Rect2(17, 2, 7, 13), Color(0.23, 0.26, 0.3))
            draw_line(Vector2(42, -1), Vector2(53, -1), Color(0.8, 0.8, 0.85), 5)
        "bowman":
            draw_arc(Vector2(15, 0), 26, -PI/2, PI/2, 24, Color(0.8, 0.55, 0.2), 4)
            draw_line(Vector2(15, -26), Vector2(15, 26), Color.WHITE, 1)
            draw_line(Vector2(6, 0), Vector2(47, 0), Color(0.65, 0.95, 0.4), 2)
