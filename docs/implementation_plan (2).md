# Clash Quest Prototype Implementation Plan

## Goal Description
Develop a web-based "Clash Quest" tactical strategy game prototype using Phaser 3. The game involves a player grid of units fighting against an enemy grid, with mechanic-specific units, bosses, and a turn-based combat system.

## Proposed Changes

### Core Files

#### [NEW] [index.html](file:///c:/Users/Lancelot/Documents/Gemini_CQQ/index.html)
- HTML5 boilerplate with Phaser 3 loaded via CDN.
- Basic centering CSS for the game canvas.

#### [NEW] [game.js](file:///c:/Users/Lancelot/Documents/Gemini_CQQ/game.js)
- **Configuration**: `GAME_CONFIG` object for all game stats (HP, damage, grid size).
- **Asset System**: `TextureGenerator` class to procedurally generate pixel art placeholders if assets are missing.
- **Game Objects**:
    - `Unit` (Base class)
    - `PlayerUnit` subclasses: `Warrior`, `Archer`, `Mage`.
    - `EnemyUnit` subclasses: `MeleeMinion`, `RangedMinion`.
    - `BossUnit`: 
        - **Boss 1**: Moves horizontally (Col 0-1, 1-2, 2-3). Attacks random Column.
        - **Boss 2**: Moves to random 2x2 pos. Attacks 2x2 Area.
        - **Highlighting**: Visual markers for attack zones.
- **Layout & UI**:
    - **Optimization**: Reduce tile size (e.g., 80px -> 65px) to create visible gap between Player and Enemy grids.
    - **Top UI**: Display Wave/Level Info.
    - **Bottom UI**: Display Deck/Reserves count.
- **Combat Logic**:
    - **Chain/Combo**: When clicking a unit, find all connected same-type units (Flood Fill). All attack together.
    - **Mage**: Target + Neighbors (AoE).
    - **Minions**: Charge animation for melee.
- **Visual Feedback**:
    - **Pre-attack Markers**: Show lines/boxes for targets BEFORE attack confirms.
        - Single: Red outline on target.
        - Boss 1: Red overlay on Column.
        - Boss 2: Red overlay on 2x2 Area.
        - Implement AoE damage logic for Enemy Warlock.

## Asset Integration (Partial)
- **Player Units**: Generated Sprite Sheet (`assets/player_units.png`). Integrated via `Unit` class.
- **Enemy Units**: Rate Limit reached. Using procedural colors/icons for now.
- **Loading**: Assets preloaded in `LevelSelectScene`.

## Verification Plan

### Automated Tests
- None (Prototype phase).

### Manual Verification
1.  **Load Game**: Open `index.html` in browser.
2.  **Level Select**: Verify vertical scrolling and clicking a level starts battle.
3.  **Battle Rendering**:
    - Check 4x4 player grid and 4x4 enemy grid (with Boss taking 2x2).
    - Verify fallback texture generation (should see pixel art blocks).
4.  **Combat Logic**:
    - Click player unit -> Verify attack animation/effect -> Unit vanishes -> Grid refills upwards.
    - End Turn -> Enemy Boss moves -> Shows red pre-attack zone -> Attacks -> Player units take damage/die.
## Refactoring & UI Overhaul

### 1. Structure Changes
- **Directory Structure**:
    - `index.html` (Entry)
    - `js/game.js` (Logic)
    - `js/config.js` (Data: Levels, Units, Costs)
    - `js/persistence.js` (Save/Load)
    - `assets/` (Placeholder for future assets)

### 2. Configuration Data (`js/config.js`)
- Move `GAME_CONFIG` to this file.
- Add `HighScores` or `Progress` schema.

### 3. Persistence (`js/persistence.js`)
- `saveProgress(levelId, score)`
- `loadProgress()`
- `resetProgress()`
- Use `localStorage` for web compatibility.

### 4. UI Enhancements
- **Scale Manager**: Set `mode: Phaser.Scale.FIT`, `autoCenter: Phaser.Scale.CENTER_BOTH` to ensure full visibility on all screens.
- **Deck UI**: Replace simple text with a Container showing icons + counts (e.g., `[Sword] x5  [Bow] x3`).
- **HUD Buttons**:
    - [Restart]: Reloads current scene.
    - [Exit]: Returns to Level Select.
- **Stats**: Add text `Enemies Defeated: X`.

### 6. Logic & Config Updates
- **Config**:
    - Update `GAME_CONFIG` with `def` stats.
    - Define 15 Levels.
    - Structure:
      ```json
      levels: [
        { id: 1, type: 'normal', waves: [
            [{ type: 'melee_minion', count: 2 }, { type: 'ranged_minion', count: 1 }],
            [{ type: 'melee_minion', count: 3 }],
            [{ type: 'melee_minion', count: 2 }, { type: 'ranged_minion', count: 2 }]
          ] 
        },
        { id: 5, type: 'boss', waves: [ [{ type: 'boss_1', count: 1 }] ] }
      ]
      ```
    - Reduce `playerGridTop` (e.g., 420) to close gap.

- **Game Logic**:
    - **Damage**: `Math.max(1, attacker.atk - target.def)`.
    - **Wave System**:
        - Track `currentWaveIndex`.
        - `spawnNextWave()`: Clears grid (if needed) or adds to it? -> Clash Quest style: usually waves are distinct stages.
        - **Decision**: For this prototype, we'll keep the "Refill Enemy" style but strictly controlled by Wave config. When all enemies in a wave die, spawn next wave.
    - **Deck**:
        - Initialize deck with specific counts (e.g., `{ warrior: 10, archer: 8, mage: 5 }`).
        - Track and Display these counts in UI.

- **UI**:
    - **Deck**: Row of 3 icons (Warrior, Archer, Mage) with text below/beside.
    - **Buttons**: Use `TextureGenerator` to create "Restart" (Refresh icon) and "Exit" (Door/X icon).

### 7. Gameplay Optimizations (Round 2)
- **Chain Limit**:
  - `findConnectedUnits`: Cap result array at 5 units.
- **Sequential Attack**:
  - **Sorting**: Sort chain units by Row then Column (Top-Left first).
  - **Loop**: async for loop over chain.
    - Unit finds target (dynamic check, `!isDead`).
    - Animate Attack.
    - Deal Damage.
    - **Remove Unit** immediately (or mark dead/vanish).
    - `wait()` small delay.
    - Next unit finds target (previous target might be dead now).
- **Mage Targeting**:
  - Filter live enemies.
  - Calculate distance (Manhattan or Euclidean? Grid steps likely better).
  - Sort by distance asc.
  - Pick random from closest group.
- **Game Over**:
  - Check at start of Player Turn? Or End of Enemy Turn?
  - Condition: `playerGrid` empty AND `deck` empty AND `enemyGrid` has living units.
  - Show "DEFEAT" text.
