# 功能开发路线图 (Development Roadmap)

> **文档说明**：本路线图旨在规划从当前“纯关卡战斗 Demo”向“完整养成 Loop 游戏”转型的开发顺序。
> **核心原则**：优先构建数据底层，再实现外围系统，最后扩展内容。

## Phase 1: 数据底层与核心循环重构 (Foundation & Meta-Loop)
**目标**：建立玩家账户体系，实现游戏数据的持久化存储（不再是只存关卡进度），并打通“战斗结算 -> 资源获取”的闭环。

### 1.1 玩家账户与持久化 (Player Account & Persistence)
*   **重构 `Persistence.js`**：
    *   从单一的 `maxLevel` 存储扩展为完整的 `SaveData` 结构。
    *   包含：`playerId`, `level` (账号等级), `exp`, `createTime`, `playTime`。
    *   包含：`resources` (Gold, Gem, UpgradeMaterials)。
*   **实现登录/注册模拟**：
    *   检测本地存储，若无则创建新存档（模拟注册）。
    *   加载存档（模拟登录）。
    *   **里程碑**：游戏启动时能读取到玩家的 ID 和金币数量。

### 1.2 资源与经济系统 (Economy System)
*   **货币定义**：
    *   `Gold`：基础货币，用于常规升级。
    *   `Gem`：高级货币（预留）。
    *   `Materials`：升级材料（如“卷轴”、“徽章”）。
*   **结算流程打通**：
    *   修改 `BattleScene` 的胜利结算逻辑。
    *   胜利后根据关卡配置掉落 Gold/Exp。
    *   更新 `SaveData` 并保存。

## Phase 2: 养成与配置系统 (Progression & Configuration)
**目标**：实现“单位养成”和“自定义卡组”，让玩家的数值成长能在战斗中体现。

### 2.1 单位养成系统 (Unit Meta Structure)
*   **数据结构改造**：
    *   从读取 `config.js` 静态数据 -> 转为读取 `SaveData.units` 动态数据。
    *   每个单位实例包含：`level`, `count` (当前拥有数量/最大携带量), `upgradeCost`。
*   **升级逻辑**：
    *   消耗 Gold/Material 提升单位 Level。
    *   Level 影响 `HP`, `ATK`, `DEF` (需建立数值成长公式，如 `Base * 1.1^Lvl`)。
    *   **UI 实现**：主界面增加“兵营”入口，查看和升级单位。

### 2.2 卡组构建系统 (Deck Building)
*   **卡组数据结构**：
    *   不再默认给予 `config.js` 中的固定卡组。
    *   `SaveData.deck` 存储当前选中的 4 个 UnitId。
*   **战斗加载逻辑**：
    *   `BattleScene` 初始化时，读取 `SaveData.deck` 和 `SaveData.units` 中的属性（数量、数值）来生成单位。
*   **UI 实现**：
    *   卡组编辑界面：从已拥有单位中选择 4 个上阵。

## Phase 3: 引导与激励系统 (Guidance & Incentives)
**目标**：通过任务和引导，留存玩家并建立短期目标。

### 3.1 任务系统 (Task System)
*   **任务结构**：
    *   `DailyTasks` (每日刷新) & `MainTasks` (成就/主线)。
    *   触发器：`BattleWin`, `KillEnemies`, `UpgradeUnit`。
*   **任务管理器**：
    *   在游戏行为发生时（如战斗结束），抛出事件更新任务进度。
    *   **UI 实现**：任务列表，领取奖励（增加 Gold/Exp）。

### 3.2 账号成长 (Account Progression)
*   **账号升级**：
    *   累积 Exp 提升 Account Level。
    *   升级奖励（如：解锁新兵种、增加体力上限等 - 需预留设计）。

## Phase 4: 战斗深度与内容扩展 (Combat Depth & Content)
**目标**：丰富核心玩法，增加策略维度。

### 4.1 战斗道具系统 (Battle Items)
*   **道具逻辑**：
    *   新增 `Item` 类（非 Unit）。
    *   **使用方式**：点击道具 -> 拖拽/点击目标区域。
    *   **效果实现**：
        *   `Potion`：恢复选定单位 HP。
        *   `Spell`：对选定 3x3 区域造成伤害。
*   **库存管理**：
    *   关卡前配置携带道具。
    *   战斗中消耗库存。

### 4.2 更多内容 (Content Expansion)
*   **新敌人**：
    *   `Turret`（炮台）：不移动，固定攻击范围内单位。
    *   `Wall`（围墙）：高血量，无攻击，阻挡弹道/移动。
    *   `New Boss`：引入阶段转换机制（HP < 50% 变身）。
*   **特殊关卡**：
    *   `Challenge Mode`：限定卡组、限时、特殊地形。

---

## 建议执行顺序
1.  **Phase 1** (1-2 天)：先把存读档和金币跑通，这是所有系统的基础。
2.  **Phase 2** (3-4 天)：完成核心的养成循环，让“刷关卡”变得有意义。
3.  **Phase 3** (2-3 天)：增加任务，完善外围体验。
4.  **Phase 4** (长期)：持续迭代新的战斗内容。
