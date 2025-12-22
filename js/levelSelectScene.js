// ==========================================
// LEVEL SELECT SCENE
// ==========================================

class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    preload() {
        // Load Player Assets
        Object.keys(GAME_CONFIG.assets.player).forEach(key => {
            this.load.image(key + '_tex', GAME_CONFIG.assets.player[key]);
        });
        // Load Enemy Assets
        Object.keys(GAME_CONFIG.assets.enemy).forEach(key => {
            this.load.image(key + '_tex', GAME_CONFIG.assets.enemy[key]);
        });
        // Load Projectiles
        Object.keys(GAME_CONFIG.assets.projectiles).forEach(key => {
            this.load.image('proj_' + key, GAME_CONFIG.assets.projectiles[key]);
        });
    }

    create() {
        TextureGenerator.generateTextures(this);
        const progress = Persistence.loadProgress();

        this.add.text(GAME_CONFIG.width / 2, 50, 'SELECT LEVEL', { fontSize: '32px' }).setOrigin(0.5);
        const container = this.add.container(0, 0);

        for (let i = 0; i < GAME_CONFIG.levels.length; i++) {
            const levelData = GAME_CONFIG.levels[i];
            const y = 120 + i * 90;
            const levelNum = levelData.id;
            const isLocked = levelNum > progress.maxLevelToCheck;

            const btn = this.add.container(GAME_CONFIG.width / 2, y);
            const color = isLocked ? 0x7f8c8d : 0x34495e;

            const bg = this.add.rectangle(0, 0, 300, 70, color).setInteractive();
            const text = this.add.text(0, 0, isLocked ? `${levelData.name} (Locked)` : levelData.name, {
                fontSize: '24px',
                color: isLocked ? '#95a5a6' : '#ffffff'
            }).setOrigin(0.5);

            btn.add([bg, text]);

            if (!isLocked) {
                bg.on('pointerdown', () => {
                    this.scene.start('BattleScene', { level: levelNum });
                });
                bg.on('pointerover', () => bg.setFillStyle(0x4a6278));
                bg.on('pointerout', () => bg.setFillStyle(color));
            }
            container.add(btn);
        }

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            container.y -= deltaY;
            container.y = Phaser.Math.Clamp(container.y, -1000, 0);
        });
    }
}
