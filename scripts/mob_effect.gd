extends Node2D
var kind := "fighter"
var radius := 260.0
var life := 0.5
func _ready():
    add_to_group("combat_effects")
    z_index = 8
func _process(delta):
    life -= delta
    if life <= 0: queue_free()
    queue_redraw()
func _draw():
    var alpha := maxf(0, life * 2)
    for i in range(12):
        var x := -radius + i * radius / 6.0
        match kind:
            "bowman":
                var y := -180 + (0.5-life)*360 + (i%3)*18
                draw_line(Vector2(x-15,y-50), Vector2(x,y), Color(0.65,1,0.7,alpha),3)
                draw_line(Vector2(x-8,y-5),Vector2(x,y),Color(1,1,1,alpha),3)
            "shooter":
                draw_line(Vector2(-radius, 30), Vector2(x, -110 + i*18), Color(1,0.85,0.4,alpha),3)
            "mage":
                draw_line(Vector2(x,-130),Vector2(x+20,-25),Color(0.7,0.6,1,alpha),4)
                draw_line(Vector2(x+20,-25),Vector2(x-10,30),Color(0.9,0.8,1,alpha),4)
            _:
                draw_line(Vector2(x,25),Vector2(x+16,-20-(i%3)*12),Color(1,0.7,0.3,alpha),5)
