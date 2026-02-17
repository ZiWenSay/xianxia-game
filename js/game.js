// 仙侠放置游戏 - 核心逻辑

const STORAGE_KEY = 'xianxia_game_save';

const REALMS = [
    { name: '练气', maxLevel: 10, spiritRate: 1 },
    { name: '筑基', maxLevel: 10, spiritRate: 5 },
    { name: '金丹', maxLevel: 10, spiritRate: 20 },
    { name: '元婴', maxLevel: 10, spiritRate: 50 },
    { name: '化神', maxLevel: 10, spiritRate: 100 },
    { name: '炼虚', maxLevel: 10, spiritRate: 200 },
    { name: '合体', maxLevel: 10, spiritRate: 500 },
    { name: '大乘', maxLevel: 10, spiritRate: 1000 },
    { name: '渡劫', maxLevel: 10, spiritRate: 2000 },
    { name: '仙人', maxLevel: 1, spiritRate: 5000 }
];

const ELEMENTS = {
    金: { color: '#ffd700', icon: '⚔️' },
    木: { color: '#4ade80', icon: '🌿' },
    水: { color: '#00d4ff', icon: '💧' },
    火: { color: '#ef4444', icon: '🔥' },
    土: { color: '#a97142', icon: '🪨' }
};

const TECHNIQUES = [
    { id: 1, name: '引气诀', type: '辅助', effect: '灵气获取+10%', unlockCost: 0, bonus: { type: 'spiritRate', value: 0.1 } },
    { id: 2, name: '金刚经', type: '防御', effect: '防御+20%', unlockCost: 100, bonus: { type: 'defense', value: 0.2 } },
    { id: 3, name: '烈焰掌', type: '攻击', effect: '攻击+25%', unlockCost: 200, bonus: { type: 'attack', value: 0.25 } },
    { id: 4, name: '水云袖', type: '防御', effect: '生命+30%', unlockCost: 300, bonus: { type: 'hp', value: 0.3 } },
    { id: 5, name: '青木功', type: '辅助', effect: '修炼效率+20%', unlockCost: 500, bonus: { type: 'cultivationRate', value: 0.2 } },
    { id: 6, name: '紫雷诀', type: '攻击', effect: '攻击+40%', unlockCost: 800, bonus: { type: 'attack', value: 0.4 } },
    { id: 7, name: '厚土盾', type: '防御', effect: '防御+35%', unlockCost: 1000, bonus: { type: 'defense', value: 0.35 } },
    { id: 8, name: '九转灵诀', type: '辅助', effect: '灵气获取+30%', unlockCost: 1500, bonus: { type: 'spiritRate', value: 0.3 } },
    { id: 9, name: '天魔功', type: '攻击', effect: '攻击+60%', unlockCost: 2000, bonus: { type: 'attack', value: 0.6 } },
    { id: 10, name: '大道无形', type: '辅助', effect: '全属性+25%', unlockCost: 5000, bonus: { type: 'all', value: 0.25 } }
];

const PET_TYPES = [
    { name: '青蛇', icon: '🐍', attack: 5, defense: 3, hp: 20 },
    { name: '白虎', icon: '🐅', attack: 15, defense: 8, hp: 50 },
    { name: '青龙', icon: '🐉', attack: 30, defense: 15, hp: 100 },
    { name: '朱雀', icon: '🦅', attack: 25, defense: 10, hp: 80 },
    { name: '玄武', icon: '🐢', attack: 10, defense: 25, hp: 150 },
    { name: '麒麟', icon: '🦄', attack: 40, defense: 20, hp: 200 }
];

const BOSSES = [
    { name: '筑基期心魔', hp: 1000, reward: 500 },
    { name: '金丹期雷劫', hp: 5000, reward: 2000 },
    { name: '元婴期天罚', hp: 20000, reward: 8000 },
    { name: '化神期魔劫', hp: 50000, reward: 20000 },
    { name: '炼虚期天人', hp: 100000, reward: 50000 },
    { name: '合体期混沌', hp: 200000, reward: 100000 },
    { name: '大乘期封神', hp: 500000, reward: 300000 },
    { name: '渡劫期天魔', hp: 1000000, reward: 1000000 }
];

class XianxiaGame {
    constructor() {
        this.gameState = this.getDefaultState();
        this.loadGame();
        this.initUI();
        this.startGameLoop();
        this.setupEventListeners();
    }

    getDefaultState() {
        return {
            spirit: 0,
            realm: 0,
            realmLevel: 1,
            cultivation: 0,
            roots: { 金: 1, 木: 1, 水: 1, 火: 1, 土: 1 },
            rootLevel: 1,
            efficiencyLevel: 1,
            techniques: [true, false, false, false, false, false, false, false, false, false],
            artifacts: [],
            equippedArtifacts: { weapon: null, armor: null, accessory: null },
            currentPet: null,
            pets: [],
            sect: {
                name: '未建立',
                level: 0,
                members: 1,
                buildings: { training: 0, herb: 0, forge: 0 }
            },
            boss: {
                current: null,
                hp: 0,
                maxHp: 0,
                nextSpawn: Date.now() + 3600000,
                killed: false
            },
            stats: {
                attack: 10,
                defense: 5,
                hp: 100,
                combatPower: 0
            },
            offlineTime: 0,
            lastSave: Date.now()
        };
    }

    loadGame() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                this.gameState = { ...this.getDefaultState(), ...data };
                
                // 计算离线收益
                const offlineTime = Date.now() - this.gameState.lastSave;
                if (offlineTime > 60000) {
                    const offlineSpirit = Math.floor(offlineTime / 1000 * this.getSpiritRate() * 0.5);
                    this.gameState.spirit += offlineSpirit;
                    this.gameState.offlineTime = offlineTime;
                    this.addLog(`离线收益: +${offlineSpirit} 灵气`);
                }
            }
        } catch (e) {
            console.error('Load game error:', e);
        }
        this.updateStats();
    }

    saveGame() {
        this.gameState.lastSave = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.gameState));
        this.addLog('游戏已保存');
    }

    resetGame() {
        if (confirm('确定要重置游戏吗？所有数据将丢失！')) {
            localStorage.removeItem(STORAGE_KEY);
            this.gameState = this.getDefaultState();
            this.updateUI();
            this.addLog('游戏已重置');
        }
    }

    getSpiritRate() {
        const realm = REALMS[this.gameState.realm];
        let rate = realm.spiritRate * this.gameState.realmLevel;
        
        // 灵根加成
        const rootBonus = Object.values(this.gameState.roots).reduce((a, b) => a + b, 0);
        rate *= (1 + rootBonus * 0.1);
        
        // 功法加成
        TECHNIQUES.forEach((tech, i) => {
            if (this.gameState.techniques[i] && tech.bonus.type === 'spiritRate') {
                rate *= (1 + tech.bonus.value);
            }
        });
        
        // 建筑加成
        rate *= (1 + this.gameState.sect.buildings.herb * 0.1);
        
        return rate;
    }

    getCultivationRate() {
        let rate = 1;
        
        // 灵根等级
        rate *= this.gameState.efficiencyLevel;
        
        // 功法加成
        TECHNIQUES.forEach((tech, i) => {
            if (this.gameState.techniques[i] && tech.bonus.type === 'cultivationRate') {
                rate *= (1 + tech.bonus.value);
            }
        });
        
        // 修炼室加成
        rate *= (1 + this.gameState.sect.buildings.training * 0.2);
        
        return rate;
    }

    getAttack() {
        let attack = 10;
        
        // 境界加成
        attack += this.gameState.realm * 50 + this.gameState.realmLevel * 5;
        
        // 灵根攻击
        attack += (this.gameState.roots['金'] + this.gameState.roots['火']) * 2;
        
        // 功法加成
        TECHNIQUES.forEach((tech, i) => {
            if (this.gameState.techniques[i] && tech.bonus.type === 'attack') {
                attack *= (1 + tech.bonus.value);
            }
        });
        
        // 法宝加成
        Object.values(this.gameState.equippedArtifacts).forEach(art => {
            if (art) attack += art.attack;
        });
        
        // 灵宠加成
        if (this.gameState.currentPet) {
            attack += this.gameState.currentPet.attack;
        }
        
        return Math.floor(attack);
    }

    getDefense() {
        let defense = 5;
        
        defense += this.gameState.realm * 30 + this.gameState.realmLevel * 3;
        
        defense += (this.gameState.roots['土'] + this.gameState.roots['水']) * 2;
        
        TECHNIQUES.forEach((tech, i) => {
            if (this.gameState.techniques[i] && tech.bonus.type === 'defense') {
                defense *= (1 + tech.bonus.value);
            }
        });
        
        Object.values(this.gameState.equippedArtifacts).forEach(art => {
            if (art) defense += art.defense;
        });
        
        if (this.gameState.currentPet) {
            defense += this.gameState.currentPet.defense;
        }
        
        return Math.floor(defense);
    }

    getMaxHp() {
        let hp = 100;
        
        hp += this.gameState.realm * 100 + this.gameState.realmLevel * 10;
        
        hp += (this.gameState.roots['土'] + this.gameState.roots['木']) * 5;
        
        TECHNIQUES.forEach((tech, i) => {
            if (this.gameState.techniques[i] && tech.bonus.type === 'hp') {
                hp *= (1 + tech.bonus.value);
            }
        });
        
        Object.values(this.gameState.equippedArtifacts).forEach(art => {
            if (art) hp += art.hp;
        });
        
        if (this.gameState.currentPet) {
            hp += this.gameState.currentPet.hp;
        }
        
        return Math.floor(hp);
    }

    updateStats() {
        this.gameState.stats.attack = this.getAttack();
        this.gameState.stats.defense = this.getDefense();
        this.gameState.stats.hp = this.getMaxHp();
        this.gameState.stats.combatPower = Math.floor(
            this.gameState.stats.attack * 1.5 + 
            this.gameState.stats.defense + 
            this.gameState.stats.hp * 0.5
        );
    }

    cultivate() {
        const amount = this.getCultivationRate();
        this.gameState.cultivation += amount;
        
        const realm = REALMS[this.gameState.realm];
        const required = Math.floor(100 * Math.pow(1.5, this.gameState.realmLevel));
        
        if (this.gameState.cultivation >= required) {
            this.gameState.cultivation = 0;
            if (this.gameState.realmLevel < realm.maxLevel) {
                this.gameState.realmLevel++;
                this.addLog(`境界突破！${realm.name}第${this.gameState.realmLevel}层`);
            } else if (this.gameState.realm < REALMS.length - 1) {
                this.gameState.realm++;
                this.gameState.realmLevel = 1;
                this.addLog(`境界飞升！进入${REALMS[this.gameState.realm].name}期`);
            }
        }
        
        this.updateUI();
    }

    breakthrough() {
        if (this.gameState.realm >= REALMS.length - 1 && this.gameState.realmLevel >= REALMS[this.gameState.realm].maxLevel) {
            this.addLog('已达最高境界！');
            return;
        }
        
        const cost = Math.floor(1000 * Math.pow(2, this.gameState.realm));
        if (this.gameState.spirit >= cost) {
            this.gameState.spirit -= cost;
            
            // 突破成功率
            let successRate = 0.5 + this.gameState.realmLevel * 0.05;
            if (Math.random() < successRate) {
                this.gameState.cultivation = 0;
                if (this.gameState.realmLevel < REALMS[this.gameState.realm].maxLevel) {
                    this.gameState.realmLevel++;
                } else if (this.gameState.realm < REALMS.length - 1) {
                    this.gameState.realm++;
                    this.gameState.realmLevel = 1;
                    this.addLog(`渡劫成功！进入${REALMS[this.gameState.realm].name}期！`);
                }
            } else {
                this.addLog('渡劫失败！');
            }
            this.updateUI();
        } else {
            this.addLog(`突破需要 ${cost} 灵气`);
        }
    }

    upgradeRoot() {
        const cost = Math.floor(10 * Math.pow(1.5, this.gameState.rootLevel));
        if (this.gameState.spirit >= cost) {
            this.gameState.spirit -= cost;
            this.gameState.rootLevel++;
            
            // 随机提升一个灵根
            const elements = Object.keys(ELEMENTS);
            const randomElement = elements[Math.floor(Math.random() * elements.length)];
            this.gameState.roots[randomElement]++;
            
            this.addLog(`灵根升级！${randomElement}灵根+1`);
            this.updateUI();
        } else {
            this.addLog(`升级需要 ${cost} 灵气`);
        }
    }

    upgradeEfficiency() {
        const cost = Math.floor(50 * Math.pow(1.5, this.gameState.efficiencyLevel));
        if (this.gameState.spirit >= cost) {
            this.gameState.spirit -= cost;
            this.gameState.efficiencyLevel++;
            this.addLog(`修炼效率升级到 Lv.${this.gameState.efficiencyLevel}`);
            this.updateUI();
        } else {
            this.addLog(`升级需要 ${cost} 灵气`);
        }
    }

    learnTechnique(index) {
        const tech = TECHNIQUES[index];
        if (this.gameState.techniques[index]) return;
        
        if (this.gameState.spirit >= tech.unlockCost) {
            this.gameState.spirit -= tech.unlockCost;
            this.gameState.techniques[index] = true;
            this.addLog(`学会功法：${tech.name}`);
            this.updateUI();
        } else {
            this.addLog(`学习 ${tech.name} 需要 ${tech.unlockCost} 灵气`);
        }
    }

    craftArtifact() {
        const cost = 1000;
        if (this.gameState.spirit >= cost) {
            this.gameState.spirit -= cost;
            
            const types = ['weapon', 'armor', 'accessory'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            const quality = Math.floor(Math.random() * 10) + 1;
            const artifact = {
                id: Date.now(),
                type: type,
                name: this.getArtifactName(type, quality),
                quality: quality,
                attack: type === 'weapon' ? quality * 5 : 0,
                defense: type === 'armor' ? quality * 5 : 0,
                hp: type === 'accessory' ? quality * 10 : 0
            };
            
            this.gameState.artifacts.push(artifact);
            this.addLog(`炼制成功：${artifact.name}`);
            this.updateUI();
        } else {
            this.addLog(`炼制需要 ${cost} 灵气`);
        }
    }

    getArtifactName(type, quality) {
        const names = {
            weapon: ['木剑', '铁剑', '银剑', '金剑', '灵剑', '仙剑', '神剑', '天剑', '道剑', '大道剑'],
            armor: ['布衣', '皮甲', '铁甲', '银甲', '金甲', '灵甲', '仙甲', '神甲', '天甲', '大道甲'],
            accessory: ['戒指', '玉佩', '手镯', '项链', '灵环', '仙环', '神环', '天环', '道环', '大道环']
        };
        return names[type][quality - 1] || names[type][0];
    }

    equipArtifact(id) {
        const artifact = this.gameState.artifacts.find(a => a.id === id);
        if (!artifact) return;
        
        // 卸下当前装备
        if (this.gameState.equippedArtifacts[artifact.type]) {
            this.gameState.artifacts.push(this.gameState.equippedArtifacts[artifact.type]);
        }
        
        // 装备新法宝
        this.gameState.equippedArtifacts[artifact.type] = artifact;
        this.gameState.artifacts = this.gameState.artifacts.filter(a => a.id !== id);
        
        this.addLog(`装备 ${artifact.name}`);
        this.updateUI();
    }

    catchPet() {
        const cost = 500;
        if (this.gameState.spirit >= cost) {
            this.gameState.spirit -= cost;
            
            const petType = PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
            const level = Math.floor(Math.random() * 5) + 1;
            
            const pet = {
                id: Date.now(),
                name: petType.name,
                icon: petType.icon,
                level: level,
                attack: petType.attack * level,
                defense: petType.defense * level,
                hp: petType.hp * level
            };
            
            this.gameState.pets.push(pet);
            this.gameState.currentPet = pet;
            this.addLog(`捕捉灵宠：${pet.name} Lv.${level}`);
            this.updateUI();
        } else {
            this.addLog(`捕捉灵宠需要 ${cost} 灵气`);
        }
    }

    trainPet() {
        const cost = 200;
        if (!this.gameState.currentPet) {
            this.addLog('请先捕捉灵宠');
            return;
        }
        
        if (this.gameState.spirit >= cost) {
            this.gameState.spirit -= cost;
            this.gameState.currentPet.level++;
            this.gameState.currentPet.attack += 5;
            this.gameState.currentPet.defense += 3;
            this.gameState.currentPet.hp += 10;
            
            this.addLog(`灵宠培养成功！${this.gameState.currentPet.name} 升到 Lv.${this.gameState.currentPet.level}`);
            this.updateUI();
        } else {
            this.addLog(`培养需要 ${cost} 灵气`);
        }
    }

    upgradeBuilding(type) {
        const costs = { training: 1000, herb: 800, forge: 1200 };
        const cost = costs[type];
        
        if (this.gameState.spirit >= cost) {
            this.gameState.spirit -= cost;
            this.gameState.sect.buildings[type]++;
            this.addLog(`建筑升级成功！`);
            this.updateUI();
        } else {
            this.addLog(`升级需要 ${cost} 灵气`);
        }
    }

    spawnBoss() {
        const bossIndex = Math.min(this.gameState.realm, BOSSES.length - 1);
        const boss = BOSSES[bossIndex];
        
        this.gameState.boss = {
            current: boss.name,
            hp: boss.hp,
            maxHp: boss.hp,
            nextSpawn: Date.now() + 7200000,
            killed: false
        };
        
        this.addLog(`世界BOSS ${boss.name} 出现了！`);
        this.updateUI();
    }

    attackBoss() {
        if (!this.gameState.boss.current) {
            this.addLog('当前没有BOSS');
            return;
        }
        
        const damage = this.getAttack();
        this.gameState.boss.hp -= damage;
        
        if (this.gameState.boss.hp <= 0) {
            const boss = BOSSES.find(b => b.name === this.gameState.boss.current);
            this.gameState.spirit += boss.reward;
            this.addLog(`击杀BOSS！获得 ${boss.reward} 灵气`);
            this.gameState.boss = {
                current: null,
                hp: 0,
                maxHp: 0,
                nextSpawn: Date.now() + 7200000,
                killed: true
            };
        }
        
        this.updateUI();
    }

    buyItem(item) {
        const prices = { spiritPill: 100, rootFruit: 200, breakthroughPill: 500 };
        
        if (this.gameState.spirit >= prices[item]) {
            this.gameState.spirit -= prices[item];
            
            switch(item) {
                case 'spiritPill':
                    this.gameState.efficiencyLevel++;
                    this.addLog('购买成功！修炼效率+1');
                    break;
                case 'rootFruit':
                    const elements = Object.keys(ELEMENTS);
                    const randomElement = elements[Math.floor(Math.random() * elements.length)];
                    this.gameState.roots[randomElement] += 10;
                    this.addLog(`购买成功！${randomElement}灵根+10`);
                    break;
                case 'breakthroughPill':
                    this.addLog('购买成功！突破成功率+10%');
                    break;
            }
            this.updateUI();
        } else {
            this.addLog(`购买需要 ${prices[item]} 灵气`);
        }
    }

    addLog(message) {
        const logEl = document.getElementById('game-log');
        if (logEl) {
            const p = document.createElement('p');
            p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            logEl.insertBefore(p, logEl.firstChild);
            
            if (logEl.children.length > 50) {
                logEl.removeChild(logEl.lastChild);
            }
        }
    }

    startGameLoop() {
        setInterval(() => {
            const spiritRate = this.getSpiritRate();
            this.gameState.spirit += spiritRate / 10;
            this.updateSpiritDisplay();
        }, 100);
        
        setInterval(() => {
            this.checkBossSpawn();
        }, 1000);
        
        setInterval(() => {
            this.saveGame();
        }, 30000);
    }

    checkBossSpawn() {
        if (!this.gameState.boss.current && Date.now() > this.gameState.boss.nextSpawn) {
            this.spawnBoss();
        }
        
        if (this.gameState.boss.current) {
            const timer = Math.max(0, this.gameState.boss.nextSpawn - Date.now());
            const hours = Math.floor(timer / 3600000);
            const minutes = Math.floor((timer % 3600000) / 60000);
            const seconds = Math.floor((timer % 60000) / 1000);
            
            const timerEl = document.getElementById('boss-timer');
            if (timerEl && !this.gameState.boss.current) {
                timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }

    updateSpiritDisplay() {
        document.getElementById('spirit-amount').textContent = Math.floor(this.gameState.spirit).toLocaleString();
        document.getElementById('spirit-rate').textContent = `+${this.getSpiritRate().toFixed(1)}/秒`;
    }

    initUI() {
        this.updateUI();
        this.renderTechniques();
        this.renderRoots();
    }

    updateUI() {
        // 境界显示
        const realm = REALMS[this.gameState.realm];
        document.getElementById('realm-name').textContent = realm.name + '期';
        document.getElementById('realm-level').textContent = `第${this.gameState.realmLevel}层`;
        
        // 灵气显示
        this.updateSpiritDisplay();
        
        // 修炼进度
        const required = Math.floor(100 * Math.pow(1.5, this.gameState.realmLevel));
        document.getElementById('current-cultivation').textContent = Math.floor(this.gameState.cultivation);
        document.getElementById('required-cultivation').textContent = required;
        document.getElementById('cultivation-progress-bar').style.width = 
            `${(this.gameState.cultivation / required) * 100}%`;
        
        // 升级显示
        document.getElementById('root-level').textContent = `Lv.${this.gameState.rootLevel}`;
        document.getElementById('efficiency-level').textContent = `Lv.${this.gameState.efficiencyLevel}`;
        
        // 属性显示
        this.updateStats();
        document.getElementById('combat-power').textContent = this.gameState.stats.combatPower.toLocaleString();
        document.getElementById('attack').textContent = this.gameState.stats.attack;
        document.getElementById('defense').textContent = this.gameState.stats.defense;
        document.getElementById('hp').textContent = this.gameState.stats.hp;
        
        // 灵宠显示
        if (this.gameState.currentPet) {
            document.querySelector('.pet-icon').textContent = this.gameState.currentPet.icon;
            document.querySelector('.pet-name').textContent = this.gameState.currentPet.name;
            document.querySelector('.pet-level').textContent = `等级: ${this.gameState.currentPet.level}`;
        }
        
        // 宗门显示
        document.getElementById('sect-name').textContent = this.gameState.sect.name;
        document.getElementById('sect-level').textContent = this.gameState.sect.level;
        document.getElementById('sect-members').textContent = this.gameState.sect.members;
        document.getElementById('sect-max-members').textContent = 10 + this.gameState.sect.level * 5;
        document.getElementById('training-room-level').textContent = `Lv.${this.gameState.sect.buildings.training}`;
        document.getElementById('herb-garden-level').textContent = `Lv.${this.gameState.sect.buildings.herb}`;
        document.getElementById('forge-level').textContent = `Lv.${this.gameState.sect.buildings.forge}`;
        
        // BOSS显示
        if (this.gameState.boss.current) {
            document.getElementById('boss-display').style.display = 'block';
            document.getElementById('boss-reward').style.display = 'none';
            document.querySelector('.boss-name').textContent = this.gameState.boss.current;
            document.getElementById('boss-hp-bar').style.width = 
                `${(this.gameState.boss.hp / this.gameState.boss.maxHp) * 100}%`;
            document.getElementById('boss-hp-text').textContent = 
                `${this.gameState.boss.hp.toLocaleString()} / ${this.gameState.boss.maxHp.toLocaleString()}`;
        } else {
            document.getElementById('boss-display').style.display = 'none';
            if (this.gameState.boss.killed) {
                document.getElementById('boss-reward').style.display = 'block';
            }
        }
        
        // 法宝显示
        this.renderArtifacts();
        this.renderRoots();
    }

    renderTechniques() {
        const grid = document.getElementById('techniques-list');
        if (!grid) return;
        
        grid.innerHTML = TECHNIQUES.map((tech, i) => `
            <div class="technique-card" onclick="game.learnTechnique(${i})">
                <div class="name">${tech.name}</div>
                <div class="type">${tech.type}</div>
                <div class="effect">${tech.effect}</div>
                <div class="cost">${this.gameState.techniques[i] ? '已学会' : tech.unlockCost + '灵气'}</div>
            </div>
        `).join('');
    }

    renderRoots() {
        const grid = document.getElementById('roots-display');
        if (!grid) return;
        
        grid.innerHTML = Object.entries(this.gameState.roots).map(([elem, level]) => `
            <div class="root-item ${level > 5 ? 'active' : ''}">
                <span class="element">${ELEMENTS[elem].icon}</span>
                <span>${elem}: ${level}</span>
            </div>
        `).join('');
    }

    renderArtifacts() {
        // 装备槽
        Object.entries(this.gameState.equippedArtifacts).forEach(([slot, artifact]) => {
            const slotEl = document.querySelector(`[data-slot="${slot}"] .slot-content`);
            if (slotEl) {
                if (artifact) {
                    slotEl.textContent = artifact.name;
                    slotEl.parentElement.classList.add('equipped');
                } else {
                    slotEl.textContent = '未装备';
                    slotEl.parentElement.classList.remove('equipped');
                }
            }
        });
        
        // 背包
        const inventory = document.getElementById('artifacts-inventory');
        if (inventory) {
            inventory.innerHTML = this.gameState.artifacts.map(art => `
                <div class="artifact-item" onclick="game.equipArtifact(${art.id})">
                    <div class="artifact-name">${art.name}</div>
                    <div class="artifact-stats">
                        ${art.attack ? `攻击+${art.attack}` : ''}
                        ${art.defense ? `防御+${art.defense}` : ''}
                        ${art.hp ? `生命+${art.hp}` : ''}
                    </div>
                </div>
            `).join('');
        }
    }

    setupEventListeners() {
        // 标签切换
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                document.getElementById(`${tab}-panel`).classList.add('active');
            });
        });
        
        // 修炼按钮
        document.getElementById('cultivate-btn')?.addEventListener('click', () => this.cultivate());
        document.getElementById('breakthrough-btn')?.addEventListener('click', () => this.breakthrough());
        
        // 法宝按钮
        document.getElementById('craft-btn')?.addEventListener('click', () => this.craftArtifact());
        
        // 灵宠按钮
        document.getElementById('catch-pet-btn')?.addEventListener('click', () => this.catchPet());
        document.getElementById('train-pet-btn')?.addEventListener('click', () => this.trainPet());
        
        // BOSS按钮
        document.getElementById('attack-boss-btn')?.addEventListener('click', () => this.attackBoss());
        
        // 页面关闭时保存
        window.addEventListener('beforeunload', () => this.saveGame());
    }
}

// 启动游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new XianxiaGame();
    window.game = game;
});
