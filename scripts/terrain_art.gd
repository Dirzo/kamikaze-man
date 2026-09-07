extends Node2D
var width := 380.0
var platform := false

func _draw():
    var top := -12.0 if platform else -40.0
    var height := 24.0 if platform else 1000.0
    draw_rect(Rect2(-width/2, top, width, height), Color("#8f613c"))
    draw_rect(Rect2(-width/2, top + 10, width, 9), Color("#b27d4a"))
    for i in range(int(width / 25)):
        var x := -width/2 + i * 25 + 4
        draw_circle(Vector2(x, top + 26 + (i % 3) * 10), 4, Color("#6e4d36"))
        draw_line(Vector2(x, top + 2), Vector2(x + 7, top - 6 - (i % 3) * 2), Color("#50853d"), 3)
    draw_rect(Rect2(-width/2, top - 3, width, 10), Color("#70ac4d"))
    draw_line(Vector2(-width/2, top - 3), Vector2(width/2, top - 3), Color("#b3d777"), 3)
