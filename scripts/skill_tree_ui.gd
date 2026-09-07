extends Panel
var player
var header: Label
var ability_mode := false

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
    if ability_mode:
        refresh_abilities(p)
        return
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
    label_at("1 / 2 / 3: invest     TAB: ability options     T / ESC: return     F2: fresh class test", Vector2(25, 441), Vector2(1030, 30), 17, Color("#ffe3a1"))

func refresh_abilities(p):
    label_at("%s  •  CHOOSE YOUR E ABILITY" % p.class_name_display.to_upper(), Vector2(25, 16), Vector2(1030, 36), 26, Color("#ffe3a1"))
    label_at("Mix with any fighting style. Switch freely; remaining cooldown carries over. No skill points needed.", Vector2(25, 60), Vector2(1030, 48), 18)
    for column in range(3):
        var data = p.Abilities.OPTIONS[p.combat_class][column]
        var x := 25 + 350 * column
        var selected: bool = p.ability_index == column
        var card := Panel.new()
        card.position = Vector2(x, 125)
        card.size = Vector2(325, 275)
        var box := StyleBoxFlat.new()
        box.bg_color = Color("#296454") if selected else Color("#253d4e")
        box.border_color = Color("#bce992") if selected else Color("#536878")
        box.set_border_width_all(2)
        box.set_corner_radius_all(10)
        card.add_theme_stylebox_override("panel", box)
        add_child(card)
        label_at("%d  %s" % [column + 1, data.name], Vector2(x + 14, 145), Vector2(295, 36), 22, Color("#ffe3a1"))
        label_at(data.role, Vector2(x + 14, 190), Vector2(295, 30), 16, Color("#b6e6e6"))
        label_at(data.desc, Vector2(x + 14, 231), Vector2(295, 110), 18)
        label_at("%s  •  %ds cooldown" % ["EQUIPPED ON E" if selected else "PRESS " + str(column + 1), data.cooldown], Vector2(x + 14, 356), Vector2(295, 30), 16, Color("#ffe3a1"))
    label_at("1 / 2 / 3: equip     TAB: fighting-style tree     T / ESC: return to game     E: use ability", Vector2(25, 437), Vector2(1030, 34), 17, Color("#ffe3a1"))
