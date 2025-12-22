// ==========================================
// GAME CONFIGURATION
// ==========================================
const GAME_CONFIG = {
    // 1. Display & Layout
    width: 480,
    height: 800,
    scaleMode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,

    gridSize: 70,
    gridGap: 6,
    enemyGridTop: 100, // Slightly improved top margin
    playerGridTop: 430, // Brought higher up to reduce gap (was 480)

    // 2. Colors
    colors: {
        player: {
            warrior: 0x3498db, // Blue
            archer: 0x2ecc71,  // Green
            mage: 0x9b59b6     // Purple
        },
        enemy: {
            minion: 0xe74c3c,    // Red (Melee)
            ranged: 0xd35400,    // Orange (Ranged)
            aoe: 0x546e7a,       // Blue-Grey (AoE)
            boss: 0xc0392b       // Dark Red
        },
        text: 0xffffff,
        gridBg: 0x34495e,
        uiBg: 0x2c3e50
    },

    // 3. Unit Stats (Added DEF)
    units: {
        player: {
            warrior: { hp: 100, atk: 50, def: 10, name: "Warrior" },
            archer: { hp: 60, atk: 40, def: 5, name: "Archer" },
            mage: { hp: 50, atk: 40, def: 5, name: "Mage" }
        },
        enemy: {
            melee_minion: { hp: 120, atk: 30, def: 5, name: "Goblin" },
            ranged_minion: { hp: 80, atk: 25, def: 5, name: "Spear" },
            aoe_minion: { hp: 90, atk: 35, def: 5, name: "Warlock" },
            boss_1: { hp: 2000, atk: 60, def: 20, name: "Col-Smasher" },
            boss_2: { hp: 1500, atk: 50, def: 15, name: "Area-Crusher" }
        }
    },

    // 4. Asset Paths
    assets: {
        player: {
            warrior: 'assets/Warrior.png',
            archer: 'assets/Archer.png',
            mage: 'assets/Mage.png'
        },
        enemy: {
            melee_minion: 'assets/Goblin.png',
            ranged_minion: 'assets/Spear.png',
            aoe_minion: 'assets/Warlock.png',
            boss_1: 'assets/Col-Smasher.png',
            boss_2: 'assets/Area-Crusher.png'
        },
        projectiles: {
            spear: 'assets/SpearProj.png'
        }
    },

    // 4. Level Data (15 Levels, Wave System)
    // Types: 'normal' (3 waves), 'boss' (1 wave)
    levels: [
        // World 1: Goblin Forest
        {
            id: 1, name: "Lvl 1", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 2 }],
                [{ type: 'melee_minion', count: 3 }],
                [{ type: 'melee_minion', count: 2 }, { type: 'ranged_minion', count: 1 }]
            ]
        },
        {
            id: 2, name: "Lvl 2", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 3 }],
                [{ type: 'ranged_minion', count: 2 }],
                [{ type: 'melee_minion', count: 2 }, { type: 'ranged_minion', count: 2 }]
            ]
        },
        {
            id: 3, name: "Lvl 3", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 4 }],
                [{ type: 'melee_minion', count: 2 }, { type: 'ranged_minion', count: 2 }],
                [{ type: 'melee_minion', count: 5 }]
            ]
        },
        {
            id: 4, name: "Lvl 4", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 3 }, { type: 'ranged_minion', count: 3 }],
                [{ type: 'melee_minion', count: 4 }, { type: 'aoe_minion', count: 1 }],
                [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 2 }, { type: 'aoe_minion', count: 1 }]
            ]
        },
        {
            id: 5, name: "Lvl 5 (BOSS)", type: 'boss', waves: [
                [{ type: 'boss_1', count: 1 }] // Col-Smasher
            ]
        },

        // World 2: Dark Cave
        {
            id: 6, name: "Lvl 6", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 4 }],
                [{ type: 'ranged_minion', count: 4 }],
                [{ type: 'melee_minion', count: 3 }, { type: 'ranged_minion', count: 3 }]
            ]
        },
        {
            id: 7, name: "Lvl 7", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 5 }],
                [{ type: 'melee_minion', count: 4 }, { type: 'ranged_minion', count: 2 }],
                [{ type: 'melee_minion', count: 6 }]
            ]
        },
        {
            id: 8, name: "Lvl 8", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 3 }, { type: 'ranged_minion', count: 3 }, { type: 'aoe_minion', count: 1 }],
                [{ type: 'melee_minion', count: 5 }, { type: 'aoe_minion', count: 2 }],
                [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 3 }, { type: 'aoe_minion', count: 2 }]
            ]
        },
        {
            id: 9, name: "Lvl 9", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 5 }, { type: 'aoe_minion', count: 1 }],
                [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 4 }, { type: 'aoe_minion', count: 1 }],
                [{ type: 'melee_minion', count: 8 }]
            ]
        },
        {
            id: 10, name: "Lvl 10 (BOSS)", type: 'boss', waves: [
                [{ type: 'boss_2', count: 1 }] // Area-Crusher
            ]
        },

        // World 3: Castle
        {
            id: 11, name: "Lvl 11", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 2 }],
                [{ type: 'melee_minion', count: 6 }],
                [{ type: 'melee_minion', count: 7 }]
            ]
        },
        {
            id: 12, name: "Lvl 12", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 4 }, { type: 'ranged_minion', count: 3 }, { type: 'aoe_minion', count: 2 }],
                [{ type: 'melee_minion', count: 6 }, { type: 'ranged_minion', count: 2 }, { type: 'aoe_minion', count: 2 }],
                [{ type: 'melee_minion', count: 8 }]
            ]
        },
        {
            id: 13, name: "Lvl 13", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 2 }, { type: 'aoe_minion', count: 3 }],
                [{ type: 'melee_minion', count: 6 }, { type: 'ranged_minion', count: 3 }, { type: 'aoe_minion', count: 3 }],
                [{ type: 'melee_minion', count: 8 }, { type: 'ranged_minion', count: 4 }]
            ]
        },
        {
            id: 14, name: "Lvl 14", type: 'normal', waves: [
                [{ type: 'melee_minion', count: 6 }, { type: 'aoe_minion', count: 3 }],
                [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 4 }, { type: 'aoe_minion', count: 4 }],
                [{ type: 'melee_minion', count: 10 }]
            ]
        },
        {
            id: 15, name: "Lvl 15 (FINAL)", type: 'boss', waves: [
                [{ type: 'boss_1', count: 1 }, { type: 'boss_2', count: 1 }] // Double Boss!
            ]
        }
    ]
};
