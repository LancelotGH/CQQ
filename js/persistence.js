class Persistence {
    static get KEY() { return 'clash_quest_save_v1'; }

    static saveProgress(level, deckCount) {
        const data = {
            level: level,
            maxLevelToCheck: Math.max(level, this.getMaxLevel()),
            lastPlayed: Date.now()
        };
        localStorage.setItem(this.KEY, JSON.stringify(data));
        console.log("Progress saved:", data);
    }

    static loadProgress() {
        const str = localStorage.getItem(this.KEY);
        if (str) {
            return JSON.parse(str);
        }
        return { level: 1, maxLevelToCheck: 1 };
    }

    static getMaxLevel() {
        const data = this.loadProgress();
        return data.maxLevelToCheck || 1;
    }

    static resetProgress() {
        localStorage.removeItem(this.KEY);
    }
}
