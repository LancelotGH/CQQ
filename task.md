# Tasks

- [ ] Project Initialization <!-- id: 0 -->
    - [x] Create `task.md` (This file) <!-- id: 1 -->
    - [x] Create `implementation_plan.md` <!-- id: 2 -->
- [/] Implementation <!-- id: 3 -->
    - [x] Create `index.html` with Phaser 3 CDN and CSS <!-- id: 4 -->
    - [x] Create `game.js` structure and `GAME_CONFIG` <!-- id: 5 -->
    - [x] Implement `TextureGenerator` <!-- id: 6 -->
    - [x] Implement Base `Unit` class and Player Units <!-- id: 7 -->
    - [x] Implement `EnemyUnit` and `BossUnit` (2x2 logic) <!-- id: 8 -->
    - [x] Implement `LevelSelectScene` <!-- id: 9 -->
    - [x] Implement `BattleScene` (Grid, Turns, Spawning) <!-- id: 10 -->
    - [x] Implement `BattleScene` (Grid, Turns, Spawning) <!-- id: 10 -->
    - [x] Implement Combat Logic (Attack, Refill, Boss Moves) <!-- id: 11 -->
- [x] Requirements Refinement <!-- id: 15 -->
    - [x] Optimize Layout: Checkerboard Grid & Spacing (Gap between Enemy/Player) <!-- id: 20 -->
    - [x] Implement UI: Wave Info (Top) & Deck Count (Bottom) <!-- id: 21 -->
    - [x] Implement Core: Chain/Combo Mechanic (Flood Fill & Multi-Attack) <!-- id: 22 -->
    - [x] Implement Visuals: Detailed Pre-attack Markers (Target Lines, Area Boxes) <!-- id: 23 -->
    - [x] Implement Boss 1 (Col-Smasher) Movement & Column Attack <!-- id: 16 -->
    - [x] Implement Boss 2 (Area-Crusher) Movement & 2x2 Attack <!-- id: 17 -->
    - [x] Implement Mage AoE Attack <!-- id: 18 -->
    - [x] Implement Enemy Minion Charge Animations <!-- id: 19 -->
- [x] **Debugging & Polish**
    - [x] Fix click responsiveness (Added setInteractive)
    - [x] Fix Grid Refill Gaps (Rewrote refill algo)
    - [x] Fix Crash on Unit Death (Safety checks for zombie units)

- [x] **Game Polish & Logic Update**
    - [x] **Layout**: Reduce spacing between Enemy and Player grids (`js/config.js`)
    - [x] **UI**: Graphical Buttons (Restart/Exit) & Improved Layout
    - [x] **UI**: Detailed Deck Display (Icons + Specific Counts)
    - [x] **Config**: Implement 15 Levels (Waves, Monster Types, specific counts)
        - Normal: 3 Waves, No Boss
        - Boss: 1 Wave, Solo Boss
    - [x] **Logic**: Add `DEF` stat and update Damage Formula (`Max(1, Atk - Def)`)
    - [x] **Logic**: Implement Wave System in `BattleScene`

- [x] **Visual Polish & Animation Fixes**
    - [x] **Bug**: Fix "WAVE CLEARED" text not disappearing
    - [x] **Bug**: Fix Enemy Layering (Should be on top of units/grid)
    - [x] **Animation**: Implement Melee Unit Charge behavior (Move to target/edge)
    - [x] **Visuals**: Update Grid to "Chessboard" style (High contrast tokens)

- [x] **Gameplay One-Off Optimizations**
    - [x] **Logic**: Limit Chain size to max 5 units
    - [x] **Combat**: Sequential Attack (Left-to-Right, Top-to-Bottom). Independent targeting per unit.
    - [x] **Combat**: Update Mage Targeting (Closest first, then random)
    - [x] **Logic**: Implement "Game Over" condition (No Units + Empty Deck + Enemies Alive)

- [x] **Combat Logic Refinement**
    - [x] **Archer**: Target Front-most in Col. If empty, check Col +/- 1 (Front-most).
    - [x] **Mage**: Attack 2x2 Area (Primary Target + Right/Top/Top-Right).
    - [x] **Mage**: Show visual "Range Circle" for 2x2 attacks.


- [x] **Spawn Logic Optimization**
    - [x] **Smart Spawn**: Prevent creating chains > 5 during refill/initial spawn.
    - [x] **Refill**: Integrate smart spawn into `refillPlayerGrid`.

- [x] **Game Flow Refinement**
    - [x] **Logic**: Auto-return to Level Select after "Game Over".
    - [x] **Logic**: Trigger `refillPlayerGrid` after Enemy Turn (fill gaps from kills).

- [x] **Enemy AoE & Visual Updates**
    - [x] **Config**: Add `aoe_minion` (Stats & distinct Color).
    - [x] **Visuals**: Update Enemy Colors to be distinct from Player.
    - [x] **Logic**: Implement AoE Enemy behavior (Closest Target + 2x2 Area).
    - [x] **Docs**: Provide Asset Size/Specs to user.
    - [x] **Assets**: Generate Player Units (Warrior/Archer/Mage).
    - [x] **Assets**: Generate Enemy Units (Goblin/Spear/Warlock/Boss).

- [x] **Asset Refactoring (Individual Files)**
    - [x] **Assets**: Generate/Split Warrior, Archer, Mage, Goblin, Spear, Warlock, Boss as separate PNGs.
    - [x] **Code**: Refactor `game.js` to load individual assets.
    - [x] **UI**: Ensure Deck Icons use the same unit textures.

- [x] **Projectiles & Config Refactor**
    - [x] **Config**: Move asset paths to `GAME_CONFIG` in `config.js`.
    - [x] **Assets**: Generate Projectiles (Arrow, Magic Orb) -> *Reverted to Code Layout*.
    - [x] **Logic**: Update `game.js` to load assets from config.
    - [x] **Logic**: Implement Projectile animation (Tween from Source->Target) in `animateAttack`.
    - [x] **Refactor**: Switch Projectiles to Procedural Graphics (User Request).

- [x] **Codebase Refactoring (Modularization)**
    - [x] **New Files**: Create `js/textureGenerator.js`, `js/units.js`, `js/levelSelectScene.js`.
    - [x] **Extract**: Move respective classes from `game.js`.
    - [x] **Update**: Add new scripts to `index.html`.
    - [x] **Cleanup**: Remove moved code from `game.js`.

- [x] Verification <!-- id: 12 -->

- [x] Verification <!-- id: 12 -->
    - [x] Open in browser to verify loading and basic mechanics <!-- id: 13 -->
    - [x] Capture screenshot of gameplay <!-- id: 14 -->

- [x] Verification <!-- id: 12 -->
    - [x] Open in browser to verify loading and basic mechanics <!-- id: 13 -->
    - [x] Capture screenshot of gameplay <!-- id: 14 -->
