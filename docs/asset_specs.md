# 资源规格说明书

## 1. 棋盘 (Board)
基于 `gridSize: 70px`, `gridGap: 0px`。

| 规格 | 像素尺寸 (宽 x 高) | 备注 |
| :--- | :--- | :--- |
| **3x3** | 210 x 210 px | Level 1 Player / Enemy Wave |
| **3x4** | 210 x 280 px | Level 1 Enemy Boss Wave |
| **4x4** | 280 x 280 px | Standard |

**主题色值**:
- **Player (Blue)**: Light `#AED6F1`, Dark `#5DADE2` (Textured tiles recommended)
- **Enemy (Red)**: Light `#F5B7B1`, Dark `#E74C3C`

## 2. 单位 (Units)
单位格大小为 70x70 px。建议资源尺寸为 **64x64 px** 或 **128x128 px** (Retina)。

| 单位类型 | 建议尺寸 | 文件名 (示例) |
| :--- | :--- | :--- |
| Warrior | 64x64 | warrior.png |
| Archer | 64x64 | archer.png |
| Mage | 64x64 | mage.png |
| Knight | 64x64 | Knight.png |
| Enemy Minions | 64x64 | enemy_melee.png |
| Bosses | 140x140 | boss_1.png (2x2 grid) |

## 3. 弹道/特效 (Projectiles)
弹道资源应为指向 **右侧 (Right, 0 degrees)** 的图片，游戏内会根据目标方向旋转。

| 资源 | 建议尺寸 | 描述 |
| :--- | :--- | :--- |
| **Archer Arrow** | **40 x 14 px** | 箭矢，箭头朝右 |
| Mage Ball | 32 x 32 px | 魔法球/光弹 |
| Spear | 50 x 10 px | 长矛 |

> **注意**: 弹道图片的中心点 (Origin 0.5, 0.5) 将对齐弹道轨迹。请确保图片居中。
