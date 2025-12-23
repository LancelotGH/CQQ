// ==========================================
// TEXTURE GENERATOR
// ==========================================
class TextureGenerator {
    static generateTextures(scene) {
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

        // 1. Grid Tile (Themed)
        const generateTile = (key, color) => {
            if (scene.textures.exists(key)) return;
            graphics.clear();
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, GAME_CONFIG.gridSize, GAME_CONFIG.gridSize);
            graphics.generateTexture(key, GAME_CONFIG.gridSize, GAME_CONFIG.gridSize);
        };

        // Player Theme (Blue)
        generateTile('tile_player_light', GAME_CONFIG.colors.boardThemes.player.light);
        generateTile('tile_player_dark', GAME_CONFIG.colors.boardThemes.player.dark);

        // Enemy Theme (Red)
        generateTile('tile_enemy_light', GAME_CONFIG.colors.boardThemes.enemy.light);
        generateTile('tile_enemy_dark', GAME_CONFIG.colors.boardThemes.enemy.dark);

        // 2. Units & Icons Placeholder (Procedural Fallback if image missing)
        const drawBox = (key, color, label, size = GAME_CONFIG.gridSize) => {
            if (scene.textures.exists(key)) return;
            graphics.clear();
            graphics.fillStyle(0x000000, 0.3); graphics.fillEllipse(size / 2, size - 5, size * 0.8, size * 0.3);
            graphics.fillStyle(color, 1);
            const unitSize = size * 0.85; const offset = (size - unitSize) / 2;
            graphics.fillRoundedRect(offset, offset, unitSize, unitSize, 10);
            graphics.lineStyle(3, 0xffffff, 0.8); graphics.strokeRoundedRect(offset, offset, unitSize, unitSize, 10);
            graphics.generateTexture(key, size, size);
        };
        drawBox('proc_warrior', GAME_CONFIG.colors.player.warrior, 'W');
        drawBox('proc_archer', GAME_CONFIG.colors.player.archer, 'A');
        drawBox('proc_mage', GAME_CONFIG.colors.player.mage, 'M');
        drawBox('proc_knight', GAME_CONFIG.colors.player.knight, 'K');

        drawBox('proc_melee_minion', GAME_CONFIG.colors.enemy.minion, 'G'); // Goblin
        drawBox('proc_ranged_minion', GAME_CONFIG.colors.enemy.ranged, 'S'); // Spear
        drawBox('proc_aoe_minion', GAME_CONFIG.colors.enemy.aoe, 'W');    // Warlock (AoE)

        drawBox('proc_boss_1', GAME_CONFIG.colors.enemy.boss, 'B', GAME_CONFIG.gridSize * 1.8);
        drawBox('proc_boss_2', GAME_CONFIG.colors.enemy.boss, 'B', GAME_CONFIG.gridSize * 1.8);

        // 3. UI Icons
        if (!scene.textures.exists('icon_restart')) {
            graphics.clear(); graphics.lineStyle(3, 0xffffff, 1); graphics.beginPath(); graphics.arc(20, 20, 10, 0, Math.PI * 1.5); graphics.strokePath(); graphics.lineTo(20, 10); graphics.generateTexture('icon_restart', 40, 40);
        }
        if (!scene.textures.exists('icon_exit')) {
            graphics.clear(); graphics.lineStyle(3, 0xffffff, 1); graphics.moveTo(10, 10); graphics.lineTo(30, 30); graphics.moveTo(30, 10); graphics.lineTo(10, 30); graphics.strokePath(); graphics.generateTexture('icon_exit', 40, 40);
        }
        // 4. Projectiles (Procedural) - Fallback if asset missing
        // Arrow
        if (!scene.textures.exists('proj_arrow') || scene.textures.get('proj_arrow').key === '__MISSING') {
            if (scene.textures.exists('proj_arrow')) scene.textures.remove('proj_arrow');
            graphics.clear();
            graphics.fillStyle(0x8e44ad, 0);
            graphics.lineStyle(2, 0x8b4513, 1); graphics.lineBetween(0, 5, 20, 5);
            graphics.fillStyle(0x95a5a6, 1); graphics.fillTriangle(20, 1, 20, 9, 28, 5);
            graphics.lineStyle(2, 0xffffff, 1); graphics.lineBetween(2, 5, -3, 2); graphics.lineBetween(2, 5, -3, 8);
            graphics.generateTexture('proj_arrow', 30, 10);
        }
        // Magic Orb
        if (!scene.textures.exists('proj_magic') || scene.textures.get('proj_magic').key === '__MISSING') {
            if (scene.textures.exists('proj_magic')) scene.textures.remove('proj_magic');
            graphics.clear();
            graphics.fillStyle(0x9b59b6, 1); graphics.fillCircle(10, 10, 8);
            graphics.lineStyle(2, 0xdc7633, 1); graphics.strokeCircle(10, 10, 8);
            graphics.generateTexture('proj_magic', 20, 20);
        }
        // Spear
        if (!scene.textures.exists('proj_spear') || scene.textures.get('proj_spear').key === '__MISSING') {
            if (scene.textures.exists('proj_spear')) scene.textures.remove('proj_spear');
            graphics.clear();
            graphics.lineStyle(2, 0x8b4513, 1); graphics.lineBetween(0, 5, 25, 5);
            graphics.fillStyle(0x7f8c8d, 1); graphics.fillTriangle(25, 2, 25, 8, 35, 5);
            graphics.generateTexture('proj_spear', 40, 10);
        }
    }

    static getUnitTextureKey(scene, type) {
        const assetKey = type + '_tex';
        const procKey = 'proc_' + type;
        if (scene.textures.exists(assetKey)) {
            const tex = scene.textures.get(assetKey);
            if (tex.key !== '__MISSING' && tex.source[0].width > 1) return assetKey;
        }
        return procKey;
    }
}
