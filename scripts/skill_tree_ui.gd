extends Panel
var player
var header: Label

func _ready():
    position = Vector2(100, 135)
    size = Vector2(1080, 485)
    var box := StyleBoxFlat.new()
    box.bg_color = Color("#142c3a")
    box.border_color = Color("#f5cc70")
    box.set_border_width_all(3)
    box.set_corner_radius_all(14)
    add_theme_stylebox_override("panel", box)

func label_at(text: String, pos: Vector2, bounds: Vector2, font_size := 18, color := Color.WHITE):
    var label := Label.new()
    label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    label.text = text
    label.position = pos
    label.size = bounds
    label.clip_text = true
    label.add_theme_font_size_override("font_size", font_size)
    label.add_theme_color_override("font_color", color)
    add_child(label)
    label.size = bounds

func refresh(p):
    player = p
    for child in get_children():
        remove_child(child)
        child.queue_free()
    label_at("%s SKILL TREE  •  %d POINTS" % [p.class_name_display.to_upper(), p.skill_points], Vector2(25, 16), Vector2(1000, 36), 26, Color("#ffe3a1"))
    label_at("One style per run. Ranks cost 1 / 2 / 3 points. Class unlock: +3 points; each level: +1.", Vector2(25, 55), Vector2(1030, 34), 17)
    var styles = p.SkillTree.STYLES[p.combat_class]
    for column in range(3):
        var data = styles[column]
        var x := 25 + column * 350
        var available: bool = p.style_index < 0 or p.style_index == column
        var color := Color.WHITE if available else Color("#8694a4")
        label_at("%d  %s" % [column + 1, data.name.to_upper()], Vector2(x, 100), Vector2(325, 32), 22, color)
        label_at(data.desc, Vector2(x, 137), Vector2(320, 68), 16, color)
        for rank in range(3):
            var node := Panel.new()
            node.position = Vector2(x, 212 + rank * 65)
            node.size = Vector2(320, 54)
            var box := StyleBoxFlat.new()
            var learned: bool = p.style_index == column and p.style_rank > rank
            box.bg_color = Color("#296454") if learned else Color("#253d4e")
            box.border_color = Color("#bce992") if learned else Color("#536878")
            box.set_border_width_all(1)
            box.set_corner_radius_all(6)
            node.add_theme_stylebox_override("panel", box)
            add_child(node)
            label_at("%s %s" % ["✓" if learned else str(rank + 1) + ".", data.ranks[rank]], Vector2(x + 10, 217 + rank * 65), Vector2(300, 47), 16, color)
            if rank < 2:
                label_at("↓", Vector2(x + 153, 263 + rank * 65), Vector2(20, 18), 14, Color("#f5cc70"))
    label_at("1 / 2 / 3: invest in that branch     T or ESC: return to game     F2: fresh class + style test", Vector2(25, 441), Vector2(1030, 30), 17, Color("#ffe3a1"))
