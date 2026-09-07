extends RefCounted

static func character(parent: Node2D, frame: int, player := false):
    parent.polygon = PackedVector2Array()
    var sprite := Sprite2D.new()
    sprite.texture = load("res://assets/characters.png")
    sprite.hframes = 4
    sprite.vframes = 2
    sprite.frame = frame
    sprite.scale = Vector2.ONE * (0.15 if player else 0.14)
    sprite.position.y = -13 if player else -12
    var shader := Shader.new()
    shader.code = "shader_type canvas_item; varying vec4 sprite_tint; void vertex(){sprite_tint=COLOR;} void fragment(){ vec4 c = texture(TEXTURE, UV); float alpha = smoothstep(0.22, 0.32, distance(c.rgb, vec3(1.0,0.0,1.0))); COLOR = vec4(c.rgb, c.a * alpha) * sprite_tint; }"
    var material := ShaderMaterial.new()
    material.shader = shader
    sprite.material = material
    parent.add_child(sprite)
    parent.move_child(sprite, 0)
    sprite.name = "Portrait"
    return sprite

static func terrain(body: Node2D, width: float, platform := false):
    if body.has_node("GrassArt"):
        body.get_node("GrassArt").free()
    var art = load("res://scripts/terrain_art.gd").new()
    art.name = "GrassArt"
    art.width = width
    art.platform = platform
    body.add_child(art)
    body.get_node("Visual").hide()
