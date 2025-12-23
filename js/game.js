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

        // -- DYNAMIC GRID CONFIG --
        this.cols = this.levelConfig.cols || 4;
        this.playerRows = this.levelConfig.playerRows || 4;
        this.enemyRows = 4; // Will be set per wave

        this.waveIndex = 0;
        this.turn = 'PLAYER';
        this.isBusy = false;
        this.enemiesDefeated = 0;
        this.gameIsOver = false;

        this.deck = {
            warrior: 12,
            archer: 10,
            mage: 8,
            knight: 8
        };

        this.createHUD();

        // -- LAYOUT CALCULATION --
        // Anchor at boardMeetingY.
        // Player grows Downwards from meeting point + half gap
        // Enemy grows Upwards from meeting point - half gap
        const halfGap = (GAME_CONFIG.boardGap !== undefined ? GAME_CONFIG.boardGap : 0) / 2;
        this.playerGridTop = GAME_CONFIG.boardMeetingY + halfGap;

        // Initial Enemy Top (will be updated in spawnWave)
        this.enemyGridTop = GAME_CONFIG.boardMeetingY - halfGap - (4 * GAME_CONFIG.gridSize);

        // Initial render (Player Grid is static per level)
        this.drawGridBackground('player', this.playerGridTop, this.playerRows, this.cols);

        // Initialize Grids
        this.playerGrid = Array(this.playerRows).fill(null).map(() => Array(this.cols).fill(null));
        this.enemyGrid = []; // Initialized in spawnWave

        this.spawnInitialUnits();

        this.input.on('gameobjectdown', this.handleInput, this);
    }

    getDeckCount() {
        return Object.values(this.deck).reduce((a, b) => a + b, 0);
    }

    createHUD() {
        this.add.rectangle(0, 0, GAME_CONFIG.width, 60, 0x000000, 0.5).setOrigin(0);
        this.titleText = this.add.text(20, 20, `${this.levelConfig.name}`, { fontSize: '20px', fontStyle: 'bold' });
        this.waveText = this.add.text(GAME_CONFIG.width - 20, 20, `Wave 1/${this.levelConfig.waves.length}`, { fontSize: '20px', align: 'right' }).setOrigin(1, 0);

        this.statsText = this.add.text(GAME_CONFIG.width / 2, 20, `Kills: 0`, { fontSize: '20px', color: '#f1c40f' }).setOrigin(0.5, 0);

        const deckHeight = 80;
        const bottomY = GAME_CONFIG.height - deckHeight;
        this.add.rectangle(0, bottomY, GAME_CONFIG.width, deckHeight, 0x000000, 0.8).setOrigin(0);

        let xPos = 40;
        Object.keys(this.deck).forEach(type => {
            if (this.deck[type] > 0 || true) { // Show all keys defined in deck
                this.createDeckIcon(xPos, bottomY + 40, type);
                xPos += 70;
            }
        });

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

    drawGridBackground(theme, startY, rows, cols) {
        // If re-drawing (e.g. enemy grid resize), we should probably clear old tiles first?
        // Since we don't track them easily, let's assume this is only called when needed or on top (optimization later if needed)
        // Actually, for dynamic enemy grid, we might need a container or clear mechanism. 
        // For now, let's just clear if it's the Enemy Grid.
        if (theme === 'enemy') {
            if (this.enemyBgGroup) this.enemyBgGroup.destroy(true);
            this.enemyBgGroup = this.add.group();
        }

        const fullWidth = cols * GAME_CONFIG.gridSize + (cols - 1) * GAME_CONFIG.gridGap;
        const startX = (GAME_CONFIG.width - fullWidth) / 2 + GAME_CONFIG.gridSize / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
                // Fix: Add half grid size because startY is Top Edge, but tile origin is 0.5 (Center)
                const y = startY + r * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap) + GAME_CONFIG.gridSize / 2;

                const isLight = (r + c) % 2 === 0;
                // Theme: 'player' or 'enemy' -> tile_player_light / tile_enemy_dark
                const key = `tile_${theme}_${isLight ? 'light' : 'dark'}`;

                const tile = this.add.image(x, y, key).setOrigin(0.5).setDepth(-10);
                if (theme === 'enemy' && this.enemyBgGroup) {
                    this.enemyBgGroup.add(tile);
                }
            }
        }
    }

    spawnInitialUnits() {
        for (let r = 0; r < this.playerRows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.spawnPlayerUnit(c, r);
            }
        }
        this.spawnWave(0);
    }

    spawnWave(waveIdx) {
        // Clear existing enemies
        this.enemyGrid.flat().forEach(u => { if (u) u.destroy(); });

        const waveConfig = this.levelConfig.waves[waveIdx];
        if (!waveConfig) return;

        this.waveText.setText(`Wave ${waveIdx + 1}/${this.levelConfig.waves.length}`);

        // -- DYNAMIC ENEMY GRID SIZING --
        const newEnemyRows = waveConfig.enemyRows || 4;

        // Calculate new Top based on Meeting Point
        const halfGap = (GAME_CONFIG.boardGap !== undefined ? GAME_CONFIG.boardGap : 0) / 2;
        const newEnemyGridTop = GAME_CONFIG.boardMeetingY - halfGap - (newEnemyRows * GAME_CONFIG.gridSize);

        // Redraw only if changed (or always to be safe/simple for now)
        if (this.enemyRows !== newEnemyRows || this.enemyGridTop !== newEnemyGridTop || waveIdx === 0) {
            this.enemyRows = newEnemyRows;
            this.enemyGridTop = newEnemyGridTop;
            this.drawGridBackground('enemy', this.enemyGridTop, this.enemyRows, this.cols);
        }

        this.enemyGrid = Array(this.enemyRows).fill(null).map(() => Array(this.cols).fill(null));

        // -- PLACEMENT LOGIC --
        // 1. Process Fixed Placements
        if (waveConfig.placements) {
            waveConfig.placements.forEach(p => {
                if (p.r < this.enemyRows && p.c < this.cols) {
                    if (p.type.includes('boss')) {
                        const boss = new BossUnit(this, p.type);
                        this.addEnemyUnit(boss, p.c, p.r);
                    } else {
                        const unit = new EnemyUnit(this, p.c, p.r, p.type);
                        this.addEnemyUnit(unit, p.c, p.r);
                    }
                }
            });
        }

        // 2. Process Random Units
        if (waveConfig.units) {
            let unitsToSpawn = [];
            waveConfig.units.forEach(entry => {
                for (let i = 0; i < entry.count; i++) unitsToSpawn.push(entry.type);
            });

            unitsToSpawn.forEach(type => {
                const emptySpots = [];
                for (let r = 0; r < this.enemyRows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        if (!this.enemyGrid[r][c]) {
                            if (type.includes('boss')) {
                                // Boss needs 2x2 space
                                if (r < this.enemyRows - 1 && c < this.cols - 1 &&
                                    !this.enemyGrid[r][c + 1] &&
                                    !this.enemyGrid[r + 1][c] &&
                                    !this.enemyGrid[r + 1][c + 1]) {
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

        // Unified Combo Bonus: All units get bonus based on total chain length
        // 2 units -> +20%, 3 units -> +40%, etc.
        const damageMod = 1 + ((chain.length - 1) * 0.2);

        for (const u of chain) {
            if (u.isDead) continue;

            // Dynamic Targeting per unit
            const targets = this.findTargetsFor(u);

            if (targets.length > 0) {
                const primary = targets[0];
                let unitsToHit = [primary];

                // Mage AoE Logic (2x2)
                if (u.type === 'mage') {
                    // Logic: Base Point = Target
                    // Area: Target + Right + Bottom + Bottom-Right
                    const { startR, startC } = this.getAoEClampedOrigin(primary);

                    const offsets = [
                        { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }
                    ];
                    offsets.forEach(off => {
                        const nR = startR + off.r;
                        const nC = startC + off.c;
                        // Strict check: Must be in Enemy Grid
                        if (nR < this.enemyRows && nC < this.cols && this.enemyGrid[nR][nC] && !this.enemyGrid[nR][nC].isDead) {
                            if (!unitsToHit.includes(this.enemyGrid[nR][nC])) {
                                unitsToHit.push(this.enemyGrid[nR][nC]);
                            }
                        }
                    });
                }

                // Knight Logic (Piercing)
                if (u.type === 'knight') {
                    if (primary.gridRow > 0) {
                        const behind = this.enemyGrid[primary.gridRow - 1][primary.gridCol];
                        if (behind && !behind.isDead && !unitsToHit.includes(behind)) {
                            unitsToHit.push(behind);
                        }
                    }
                }

                // Animation
                if (u.type === 'knight') {
                    await this.animateCharge(u, primary.y + GAME_CONFIG.gridSize * 0.5);
                } else {
                    if (u.type === 'mage') {
                        await this.showAoEWarning(primary, 0x9b59b6);
                    }
                    await this.animateAttack(u, primary, u.type === 'mage');
                }

                // Damage
                unitsToHit.forEach(target => {
                    if (target && !target.isDead) {
                        let finalDamage = Math.floor(u.atk * damageMod);

                        // Knight Pierce Reduction
                        if (u.type === 'knight' && target !== primary) {
                            finalDamage = Math.floor(finalDamage * 0.5);
                            this.showFloatingText(target.x, target.y - 60, "Pierce!", 0xbdc3c7);
                        }

                        target.takeDamage(finalDamage);
                        if (target.hp <= 0 && !target.countedDefeat) {
                            target.countedDefeat = true;
                            this.enemiesDefeated++;
                            this.updateStats();
                        }
                    }
                });

                if (damageMod > 1) {
                    this.showFloatingText(u.x, u.y - 40, `x${damageMod.toFixed(1)}!`, 0xf1c40f);
                }

            } else {
                // No target found
                if (u.type === 'knight') {
                    // Fix: Stop at top of enemy board (don't go out of bounds)
                    await this.animateCharge(u, this.enemyGridTop + GAME_CONFIG.gridSize * 0.5);
                    u.die();
                } else {
                    u.die(); // Consume unused unit
                }
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
                const targetY = target ? target.y + GAME_CONFIG.gridSize * 0.5 : this.enemyGridTop;
                this.tweens.add({
                    targets: u,
                    y: targetY,
                    duration: 250,
                    ease: 'Power2',
                    onComplete: resolve
                });
            } else {
                // Ranged Projectile
                let projKey = 'proj_arrow'; // Default generated/loaded
                if (u.type === 'archer') projKey = 'proj_arrow'; // Use asset
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
                            // AoE Effect Visuals (Aligned with Clamped Grid)
                            const { startR, startC, isEnemyTarget } = this.getAoEClampedOrigin(target);

                            // Re-calculate visual position for center of 2x2 block
                            const gridTop = isEnemyTarget ? this.enemyGridTop : this.playerGridTop;
                            const fullWidth = this.cols * GAME_CONFIG.gridSize + (this.cols - 1) * GAME_CONFIG.gridGap;
                            const startXBase = (GAME_CONFIG.width - fullWidth) / 2 + GAME_CONFIG.gridSize / 2;

                            // Top-Left Cell Center
                            const tlX = startXBase + startC * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
                            // Fix: Use correct Y origin (Center is already offset in my recent fix, so be careful).
                            // Wait, helper grid drawing uses: gridTop + r*stride + size/2
                            // So tlY (center of top-left unit) = gridTop + startR*stride + size/2
                            const stride = GAME_CONFIG.gridSize + GAME_CONFIG.gridGap;
                            const tlY = gridTop + startR * stride + GAME_CONFIG.gridSize / 2;

                            // Center of 2x2 is (tlX + half_stride, tlY + half_stride)
                            const cx = tlX + stride / 2;
                            const cy = tlY + stride / 2;
                            const radius = GAME_CONFIG.gridSize * 1.5;

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

    animateCharge(u, targetY) {
        return new Promise(resolve => {
            const startY = u.y;
            // 1. Wind up
            this.tweens.add({
                targets: u,
                y: startY + 20,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    // 2. Charge
                    this.tweens.add({
                        targets: u,
                        y: targetY,
                        duration: 150, // Fast
                        ease: 'Back.easeOut', // Impact feel
                        onComplete: resolve
                    });
                }
            });
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
                if (n.r >= 0 && n.r < this.playerRows && n.c >= 0 && n.c < this.cols) {
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

            // Knight: Strict Same Column
            if (unit.type === 'knight') {
                const checkCol = (col) => {
                    if (col < 0 || col >= this.cols) return null;
                    // Check from Bottom (enemyRows-1) to Top (0)
                    for (let r = this.enemyRows - 1; r >= 0; r--) {
                        const enemy = this.enemyGrid[r][col];
                        if (enemy && !enemy.isDead) return enemy;
                    }
                    return null;
                };
                const target = checkCol(unit.gridCol);
                return target ? [target] : [];
            }

            // Warrior/Archer: Column
            const checkCol = (col) => {
                if (col < 0 || col >= this.cols) return null;
                // Check from Bottom (enemyRows-1) to Top (0)
                for (let r = this.enemyRows - 1; r >= 0; r--) {
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
                // Should prioritize Front-most? Usually enemies are top-down. Player is bottom-up.
                // Warriors hit front-most enemy (largest row index? No, Enemy 0 is Top. Enemy MAX is Bottom/Front)
                // Wait, "Front line" for player is looking up. 
                // Enemy Grid: 0 is Top (Back), MAX is Bottom (Front facing player).
                // So yes, we want Max Row (closest to player).
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
                if (col < 0 || col >= this.cols) return null;
                // Check from Top (0) to Bottom (playerRows-1)
                for (let r = 0; r < this.playerRows; r++) {
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
        for (let c = 0; c < this.cols; c++) {
            const colUnits = [];
            for (let r = 0; r < this.playerRows; r++) {
                if (this.playerGrid[r][c] && !this.playerGrid[r][c].isDead) {
                    colUnits.push(this.playerGrid[r][c]);
                }
            }
            for (let r = 0; r < this.playerRows; r++) { this.playerGrid[r][c] = null; }
            for (let r = 0; r < colUnits.length; r++) {
                const u = colUnits[r];
                this.playerGrid[r][c] = u;
                u.gridRow = r;
                // Fix: Add half size to center in cell
                this.tweens.add({ targets: u, y: this.playerGridTop + r * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap) + GAME_CONFIG.gridSize / 2, duration: 200 });
            }

            for (let r = colUnits.length; r < this.playerRows; r++) {
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
                        // 2x2 Area Center on Target (Base Point)
                        // Fix: Clamp to ensure 2x2 area is always valid within Player Grid
                        const startR = Math.min(target.gridRow, Math.max(0, this.playerRows - 2));
                        const startC = Math.min(target.gridCol, Math.max(0, this.cols - 2));

                        const offsets = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }];
                        let unitsToHit = []; // Re-calc from scratch based on area

                        // Add units in 2x2
                        offsets.forEach(off => {
                            const nR = startR + off.r;
                            const nC = startC + off.c;
                            // Strict check: Must be in Player Grid
                            if (nR < this.playerRows && nC < this.cols && this.playerGrid[nR][nC] && !this.playerGrid[nR][nC].isDead) {
                                if (!unitsToHit.includes(this.playerGrid[nR][nC])) {
                                    unitsToHit.push(this.playerGrid[nR][nC]);
                                }
                            }
                        });

                        // Visual Warning (2x2 Grid)
                        await this.showAoEWarning(target, 0x546e7a);

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
            if (boss.gridCol < this.cols - 2) moves.push(1); // Width 2 units
            if (moves.length > 0) {
                const dx = moves[Math.floor(Math.random() * moves.length)];
                await this.moveBoss(boss, boss.gridCol + dx, boss.gridRow);
            }
        } else {
            // Boss 2 Teleport
            // Calculate valid spots (Width 2, Height 2)
            const validCols = [];
            for (let c = 0; c <= this.cols - 2; c++) validCols.push(c);

            const validRows = [];
            for (let r = 0; r <= this.enemyRows - 2; r++) validRows.push(r);

            if (validCols.length > 0 && validRows.length > 0) {
                const newCol = validCols[Math.floor(Math.random() * validCols.length)];
                const newRow = validRows[Math.floor(Math.random() * validRows.length)];
                await this.moveBoss(boss, newCol, newRow);
            }
        }

        await this.wait(300);

        if (boss.type === 'boss_1') {
            // Fix: Attack one of the two columns in front of the boss
            // Boss occupies gridCol and gridCol + 1
            const offset = Math.random() < 0.5 ? 0 : 1;
            const targetCol = boss.gridCol + offset;

            // Calculate X for visual warning (Column center)
            const fullWidth = this.cols * GAME_CONFIG.gridSize + (this.cols - 1) * GAME_CONFIG.gridGap;
            const startX = (GAME_CONFIG.width - fullWidth) / 2 + GAME_CONFIG.gridSize / 2;
            const x = startX + targetCol * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);

            const w = GAME_CONFIG.gridSize;
            const h = this.playerRows * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
            // Fix: Center of warning is Top + Half Height. Removed erroneous - gridSize/2
            const y = this.playerGridTop + h / 2;

            const warning = this.add.rectangle(x, y, w, h, 0xff0000, 0.3);
            await this.wait(800);
            warning.destroy();
            for (let r = 0; r < this.playerRows; r++) { const u = this.playerGrid[r][targetCol]; if (u) u.takeDamage(boss.atk); }
        } else {
            // Area Crusher (2x2)
            const maxCol = this.cols - 2;
            const maxRow = this.playerRows - 2;

            if (maxCol >= 0 && maxRow >= 0) {
                const targetCol = Math.floor(Math.random() * (maxCol + 1));
                const targetRow = Math.floor(Math.random() * (maxRow + 1));

                const fullWidth = this.cols * GAME_CONFIG.gridSize + (this.cols - 1) * GAME_CONFIG.gridGap;
                const startXBase = (GAME_CONFIG.width - fullWidth) / 2 + GAME_CONFIG.gridSize / 2;

                const startX = startXBase + targetCol * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
                const startY = this.playerGridTop + targetRow * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);

                const size = GAME_CONFIG.gridSize * 2 + GAME_CONFIG.gridGap;
                // Rectangle pos is center of the 2x2 area
                // Fix: Center should be startX + size/2, not startX + gridSize/2
                const warning = this.add.rectangle(startX + size / 2, startY + size / 2, size, size, 0xff0000, 0.3);

                await this.wait(800);
                warning.destroy();
                for (let r = targetRow; r <= targetRow + 1; r++) {
                    for (let c = targetCol; c <= targetCol + 1; c++) {
                        const u = this.playerGrid[r][c]; if (u) u.takeDamage(boss.atk);
                    }
                }
            }
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

    showFloatingText(x, y, message, color) {
        const txt = this.add.text(x, y, message, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: typeof color === 'number' ? '#' + color.toString(16) : color,
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: txt,
            y: y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    getAoEClampedOrigin(target) {
        const isEnemyTarget = !target.isPlayer;
        const maxRows = isEnemyTarget ? this.enemyRows : this.playerRows;
        // Clamp to ensure 2x2 area is always valid
        const startR = Math.min(target.gridRow, Math.max(0, maxRows - 2));
        const startC = Math.min(target.gridCol, Math.max(0, this.cols - 2));
        return { startR, startC, isEnemyTarget };
    }

    showAoEWarning(target, color = 0x9b59b6) {
        // 2x2 Area based on target
        // Area: Target + Right + Bottom + Bottom-Right
        const { startR, startC, isEnemyTarget } = this.getAoEClampedOrigin(target);

        const offsets = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }];

        const rects = [];
        const maxRows = isEnemyTarget ? this.enemyRows : this.playerRows;
        const gridTop = isEnemyTarget ? this.enemyGridTop : this.playerGridTop;

        offsets.forEach(off => {
            const nR = startR + off.r;
            const nC = startC + off.c;

            if (nR < maxRows && nC < this.cols) {
                // Draw Rect
                const x = (GAME_CONFIG.width - (this.cols * GAME_CONFIG.gridSize)) / 2 + nC * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
                const y = gridTop + nR * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap) + GAME_CONFIG.gridSize / 2;

                const rect = this.add.rectangle(x + GAME_CONFIG.gridSize / 2, y, GAME_CONFIG.gridSize, GAME_CONFIG.gridSize, color, 0.4).setDepth(150);
                rects.push(rect);
            }
        });

        // Current Target Marker
        const marker = this.add.image(target.x, target.y - 40, 'proj_magic').setTint(color).setDepth(200);
        this.tweens.add({ targets: marker, y: target.y - 50, yoyo: true, duration: 300, repeat: 1 });

        return new Promise(resolve => {
            this.tweens.add({
                targets: rects,
                alpha: 0,
                duration: 800,
                onComplete: () => {
                    rects.forEach(r => r.destroy());
                    marker.destroy();
                    resolve();
                }
            });
        });
    }
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
