/**
 * Clash Quest Clone - Main Logic
 * Depends on: config.js, persistence.js
 */

// ==========================================
// GAME SCENES
// ==========================================
// TextureGenerator, Units, and LevelSelectScene 
// have been moved to separate files.


class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    create(data) {
        TextureGenerator.generateTextures(this);
        const levelId = data.level || 1;
        this.levelConfig = GAME_CONFIG.levels.find(l => l.id === levelId);

        this.waveIndex = 0;
        this.turn = 'PLAYER';
        this.isBusy = false;
        this.enemiesDefeated = 0;
        this.gameIsOver = false;

        this.deck = {
            warrior: 12,
            archer: 10,
            mage: 8
        };

        this.createHUD();

        this.drawGridBackground(GAME_CONFIG.enemyGridTop, 4, 4);
        this.drawGridBackground(GAME_CONFIG.playerGridTop, 4, 4);

        this.playerGrid = Array(4).fill(null).map(() => Array(4).fill(null));
        this.enemyGrid = Array(4).fill(null).map(() => Array(4).fill(null));

        this.spawnInitialUnits();

        this.input.on('gameobjectdown', this.handleInput, this);
    }

    getDeckCount() {
        return this.deck.warrior + this.deck.archer + this.deck.mage;
    }

    createHUD() {
        this.add.rectangle(0, 0, GAME_CONFIG.width, 60, 0x000000, 0.5).setOrigin(0);
        this.titleText = this.add.text(20, 20, `${this.levelConfig.name}`, { fontSize: '20px', fontStyle: 'bold' });
        this.waveText = this.add.text(GAME_CONFIG.width - 20, 20, `Wave 1/${this.levelConfig.waves.length}`, { fontSize: '20px', align: 'right' }).setOrigin(1, 0);

        this.statsText = this.add.text(GAME_CONFIG.width / 2, 20, `Kills: 0`, { fontSize: '20px', color: '#f1c40f' }).setOrigin(0.5, 0);

        const deckHeight = 80;
        const bottomY = GAME_CONFIG.height - deckHeight;
        this.add.rectangle(0, bottomY, GAME_CONFIG.width, deckHeight, 0x000000, 0.8).setOrigin(0);

        this.createDeckIcon(40, bottomY + 40, 'warrior');
        this.createDeckIcon(110, bottomY + 40, 'archer');
        this.createDeckIcon(180, bottomY + 40, 'mage');

        this.createIconButton(GAME_CONFIG.width - 100, bottomY + 40, 'icon_restart', 0xe67e22, () => this.scene.restart({ level: this.levelConfig.id }));
        this.createIconButton(GAME_CONFIG.width - 40, bottomY + 40, 'icon_exit', 0xc0392b, () => this.scene.start('LevelSelectScene'));
    }

    createDeckIcon(x, y, type) {
        const key = TextureGenerator.getUnitTextureKey(this, type);
        const icon = this.add.image(x, y, key).setDisplaySize(30, 30);
        const countText = this.add.text(x + 20, y, `${this.deck[type]}`, { fontSize: '18px' }).setOrigin(0, 0.5);
        this['txt_' + type] = countText;
    }

    createIconButton(x, y, key, color, callback) {
        const btn = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 50, 50, color, 1).setInteractive();
        const icon = this.add.image(0, 0, key).setDisplaySize(30, 30);
        btn.add([bg, icon]);

        bg.on('pointerdown', callback);
        bg.on('pointerover', () => bg.setAlpha(0.8));
        bg.on('pointerout', () => bg.setAlpha(1));
    }

    updateStats() {
        this.statsText.setText(`Kills: ${this.enemiesDefeated}`);
        this.txt_warrior.setText(this.deck.warrior);
        this.txt_archer.setText(this.deck.archer);
        this.txt_mage.setText(this.deck.mage);
    }

    drawGridBackground(startY, rows, cols) {
        const startX = (GAME_CONFIG.width - (cols * GAME_CONFIG.gridSize + (cols - 1) * GAME_CONFIG.gridGap)) / 2 + GAME_CONFIG.gridSize / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
                const y = startY + r * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);

                const isLight = (r + c) % 2 === 0;
                const key = isLight ? 'tile_light' : 'tile_dark';
                this.add.image(x, y, key).setOrigin(0.5).setDepth(-10);
            }
        }
    }

    spawnInitialUnits() {
        for (let r = 0; r < 4; r++) { for (let c = 0; c < 4; c++) { this.spawnPlayerUnit(c, r); } }
        this.spawnWave(0);
    }

    spawnWave(waveIdx) {
        this.enemyGrid.flat().forEach(u => { if (u) u.destroy(); });
        this.enemyGrid = Array(4).fill(null).map(() => Array(4).fill(null));

        const waveConfig = this.levelConfig.waves[waveIdx];
        if (!waveConfig) return;

        this.waveText.setText(`Wave ${waveIdx + 1}/${this.levelConfig.waves.length}`);

        let unitsToSpawn = [];
        waveConfig.forEach(entry => {
            for (let i = 0; i < entry.count; i++) unitsToSpawn.push(entry.type);
        });

        unitsToSpawn.forEach(type => {
            const emptySpots = [];
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (!this.enemyGrid[r][c]) {
                        if (type.includes('boss')) {
                            if (r < 3 && c < 3 && !this.enemyGrid[r][c + 1] && !this.enemyGrid[r + 1][c] && !this.enemyGrid[r + 1][c + 1]) {
                                emptySpots.push({ r, c });
                            }
                        } else {
                            emptySpots.push({ r, c });
                        }
                    }
                }
            }

            if (emptySpots.length > 0) {
                const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
                if (type.includes('boss')) {
                    const boss = new BossUnit(this, type);
                    this.addEnemyUnit(boss, spot.c, spot.r);
                } else {
                    const unit = new EnemyUnit(this, spot.c, spot.r, type);
                    this.addEnemyUnit(unit, spot.c, spot.r);
                }
            }
        });
    }

    spawnPlayerUnit(col, row) {
        const available = Object.keys(this.deck).filter(k => this.deck[k] > 0);
        if (available.length === 0) return null;

        const type = this.getSmartUnitType(col, row, available);
        const unit = new PlayerUnit(this, col, row, type);
        this.playerGrid[row][col] = unit;
        return unit;
    }

    addEnemyUnit(unit, col, row) {
        if (unit.type.includes('boss')) {
            this.enemyGrid[row][col] = unit;
            this.enemyGrid[row][col + 1] = unit;
            this.enemyGrid[row + 1][col] = unit;
            this.enemyGrid[row + 1][col + 1] = unit;
        } else {
            this.enemyGrid[row][col] = unit;
        }
    }

    handleInput(pointer, gameObject) {
        if (this.turn !== 'PLAYER' || this.isBusy || this.gameIsOver) return;

        if (gameObject instanceof PlayerUnit && !gameObject.isDead) {
            this.executePlayerCombo(gameObject);
        }
    }

    async executePlayerCombo(unit) {
        this.isBusy = true;

        let chain = this.findConnectedUnits(unit);
        // Cap chain at 5 max
        if (chain.length > 5) chain = chain.slice(0, 5);

        this.highlightChain(chain);
        await this.wait(400);
        this.clearHighlight();

        // Sequential Attack Logic: Left->Right, Top->Bottom
        chain.sort((a, b) => {
            if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;
            return a.gridCol - b.gridCol;
        });

        for (const u of chain) {
            if (u.isDead) continue;

            // Dynamic Targeting per unit
            const targets = this.findTargetsFor(u);

            if (targets.length > 0) {
                const primary = targets[0];
                let unitsToHit = [primary];

                // Mage AoE Logic (2x2)
                if (u.type === 'mage') {
                    // Get Neighboring cells relative to Primary Target: Right, Bottom, Bottom-Right? 
                    // Or "Range Circle". Usually "Target + Right + Top + TopRight" or "Bottom-Right"?
                    // Let's assume 2x2 anchored top-left at target (i.e., Target, Right, Bottom, BottomRight).
                    // However, enemy grid coords are [row][col].
                    // Let's use the primary target as the Top-Left of the 2x2 box.

                    const r = primary.gridRow;
                    const c = primary.gridCol;
                    const offsets = [
                        { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }
                    ];
                    offsets.forEach(off => {
                        const nR = r + off.r;
                        const nC = c + off.c;
                        if (nR < 4 && nC < 4 && this.enemyGrid[nR][nC] && !this.enemyGrid[nR][nC].isDead) {
                            if (!unitsToHit.includes(this.enemyGrid[nR][nC])) {
                                unitsToHit.push(this.enemyGrid[nR][nC]);
                            }
                        }
                    });
                }

                // Animation
                await this.animateAttack(u, primary, u.type === 'mage'); // Pass isMage flag

                // Damage
                unitsToHit.forEach(target => {
                    if (target && !target.isDead) {
                        target.takeDamage(u.atk);
                        if (target.hp <= 0 && !target.countedDefeat) {
                            target.countedDefeat = true;
                            this.enemiesDefeated++;
                            this.updateStats();
                        }
                    }
                });
            } else {
                // No target found, just vanish
                await this.animateVanish(u);
            }

            // Remove Unit
            this.playerGrid[u.gridRow][u.gridCol] = null;
            u.die();

            await this.wait(150);
        }

        await this.wait(300);
        await this.refillPlayerGrid();

        // Check Victory / Wave
        const livingEnemies = this.enemyGrid.flat().filter(u => u && !u.isDead);
        if (livingEnemies.length === 0) {
            this.waveIndex++;
            if (this.waveIndex < this.levelConfig.waves.length) {
                const txt = this.add.text(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, "WAVE CLEARED", { fontSize: '40px', color: '#f1c40f', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(200);
                await this.wait(1000);
                txt.destroy();
                this.spawnWave(this.waveIndex);
                this.turn = 'PLAYER';
                this.isBusy = false;
                return;
            } else {
                Persistence.saveProgress(this.levelConfig.id + 1, this.getDeckCount());
                this.add.text(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, "VICTORY!", { fontSize: '64px', color: '#f1c40f', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(200);
                await this.wait(2000);
                this.scene.start('LevelSelectScene');
                return;
            }
        }

        if (this.checkGameOver()) return;

        this.endPlayerTurn();
    }

    animateAttack(u, target, isMage = false) {
        return new Promise(resolve => {
            const isMelee = (u.type === 'warrior');

            if (isMelee) {
                const targetY = target ? target.y + GAME_CONFIG.gridSize * 0.5 : GAME_CONFIG.enemyGridTop;
                this.tweens.add({
                    targets: u,
                    y: targetY,
                    duration: 250,
                    ease: 'Power2',
                    onComplete: resolve
                });
            } else {
                // Ranged Projectile
                let projKey = 'proj_arrow';
                if (u.type === 'mage' || u.type === 'aoe_minion') projKey = 'proj_magic';
                if (u.type === 'ranged_minion') projKey = 'proj_spear';

                const startX = u.x;
                const startY = u.y;
                const endX = target ? target.x : (u.isPlayer ? u.x : u.x);
                const endY = target ? target.y : (u.isPlayer ? -50 : GAME_CONFIG.height + 50);

                const proj = this.add.image(startX, startY, projKey);
                proj.setDepth(100);

                // Rotate towards target
                const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
                proj.setRotation(angle);

                this.tweens.add({
                    targets: proj,
                    x: endX,
                    y: endY,
                    duration: 300,
                    ease: 'Linear',
                    onComplete: () => {
                        proj.destroy();
                        if (isMage && target) {
                            // AoE Effect Visuals
                            const cx = target.x + (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap) / 2;
                            const cy = target.y + (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap) / 2;
                            const radius = GAME_CONFIG.gridSize * 1.2;

                            const circle = this.add.circle(cx, cy, radius).setStrokeStyle(4, 0x9b59b6).setDepth(100);
                            this.tweens.add({
                                targets: circle,
                                alpha: 0,
                                scale: 1.2,
                                duration: 400,
                                onComplete: () => { circle.destroy(); resolve(); }
                            });
                        } else {
                            resolve();
                        }
                    }
                });
            }
        });
    }

    animateVanish(u) {
        return new Promise(resolve => {
            this.tweens.add({
                targets: u,
                alpha: 0,
                duration: 200,
                onComplete: resolve
            });
        });
    }

    findConnectedUnits(startUnit) {
        const visited = new Set();
        const stack = [startUnit];
        const result = [];
        const type = startUnit.type;

        while (stack.length > 0) {
            const current = stack.pop();
            if (visited.has(current)) continue;
            visited.add(current);
            result.push(current);

            const neighbors = [
                { r: current.gridRow - 1, c: current.gridCol },
                { r: current.gridRow + 1, c: current.gridCol },
                { r: current.gridRow, c: current.gridCol - 1 },
                { r: current.gridRow, c: current.gridCol + 1 }
            ];

            for (const n of neighbors) {
                if (n.r >= 0 && n.r < 4 && n.c >= 0 && n.c < 4) {
                    const neighborUnit = this.playerGrid[n.r][n.c];
                    if (neighborUnit && neighborUnit.type === type && !visited.has(neighborUnit) && !neighborUnit.isDead) {
                        stack.push(neighborUnit);
                    }
                }
            }
        }
        return result;
    }

    findTargetsFor(unit) {
        if (unit.isPlayer) {
            // -- PLAYER LOGIC --
            const enemies = this.enemyGrid.flat().filter(e => e && !e.isDead);
            if (enemies.length === 0) return [];

            // Mage: Closest
            if (unit.type === 'mage') {
                enemies.sort((a, b) => {
                    const dA = Phaser.Math.Distance.Between(unit.x, unit.y, a.x, a.y);
                    const dB = Phaser.Math.Distance.Between(unit.x, unit.y, b.x, b.y);
                    return dA - dB;
                });
                return [enemies[0]];
            }

            // Warrior/Archer: Column
            const checkCol = (col) => {
                if (col < 0 || col >= 4) return null;
                for (let r = 3; r >= 0; r--) {
                    const enemy = this.enemyGrid[r][col];
                    if (enemy && !enemy.isDead) return enemy;
                }
                return null;
            };

            let target = checkCol(unit.gridCol);
            if (target) return [target];

            const leftTarget = checkCol(unit.gridCol - 1);
            const rightTarget = checkCol(unit.gridCol + 1);

            let candidates = [];
            if (leftTarget) candidates.push(leftTarget);
            if (rightTarget) candidates.push(rightTarget);

            if (candidates.length > 0) {
                candidates.sort((a, b) => b.gridRow - a.gridRow);
                return [candidates[0]];
            }
            return [];
        } else {
            // -- ENEMY LOGIC (Mirroring Player Rules) --
            const players = this.playerGrid.flat().filter(p => p && !p.isDead);
            if (players.length === 0) return [];

            // AoE Minion (Warlock): Closest
            if (unit.type === 'aoe_minion') {
                players.sort((a, b) => {
                    const dA = Phaser.Math.Distance.Between(unit.x, unit.y, a.x, a.y);
                    const dB = Phaser.Math.Distance.Between(unit.x, unit.y, b.x, b.y);
                    return dA - dB;
                });
                return [players[0]];
            }

            // Normal Minions: Column (Front-most first, so Row 0 upwards)
            const checkCol = (col) => {
                if (col < 0 || col >= 4) return null;
                for (let r = 0; r < 4; r++) { // Check from Top (0) to Bottom (3)
                    const p = this.playerGrid[r][col];
                    if (p && !p.isDead) return p;
                }
                return null;
            };

            let target = checkCol(unit.gridCol);
            if (target) return [target];

            // Neighbors
            const leftTarget = checkCol(unit.gridCol - 1);
            const rightTarget = checkCol(unit.gridCol + 1);
            let candidates = [];
            if (leftTarget) candidates.push(leftTarget);
            if (rightTarget) candidates.push(rightTarget);

            if (candidates.length > 0) {
                candidates.sort((a, b) => a.gridRow - b.gridRow); // Ascending Row (0 is closest to enemy)
                return [candidates[0]];
            }

            // Fallback: Closest
            players.sort((a, b) => {
                const dA = Phaser.Math.Distance.Between(unit.x, unit.y, a.x, a.y);
                const dB = Phaser.Math.Distance.Between(unit.x, unit.y, b.x, b.y);
                return dA - dB;
            });
            return [players[0]];
        }
    }

    highlightChain(chain) {
        chain.forEach(u => u.sprite.setTint(0xffff00));
    }

    clearHighlight() {
        this.playerGrid.flat().forEach(u => { if (u) u.sprite.clearTint(); });
    }

    async refillPlayerGrid() {
        for (let c = 0; c < 4; c++) {
            const colUnits = [];
            for (let r = 0; r < 4; r++) {
                if (this.playerGrid[r][c] && !this.playerGrid[r][c].isDead) {
                    colUnits.push(this.playerGrid[r][c]);
                }
            }
            for (let r = 0; r < 4; r++) { this.playerGrid[r][c] = null; }
            for (let r = 0; r < colUnits.length; r++) {
                const u = colUnits[r];
                this.playerGrid[r][c] = u;
                u.gridRow = r;
                this.tweens.add({ targets: u, y: GAME_CONFIG.playerGridTop + r * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap), duration: 200 });
            }

            for (let r = colUnits.length; r < 4; r++) {
                if (this.getDeckCount() > 0) {
                    const available = Object.keys(this.deck).filter(k => this.deck[k] > 0);
                    if (available.length > 0) {
                        // Smart Spawn: Avoid creating chains > 5 if possible
                        const type = this.getSmartUnitType(c, r, available);

                        this.deck[type]--;
                        this.updateStats();

                        const unit = new PlayerUnit(this, c, r, type);
                        this.playerGrid[r][c] = unit;
                        unit.alpha = 0;
                        this.tweens.add({ targets: unit, alpha: 1, duration: 300 });
                    }
                }
            }
        }
        await this.wait(400);
    }

    getSmartUnitType(col, row, availableTypes) {
        Phaser.Utils.Array.Shuffle(availableTypes);

        for (const type of availableTypes) {
            const mockUnit = { gridCol: col, gridRow: row, type: type, isDead: false, isPlayer: true }; // Added isPlayer for findTargetsFor
            this.playerGrid[row][col] = mockUnit;
            const chain = this.findConnectedUnits(mockUnit);
            this.playerGrid[row][col] = null;
            if (chain.length <= 5) return type;
        }
        return availableTypes[0];
    }

    endPlayerTurn() {
        this.turn = 'ENEMY';
        this.time.delayedCall(500, this.processEnemyTurn, [], this);
    }

    async processEnemyTurn() {
        if (this.gameIsOver) return;

        const boss = this.enemyGrid.flat().find(u => u && u.type.includes('boss') && !u.isDead);
        if (boss) await this.processBossTurn(boss);

        const attackers = this.enemyGrid.flat().filter(u => u && !u.isDead && !u.type.includes('boss'));

        if (attackers.length > 0) {
            // 50% chance to attack is too low now that we have smart AI. Let's make it 80% to keep pressure.
            if (Math.random() < 0.8) {
                const attacker = attackers[Math.floor(Math.random() * attackers.length)];
                const targets = this.findTargetsFor(attacker);

                if (targets.length > 0) {
                    const target = targets[0];

                    // AoE Logic
                    if (attacker.type === 'aoe_minion') {
                        // 2x2 Area Center on Target
                        const r = target.gridRow;
                        const c = target.gridCol;
                        // Target + Right + Bottom + Bottom Right
                        const offsets = [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }];

                        let unitsToHit = [target];
                        offsets.forEach(off => {
                            const nR = r + off.r;
                            const nC = c + off.c;
                            if (nR < 4 && nC < 4 && this.playerGrid[nR][nC] && !this.playerGrid[nR][nC].isDead) {
                                if (!unitsToHit.includes(this.playerGrid[nR][nC])) {
                                    unitsToHit.push(this.playerGrid[nR][nC]);
                                }
                            }
                        });

                        // Visual Warning Circle
                        const cx = target.x + (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap) / 2;
                        const cy = target.y + (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap) / 2;
                        const radius = GAME_CONFIG.gridSize * 1.2;

                        const warning = this.add.circle(cx, cy, radius, 0x546e7a, 0.4).setDepth(100);
                        this.tweens.add({ targets: warning, alpha: 0, scale: 1.1, duration: 800, onComplete: () => warning.destroy() });
                        await this.wait(800);

                        // Animate & Damage
                        this.tweens.add({
                            targets: attacker.sprite,
                            scale: 1.3,
                            yoyo: true,
                            duration: 150
                        });

                        unitsToHit.forEach(u => {
                            if (u && !u.isDead) { // Ensure unit is still valid and alive
                                u.takeDamage(attacker.atk);
                            }
                        });

                    } else {
                        // Normal Single Target
                        const warning = this.add.rectangle(target.x, target.y, GAME_CONFIG.gridSize, GAME_CONFIG.gridSize, 0xff0000, 0.3);
                        await this.wait(500);
                        warning.destroy();

                        const startX = attacker.x;
                        const startY = attacker.y;

                        // Jump Animation
                        this.tweens.add({
                            targets: attacker,
                            x: target.x,
                            y: target.y - 40,
                            duration: 300,
                            yoyo: true,
                            ease: 'Power2',
                            onYoyo: () => {
                                if (target && !target.isDead) { // Ensure target is still valid and alive
                                    target.takeDamage(attacker.atk);
                                }
                            },
                            onComplete: () => { attacker.x = startX; attacker.y = startY; }
                        });
                        await this.wait(600);
                    }
                }
            }
        }

        // REFILL AFTER ATTACK
        await this.refillPlayerGrid();

        if (this.checkGameOver()) return;

        this.turn = 'PLAYER';
        this.isBusy = false;
    }

    checkGameOver() {
        if (this.gameIsOver) return true;

        const livingPlayers = this.playerGrid.flat().filter(u => u && !u.isDead);
        if (livingPlayers.length === 0 && this.getDeckCount() === 0) {
            this.gameIsOver = true;
            this.add.text(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, "GAME OVER", { fontSize: '64px', color: '#ff0000', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(200);
            this.time.delayedCall(3000, () => { this.scene.start('LevelSelectScene'); });
            return true;
        }
        return false;
    }

    async processBossTurn(boss) {
        if (boss.type === 'boss_1') {
            const moves = [];
            if (boss.gridCol > 0) moves.push(-1);
            if (boss.gridCol < 2) moves.push(1);
            if (moves.length > 0) {
                const dx = moves[Math.floor(Math.random() * moves.length)];
                await this.moveBoss(boss, boss.gridCol + dx, boss.gridRow);
            }
        } else {
            const validCols = [0, 1, 2];
            const validRows = [0, 1, 2];
            const newCol = validCols[Math.floor(Math.random() * validCols.length)];
            const newRow = validRows[Math.floor(Math.random() * validRows.length)];
            await this.moveBoss(boss, newCol, newRow);
        }

        await this.wait(300);

        if (boss.type === 'boss_1') {
            const targetCol = Math.floor(Math.random() * 4);
            const x = (GAME_CONFIG.width - (4 * GAME_CONFIG.gridSize + 3 * GAME_CONFIG.gridGap)) / 2 + GAME_CONFIG.gridSize / 2 + targetCol * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
            const w = GAME_CONFIG.gridSize;
            const h = 4 * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
            const y = GAME_CONFIG.playerGridTop + h / 2 - GAME_CONFIG.gridSize / 2;
            const warning = this.add.rectangle(x, y, w, h, 0xff0000, 0.3);
            await this.wait(800);
            warning.destroy();
            for (let r = 0; r < 4; r++) { const u = this.playerGrid[r][targetCol]; if (u) u.takeDamage(boss.atk); }
        } else {
            const targetCol = Math.floor(Math.random() * 3);
            const targetRow = Math.floor(Math.random() * 3);
            const startX = (GAME_CONFIG.width - (4 * GAME_CONFIG.gridSize + 3 * GAME_CONFIG.gridGap)) / 2 + GAME_CONFIG.gridSize / 2 + targetCol * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
            const startY = GAME_CONFIG.playerGridTop + targetRow * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
            const size = GAME_CONFIG.gridSize * 2 + GAME_CONFIG.gridGap;
            const warning = this.add.rectangle(startX + GAME_CONFIG.gridSize / 2, startY + GAME_CONFIG.gridSize / 2, size, size, 0xff0000, 0.3);
            await this.wait(800);
            warning.destroy();
            for (let r = targetRow; r <= targetRow + 1; r++) { for (let c = targetCol; c <= targetCol + 1; c++) { const u = this.playerGrid[r][c]; if (u) u.takeDamage(boss.atk); } }
        }
    }

    async moveBoss(boss, newCol, newRow) {
        this.enemyGrid[boss.gridRow][boss.gridCol] = null;
        this.enemyGrid[boss.gridRow][boss.gridCol + 1] = null;
        this.enemyGrid[boss.gridRow + 1][boss.gridCol] = null;
        this.enemyGrid[boss.gridRow + 1][boss.gridCol + 1] = null;
        boss.gridCol = newCol;
        boss.gridRow = newRow;
        this.enemyGrid[newRow][newCol] = boss;
        this.enemyGrid[newRow][newCol + 1] = boss;
        this.enemyGrid[newRow + 1][newCol] = boss;
        this.enemyGrid[newRow + 1][newCol + 1] = boss;
        boss.updatePosition();
    }

    wait(ms) { return new Promise(resolve => this.time.delayedCall(ms, resolve)); }
}

const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    scale: {
        mode: GAME_CONFIG.scaleMode,
        autoCenter: GAME_CONFIG.autoCenter
    },
    parent: 'game-container',
    backgroundColor: GAME_CONFIG.colors.uiBg,
    scene: [LevelSelectScene, BattleScene]
};

const game = new Phaser.Game(config);
