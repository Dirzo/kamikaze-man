"""Regular enemy sprites (fill maps facing LEFT; build_assets.py flips them to face right).

Every map uses one shared key (ENEMY_KEY) so colours stay on-palette and consistent.
Each entry: (rows, alt) where alt is how frame 2 differs:
  {'rows': {index: row}}   replace specific rows (legs, wings, spikes)
  {'bob': 1}               same art shifted down 1px (floaters)
Game type names match ED in game-src/core/12-enemies-waves.js.
"""
from pixel import CHICKEN, GREMLIN

ENEMY_KEY = {
    'e': 'ink', 'k': 'night', 'K': 'slate', 's': 'stone', 'f': 'fog', 'm': 'mist', 'w': 'paper',
    'S': 'skin', 'd': 'skinM', 'D': 'skinD', 'b': 'woodD', 'B': 'wood', 'n': 'sand',
    'r': 'red', 'R': 'wine', 'c': 'coral', 'o': 'orange', 'y': 'gold', 'Y': 'cream', 'x': 'rust',
    'g': 'grass', 'G': 'leaf', 'h': 'pine', 'l': 'lime', 'v': 'violet', 'V': 'indigo',
    't': 'teal', 'i': 'ice', 'u': 'sky', 'U': 'blue', 'N': 'navy', 'p': 'pink',
}
# The two drawn first keep their own keys (see pixel.py); remap them onto the shared key letters.
_CH = {'w': 'w', 'g': 'm', 'G': 'f', 'c': 'r', 'C': 'R', 'y': 'y', 'Y': 'o', 'e': 'e', 'h': 'h', 'H': 'G',
       'b': 'k', 'B': 'K', 'f': 'c', 'F': 'Y', 'r': 'r', 'S': 'y', 'x': 'm'}
_GR = {'g': 'g', 'G': 'G', 'h': 'h', 'l': 'l', 'e': 'r', 'E': 'c', 't': 'w', 'm': 'e', 'y': 'y', 'Y': 'o',
       'b': 'b', 'B': 'B'}


def _remap(rows, table):
    return [''.join(table.get(ch, ch) if ch != '.' else '.' for ch in row) for row in rows]


ENEMIES = {
    'bombchicken': (_remap(CHICKEN, _CH), {'rows': {15: '......y..y.....', 16: '.....yy.yy.....'}}),
    'crawler': (_remap(GREMLIN, _GR), {'rows': {13: '...hh..hh.....', 14: '..hhh..hhh....'}}),

    # Graveyard Hacker / Prototype Sword Apprentice: hooded bandit with a dagger, glowing eyes.
    'stalker': ([
        '....eeeee.....',
        '...eKKKKKe....',
        '..eKKKKKKKe...',
        '..KKsssssKK...',
        '..KyeSSyeKK...',
        '..KSSSSSSKK...',
        '...KSDDDSK....',
        '..rrrrrrrK....',
        '.KrrKKKKKKK...',
        'mKKKKKKbKKKS..',
        'fSKKKKKbKKKS..',
        'f..KKKbbbKK...',
        '...KKKKKKKK...',
        '...NNNNNNNN...',
        '...NNN..NNN...',
        '...NN....NN...',
        '..eee...eee...',
    ], {'rows': {14: '...NNN.NNN....', 15: '....NN.NN.....', 16: '...eee.eee....'}}),

    # Axe Landlord / Overcompensating Sparring Partner: tusked brute with a big axe.
    'brute': ([
        '.mm.......eeeeee.........',
        'mffm....eGGGGGGGe........',
        'mfffB..eGGGGGGGGGe.......',
        'mffmB..GGyeGGyeGGG.......',
        '.mm.B..GGGGGGGGGGG.......',
        '....B..GwGwGGwGwGG.......',
        '....B...GGGGGGGGG........',
        '....BBBGGGGGGGGGBBB......',
        '...GBBBBBBbbbBBBBBBBB....',
        '..GGBBBBBBBbBBBBBBBBGG...',
        '.GGGBBBBBBBbBBBBBBBBGGG..',
        '.GGG.BBBBBBbBBBBBBBB.GGG.',
        '.GG..xxxxxxxxxxxxxxx..GG.',
        '.GG..BBBBBBBBBBBBBBB..GG.',
        '.....BBBBBBBBBBBBBBB.....',
        '.....NNNNNNN.NNNNNNN.....',
        '.....NNNNNN...NNNNNN.....',
        '.....NNNNN.....NNNNN.....',
        '....eeeeee.....eeeeee....',
    ], {'rows': {16: '......NNNNN..NNNNN.......', 17: '......NNNN....NNNN.......', 18: '.....eeeee....eeeee......'}}),

    # Fireball Ghost / Casserole Spirit: tattered floating ghost with ember hands.
    'wraith': ([
        '....mmmmm....',
        '...mwwwwwm...',
        '..mwwwwwwwm..',
        '..wkkwwkkww..',
        '..wkkwwkkwwm.',
        '..wwwwwwwwwm.',
        '..wwkkkwwwwm.',
        'o.mwwwwwwwwm.',
        'oowwwwwwwwwwo',
        '..wwwwwwwwwoo',
        '..mwwwwwwwwm.',
        '..iwwwwwwwwi.',
        '..wwwwwwwwww.',
        '..mwwmwwmwwm.',
        '...m..m..m...',
        '..i..i..i....',
    ], {'bob': 1}),

    # Pretzel Maw / Hungry Grandchild Maw: four-legged mouth beast.
    'maw': ([
        '....vvvvvvvvvvvvvv.........',
        '..vvvvvvvvvvvvvvvvvvv......',
        '.vvyvvvvvvvvvvvvvvvvvv.....',
        'vvvvvvvvvvvvvvvvvvvvvVV....',
        'wvwvwvwvwvvvvvvvvvvvvVV....',
        'rrrrrrrrrvvvvvvvvvvvvvVV...',
        'rppppppprvvvvvvvvvvvvvVV...',
        'rrrrrrrrrvvvvvvvvvvvvvVV...',
        'wvwvwvwvvvvvvvvvvvvvvvVV...',
        '.vvvvvvvvvvvvvvvvvvvvvV....',
        '..vVvvvvvvvvvvvvvvvvvV.....',
        '...VV..VV.........VV..VV...',
        '...VV..VV.........VV..VV...',
        '..eee.eee........eee.eee...',
    ], {'rows': {11: '....VV.VV.........VV.VV....', 12: '....VV.VV........VV..VV....', 13: '...eee.eee......eee.eee....'}}),

    # Sky Problem / Autonomous Bow Limb: bat-winged imp.
    'flyer': ([
        'v...............v',
        'vv.....VVV.....vv',
        'vvv...VVVVV...vvv',
        'vvvv.VyVVyVV.vvvv',
        'vvvvvVVVVVVVvvvvv',
        '.vvvvVVwVwVVvvvv.',
        '..vvvVVVVVVVvvv..',
        '...v..VVVVV..v...',
        '.......V.V.......',
    ], {'rows': {0: '.................', 1: '.......VVV.......', 2: '......VVVVV......', 3: '.....VyVVyVV.....',
                 4: 'vvvvvVVVVVVVvvvvv', 5: 'vvvvvVVwVwVVvvvvv', 6: 'vvv.VVVVVVVV.vvv.', 7: 'vv....VVVVV...vv.', 8: 'v......V.V......v'}}),

    # Unlicensed Wizard / Particle-Effect Apprentice: pointy hat, beard, orb staff.
    'wizard': ([
        '.t.......e......',
        'ttt.....eV......',
        '.t.....eVV......',
        '.B....eVVV......',
        '.B...eVVyVV.....',
        '.B..VVVVVVVVV...',
        '.B.VVVVVVVVVVV..',
        '.B....SSSS......',
        '.B...SeSSeS.....',
        '.B...SSSSSS.....',
        '.B..mmmmmmmm....',
        '.BSVVmmmmmmVV...',
        '.BSVVVmmmmVVVV..',
        '.B.VVVVVmmVVVVS.',
        '.B.VVVVVVVVVVV..',
        '.B.VVVVVVVVVVVV.',
        '.B.VVVVVVVVVVVV.',
        '...VVVVVVVVVVVV.',
        '....VVVVVVVVVV..',
        '...ee.......ee..',
    ], {'rows': {0: '.i.......e......', 1: 'iti.....eV......', 2: '.i.....eVV......'}}),

    # Combat Auditor: monocled tax scribe with a ledger and a quill.
    'taxman': ([
        '.y..eeeeeee....',
        '.yy.NNNNNNNe...',
        '..y.NNNNNNNN...',
        '..y.SSSSSSS....',
        '...SeSSiSeS....',
        '...SSSSSSSS....',
        '....SDDDDS.....',
        '...NNNwwNNN....',
        '..NNNNwwNNNN...',
        '.nnnnNNNNNNNN..',
        '.nkknNNNNNNNN..',
        '.nnnnSNNNNNNN..',
        '..NNNNNNNNNNN..',
        '..NNNNNNNNNNN..',
        '...NNNNNNNNN...',
        '...ee....ee....',
    ], {'rows': {14: '...NNNNNNNN....', 15: '....ee..ee.....'}}),

    # Definitely Normal Treasure Chest: teeth, tongue, gold lock.
    'mimic': ([
        '.bbbbbbbbbbbbbbbbbbbbb.',
        'bBBBBBBBBBBBBBBBBBBBBBb',
        'bBBBBByyyyyyyyyyBBBBBBb',
        'bBBBBBBBBBBBBBBBBBBBBBb',
        'byyyyyyyyyyyyyyyyyyyyyb',
        'wewewewewewewewewewewew',
        'eeeeeeeeeeeeeeeeeeeeeee',
        'pppppppeeeeeeeeeeeeeeee',
        'eeeeeeeeeeeeeeeeeeeeeee',
        'wewewewewewewewewewewew',
        'byyyyyyyyyyyyyyyyyyyyyb',
        'bBBBBBBBBByyyBBBBBBBBBb',
        'bBBBBBBBByeyBBBBBBBBBBb',
        'bBBBBBBBBByBBBBBBBBBBBb',
        'bbbbbbbbbbbbbbbbbbbbbbb',
    ], {'rows': {5: 'ewewewewewewewewewewewe', 7: 'eeppppppeeeeeeeeeeeeeee', 9: 'ewewewewewewewewewewewe'}}),

    # Management Eye / Shareholder Scrying Orb: veined floating eyeball.
    'eyeball': ([
        '.....mmmmmmm.....',
        '...mwwwwwwwwwm...',
        '..mwwwrwwwwwwwm..',
        '.mwwwwwwwwwrwwwm.',
        '.wwwuuuuuwwwwwww.',
        'mwwuUUUUUuwwwwwwm',
        'mwwuUeeeUuwwwrwwm',
        'mwwuUeeeUuwwwwwwm',
        'mwwuUUUUUuwwwwwwm',
        '.wwwuuuuuwwwwwww.',
        '.mwwwwwwwwwwwwwm.',
        '..mwwwwwwrwwwwm..',
        '...mwwwwwwwwwm...',
        '.....mmmmmmm.....',
        '.......r.r.......',
        '......r...r......',
    ], {'bob': 1}),

    # Safety Gear Traitor / Benefits-Denial Paladin: visored knight behind a tower shield.
    'shieldbro': ([
        '.....eeeee.........',
        '....efffffe........',
        '....fmffffm........',
        '....feeeeef........',
        '....ffffffff.......',
        '.....ffffff........',
        '.yyyyyyyy..........',
        'yUUUUUUUyfffff.....',
        'yUUyyyUUyffffff....',
        'yUUyUyUUyfffffff...',
        'yUUyyyUUyffffffff..',
        'yUUUyUUUyffffff....',
        'yUUUyUUUyfffff.....',
        'yUUUUUUUyfffff.....',
        'yUUUUUUUyKKKKK.....',
        '.yUUUUUy.KKKKK.....',
        '..yyyyy..KK.KK.....',
        '.........KK.KK.....',
        '........eee.eee....',
    ], {'rows': {16: '..yyyyy..KK..KK....', 17: '.........KK..KK....', 18: '........eee..eee...'}}),

    # Teleporting Training Golem / Backstab Associate: void imp with pink eyes and teal cracks.
    'blinker': ([
        '....vvvvv.....',
        '...vvvvvvv....',
        '..vvpvvvpvv...',
        '..vvvvvvvvv...',
        '...vvvvvvv....',
        '....vvvvv.....',
        '...vvvvvvvv...',
        '.pvvvvtvvvvp..',
        '.vvvvvvtvvvvv.',
        '..vvvvtvvvvv..',
        '..vvvvvtvvvv..',
        '...vvvvvvvv...',
        '...vv....vv...',
        '..pvv....vvp..',
        '...p......p...',
    ], {'rows': {2: '..vvtvvvtvv...', 7: '.tvvvvpvvvvt..', 9: '..vvvvpvvvvv..'}}),

    # Middle-Management Necromancer: hooded robe, skull face, green hands, skull staff.
    'summoner': ([
        '.www...kkkkkk.....',
        'wewew.kkkkkkkk....',
        '.www.kkkKKKKkkk...',
        '..B..kkKmmmmKkk...',
        '..B..kkKmlmlKkk...',
        '..B..kkKmmmmKkk...',
        '..B...kkKmmKkk....',
        '..B..hkkkkkkkkh...',
        '..B.hkkkkkkkkkkh..',
        '..Blkkkkkkhkkkkkl.',
        '..B.kkkkkkhkkkkkl.',
        '..B.kkkkkkhkkkkk..',
        '..B.kkkkkkhkkkkk..',
        '....kkkkkkkkkkkk..',
        '...kkkkkkkkkkkkkk.',
        '...hhhhhhhhhhhhhh.',
    ], {'rows': {0: '.lll...kkkkkk.....', 1: 'lelel.kkkkkkkk....', 2: '.lll.kkkKKKKkkk...'}}),

    # Long-Range Performance Reviewer / Ballista Guy: feathered cap, crossbow held forward.
    'sniper': ([
        '.......r........',
        '.....GGGGr......',
        '....GGGGGGG.....',
        '...GGGGGGGGGG...',
        '.....SSSSS......',
        '....SeSSSS......',
        '....SSSSSS......',
        '.....SDDS.......',
        '....GGGGGGG.....',
        'BBBBBBBBBBBBB...',
        'fBBGGGGGGGG.....',
        'f..GGGGbGGG.....',
        '...GGGGbGGG.....',
        '...GGGGGGGG.....',
        '....nnnnnn......',
        '....nn..nn......',
        '....nn..nn......',
        '...bbb..bbb.....',
    ], {'rows': {15: '....nn.nn.......', 16: '.....nnnn.......', 17: '....bbbbbb......'}}),

    # Runaway Siege Cart / Aggressive Throne on Wheels: spiked iron wheel with an angry face.
    'roller': ([
        '.......f..f.......',
        '....f.eeeeee.f....',
        '.....effffffe.....',
        '...feffffffffef...',
        '..effffeffeffffe..',
        '.fefffyeffyefffef.',
        '..effffffffffffe..',
        '..effeeeeeeeeffe..',
        '.fefewewewewefefe.',
        '..effeeeeeeeeffe..',
        '..effffffffffffe..',
        '...feffffffffef...',
        '.....effffffe.....',
        '....f.eeeeee.f....',
        '.......f..f.......',
    ], {'rows': {0: '......f....f......', 1: '...f..eeeeee..f...', 13: '...f..eeeeee..f...', 14: '......f....f......'}}),
}
