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
    gridGap: 0, // No gap as requested
    // Layout Anchors
    boardMeetingY: 400, // The fixed center line where Enemy and Player boards meet
    boardGap: 10,       // Vertical gap between Player and Enemy boards
    // enemyGridTop: 100, // DEPRECATED - Calculated dynamically in game.js
    // playerGridTop: 430, // DEPRECATED - Calculated dynamically in game.js

    // 2. Colors
    colors: {
        player: {
            warrior: 0x3498db, // Blue
            archer: 0x2ecc71,  // Green
            mage: 0x9b59b6,    // Purple
            knight: 0x95a5a6   // Silver/Grey
        },
        enemy: {
            minion: 0xe74c3c,    // Red (Melee)
            ranged: 0xd35400,    // Orange (Ranged)
            aoe: 0x546e7a,       // Blue-Grey (AoE)
            boss: 0xc0392b       // Dark Red
        },
        boardThemes: {
            player: { light: 0xAED6F1, dark: 0x5DADE2 }, // Blueish
            enemy: { light: 0xF5B7B1, dark: 0xE74C3C }   // Reddish
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
            mage: { hp: 50, atk: 40, def: 5, name: "Mage" },
            knight: { hp: 120, atk: 30, def: 8, name: "Knight" }
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
            mage: 'assets/Mage.png',
            knight: 'assets/Knight.png'
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

    // 4. Level Data
    // New Schema:
    // cols: Number (e.g., 3 or 4) - Fixed for the whole level
    // playerRows: Number (e.g., 3 or 4)
    // waves: Array of Objects
    //    enemyRows: Number (e.g., 3 or 4)
    //    units: Array of { type, count } (Random fill)
    //    placements: Array of { type, r, c } (Fixed positions)
    levels: [
        // World 1: Goblin Forest (Modified for Testing 3x3/3x4)
        {
            id: 1, name: "Lvl 1", type: 'normal',
            cols: 3, playerRows: 3, // 3x3 Player Board
            waves: [
                {
                    enemyRows: 3, // Wave 1: 3x3 Enemy Board
                    units: [{ type: 'melee_minion', count: 2 }],
                    placements: [{ type: 'melee_minion', r: 0, c: 1 }] // Test Fixed Placement: Top-Center
                },
                {
                    enemyRows: 3,
                    units: [{ type: 'melee_minion', count: 3 }]
                },
                {
                    enemyRows: 4, // Wave 3: 3x4 Enemy Board
                    units: [{ type: 'melee_minion', count: 2 }, { type: 'ranged_minion', count: 1 }]
                }
            ]
        },
        // Old Levels (Legacy Support - defaulting to 4x4 if missing configs, handled in game.js)
        {
            id: 2, name: "Lvl 2", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 3 }] },
                { enemyRows: 4, units: [{ type: 'ranged_minion', count: 2 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 2 }, { type: 'ranged_minion', count: 2 }] }
            ]
        },
        {
            id: 3, name: "Lvl 3", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 4 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 2 }, { type: 'ranged_minion', count: 2 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }] }
            ]
        },
        {
            id: 4, name: "Lvl 4", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 3 }, { type: 'ranged_minion', count: 3 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 4 }, { type: 'aoe_minion', count: 1 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 2 }, { type: 'aoe_minion', count: 1 }] }
            ]
        },
        {
            id: 5, name: "Lvl 5 (BOSS)", type: 'boss', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'boss_1', count: 1 }] }
            ]
        },

        // World 2: Dark Cave
        {
            id: 6, name: "Lvl 6", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 4 }] },
                { enemyRows: 4, units: [{ type: 'ranged_minion', count: 4 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 3 }, { type: 'ranged_minion', count: 3 }] }
            ]
        },
        {
            id: 7, name: "Lvl 7", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 4 }, { type: 'ranged_minion', count: 2 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 6 }] }
            ]
        },
        {
            id: 8, name: "Lvl 8", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 3 }, { type: 'ranged_minion', count: 3 }, { type: 'aoe_minion', count: 1 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }, { type: 'aoe_minion', count: 2 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 3 }, { type: 'aoe_minion', count: 2 }] }
            ]
        },
        {
            id: 9, name: "Lvl 9", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }, { type: 'aoe_minion', count: 1 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 4 }, { type: 'aoe_minion', count: 1 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 8 }] }
            ]
        },
        {
            id: 10, name: "Lvl 10 (BOSS)", type: 'boss', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'boss_2', count: 1 }] }
            ]
        },

        // World 3: Castle (Assuming 4x4 default if fields missing, but adding here for consistency)
        {
            id: 11, name: "Lvl 11", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 2 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 6 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 7 }] }
            ]
        },
        {
            id: 12, name: "Lvl 12", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 4 }, { type: 'ranged_minion', count: 3 }, { type: 'aoe_minion', count: 2 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 6 }, { type: 'ranged_minion', count: 2 }, { type: 'aoe_minion', count: 2 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 8 }] }
            ]
        },
        {
            id: 13, name: "Lvl 13", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 2 }, { type: 'aoe_minion', count: 3 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 6 }, { type: 'ranged_minion', count: 3 }, { type: 'aoe_minion', count: 3 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 8 }, { type: 'ranged_minion', count: 4 }] }
            ]
        },
        {
            id: 14, name: "Lvl 14", type: 'normal', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 6 }, { type: 'aoe_minion', count: 3 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 5 }, { type: 'ranged_minion', count: 4 }, { type: 'aoe_minion', count: 4 }] },
                { enemyRows: 4, units: [{ type: 'melee_minion', count: 10 }] }
            ]
        },
        {
            id: 15, name: "Lvl 15 (FINAL)", type: 'boss', cols: 4, playerRows: 4, waves: [
                { enemyRows: 4, units: [{ type: 'boss_1', count: 1 }, { type: 'boss_2', count: 1 }] }
            ]
        }
    ]
};
