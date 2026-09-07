extends RefCounted
const STYLES = {
    "fighter": [
        {"id":"bloodblade","name":"Bloodblade","skill":"Crimson Reap","desc":"Drain life with every hit. Q becomes a heavy life-stealing cleave.","ranks":["+10% lifesteal; Q deals 3x damage","Lifesteal rises to 20%","Q damage rises to 4x"]},
        {"id":"guardian","name":"Guardian","skill":"Shield Quake","desc":"Hold your ground. Reduce damage and guard while slowing enemies.","ranks":["25% less damage; Q grants 2s guard","Q slows enemies by 70%","Guard lasts 3s; Q radius 200"]},
        {"id":"cyclone","name":"Cyclone","skill":"Blade Storm","desc":"Fast sword pressure with frequent wide whirlwinds.","ranks":["25% faster attacks; Q radius 200","Q cooldown reduced by 35%","Q damage rises to 3.5x"]}
    ],
    "mage": [
        {"id":"pyromancer","name":"Pyromancer","skill":"Inferno","desc":"Explosive fire and burns keep damaging clustered enemies.","ranks":["Hits burn for 3 seconds","Burn damage doubles","Q radius 300; damage 4x"]},
        {"id":"cryomancer","name":"Cryomancer","skill":"Frost Ring","desc":"Slow enemies and control space with broad icy explosions.","ranks":["Hits slow 50%; wider orb splash","Q slows enemies by 85%","Q cooldown reduced by 40%"]},
        {"id":"siphon","name":"Siphon","skill":"Soul Harvest","desc":"Sustain through danger with life-draining magic.","ranks":["20% lifesteal; Q damage 3x","Q cooldown reduced by 25%","30% lifesteal; Q radius 280"]}
    ],
    "shooter": [
        {"id":"gunslinger","name":"Gunslinger","skill":"Bullet Fan","desc":"Rapid fire and broad shotgun bursts for close combat.","ranks":["20% faster fire; Q fires 7 bullets","Q cooldown reduced by 35%","Q damage rises to 2.2x per bullet"]},
        {"id":"sniper","name":"Sniper","skill":"Rail Shot","desc":"Slower, heavier shots and a piercing precision skill.","ranks":["1.8x bullet damage; 50% slower fire","Primary shots pierce 2 enemies","Q deals 6x damage and pierces 8"]},
        {"id":"demolitioner","name":"Demolitioner","skill":"Bombardment","desc":"Explosive rounds and a three-bomb burst clear groups.","ranks":["Bullets explode in a 60px radius","Explosion radius rises to 90","Q bombs deal 3x damage each"]}
    ],
    "bowman": [
        {"id":"ranger","name":"Ranger","skill":"Arrow Rain","desc":"Trade single-target power for volleys covering a wide angle.","ranks":["Primary fires 3 arrows at 65% damage","Q fires 7 arrows","Primary arrows pierce 4 enemies"]},
        {"id":"marksman","name":"Marksman","skill":"Heartseeker","desc":"Heavy precision arrows reward lining up enemies.","ranks":["1.5x arrow damage; 30% slower fire","Q cooldown reduced by 30%","Q damage rises to 6x"]},
        {"id":"thorn","name":"Thorn Warden","skill":"Briar Burst","desc":"Life-stealing arrows slow targets and keep you healthy.","ranks":["15% lifesteal; hits slow 40%","Lifesteal rises to 25%","Q fires 3 piercing arrows"]}
    ]
}

