// ==========================================
// GAME CLASSES (Units)
// ==========================================

class Unit extends Phaser.GameObjects.Container {
    constructor(scene, col, row, type, isPlayer) {
        super(scene);
        this.gridCol = col;
        this.gridRow = row;
        this.type = type;
        this.isPlayer = isPlayer;
        this.isDead = false;

        const config = isPlayer ? GAME_CONFIG.units.player[type] : GAME_CONFIG.units.enemy[type];
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.atk = config.atk;
        this.def = config.def || 0;
        this.name = config.name;
        this.range = config.range || 1; // Default range to 1 (melee)
        this.projectileType = config.projectile || null; // e.g., 'arrow', 'fireball'

        // Visuals
        const texKey = TextureGenerator.getUnitTextureKey(scene, type);

        this.sprite = scene.add.image(0, 0, texKey).setOrigin(0.5);

        // Scale adjustment
        let targetSize = GAME_CONFIG.gridSize * 0.85;
        if (type.includes('boss')) targetSize = GAME_CONFIG.gridSize * 1.8;

        this.sprite.setDisplaySize(targetSize, targetSize);

        this.add(this.sprite);

        // HP Bar
        this.hpBar = scene.add.rectangle(0, 30, 40, 6, 0x00ff00);
        this.add(this.hpBar);

        this.updatePosition();

        // Input & Depth
        this.setSize(GAME_CONFIG.gridSize, GAME_CONFIG.gridSize);
        if (isPlayer) {
            this.setInteractive();
        }
        this.setDepth(isPlayer ? 10 : 20);

        scene.add.existing(this);
    }

    updatePosition() {
        const startY = this.isPlayer ? GAME_CONFIG.playerGridTop : GAME_CONFIG.enemyGridTop;
        const gridXOffset = (GAME_CONFIG.width - (4 * GAME_CONFIG.gridSize + 3 * GAME_CONFIG.gridGap)) / 2 + GAME_CONFIG.gridSize / 2;

        this.x = gridXOffset + this.gridCol * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);
        this.y = startY + this.gridRow * (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap);

        if (this.type.includes('boss')) {
            const offset = (GAME_CONFIG.gridSize + GAME_CONFIG.gridGap) / 2;
            this.x += offset;
            this.y += offset;
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        const finalDmg = Math.max(1, amount - this.def);
        this.hp -= finalDmg;

        this.updateHpBar();
        this.showDamageText(finalDmg);

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        } else {
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: 0.5,
                duration: 50,
                yoyo: true,
                repeat: 1
            });
        }
    }

    showDamageText(amount) {
        const txt = this.scene.add.text(this.x, this.y - 40, `-${amount}`, {
            fontSize: '24px',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(100);

        this.scene.tweens.add({
            targets: txt,
            y: txt.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    updateHpBar() {
        const pct = Math.max(0, this.hp / this.maxHp);
        this.hpBar.width = 40 * pct;
        if (this.type.includes('boss')) this.hpBar.width = 80 * pct;

        this.hpBar.fillColor = pct > 0.5 ? 0x00ff00 : (pct > 0.2 ? 0xf1c40f : 0xff0000);
    }

    die() {
        if (!this.scene) return;
        this.isDead = true;
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0,
            duration: 300,
            onComplete: () => {
                this.destroy();
            }
        });
    }
}

class PlayerUnit extends Unit {
    constructor(scene, col, row, type) {
        super(scene, col, row, type, true);
    }
}

class EnemyUnit extends Unit {
    constructor(scene, col, row, type) {
        super(scene, col, row, type, false);
    }
}

class BossUnit extends Unit {
    constructor(scene, type) {
        super(scene, 1, 1, type, false);
        this.occupiedCols = [1, 2];
        this.occupiedRows = [1, 2];
    }
}
