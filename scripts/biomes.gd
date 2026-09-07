extends RefCounted
const NAMES = ["SUNLEAF WOODS", "FROSTFALL RUINS", "EMBER CANYON", "MOONCAP GROVE"]
const ENEMIES = [
    ["Leaf Slime", "Wild Mushroom", "Forest Imp", "Forest Colossus"],
    ["Snow Puff", "Frost Wolf", "Ice Imp", "Glacier Golem"],
    ["Ember Slime", "Lava Beetle", "Cinder Mage", "Basalt Titan"],
    ["Mooncap", "Dusk Bat", "Spore Wizard", "Mushroom Monarch"]
]
static func index_for(map_number: int) -> int:
    return ((map_number - 1) / 3) % 4

static func background(index: int) -> Texture2D:
    if index == 0:
        return load("res://assets/forest.png")
    var atlas := AtlasTexture.new()
    atlas.atlas = load("res://assets/biomes.png")
    var size := atlas.atlas.get_size() / 2
    atlas.region = Rect2(Vector2(index % 2, index / 2) * size, size)
    return atlas

static func enemy_art(enemy, index: int, variant: int):
    var sprite: Sprite2D = enemy.get_node("Body/Portrait")
    enemy.biome_index = index
    enemy.art_scale = 0.14 if index == 0 else 0.18
    sprite.texture = load("res://assets/characters.png") if index == 0 else load("res://assets/biome_enemies.png")
    sprite.hframes = 4
    sprite.vframes = 2 if index == 0 else 3
    sprite.frame = 4 + variant if index == 0 else (index - 1) * 4 + variant
    sprite.scale = Vector2.ONE * enemy.art_scale
    enemy.enemy_name = ENEMIES[index][variant]
    enemy.get_node("Name").text = ("MEGA — " if enemy.mega else "") + enemy.enemy_name.to_upper()
