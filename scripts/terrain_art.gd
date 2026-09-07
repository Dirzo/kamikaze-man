extends Node2D
var width := 380.0
var platform := false
var biome_index := 0

func _draw():
    var top := -12.0 if platform else -40.0
    var height := 24.0 if platform else 1000.0
    var dirt: Color = [Color("#8f613c"),Color("#587e9f"),Color("#42343c"),Color("#443c62")][biome_index]
    var grass: Color = [Color("#70ac4d"),Color("#e3f6ff"),Color("#d47c42"),Color("#699aaf")][biome_index]
    draw_rect(Rect2(-width/2, top, width, height), dirt)
    draw_rect(Rect2(-width/2, top + 10, width, 9), dirt.lightened(0.15))
    for i in range(int(width / 25)):
        var x := -width/2 + i * 25 + 4
        draw_circle(Vector2(x, top + 26 + (i % 3) * 10), 4, dirt.darkened(0.25))
        draw_line(Vector2(x, top + 2), Vector2(x + 7, top - 6 - (i % 3) * 2), grass.darkened(0.2), 3)
    draw_rect(Rect2(-width/2, top - 3, width, 10), grass)
    draw_line(Vector2(-width/2, top - 3), Vector2(width/2, top - 3), grass.lightened(0.35), 3)
