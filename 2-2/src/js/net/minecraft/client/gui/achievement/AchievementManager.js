export default class AchievementManager {
    constructor(minecraft) {
        this.minecraft = minecraft;
        this.achievements = {
            'gettingwood': { name: 'Getting Wood', desc: 'Punch a tree and collect a wood log.', icon: 0 },
            'cowtipper': { name: 'Cow Tipper', desc: 'Kill a cow to obtain leather.', icon: 1 },
            'whenpigsfly': { name: 'When Pigs Fly', desc: 'Ride a pig off a cliff while wearing a saddle.', icon: 2 },
            'timetofarm': { name: 'Time to Farm!', desc: 'Craft a hoe and use it to till dirt or grass.', icon: 3 },
            'porkchop': { name: 'Pork Chop', desc: 'Cook a porkchop in a furnace.', icon: 4 },
            'shearfulday': { name: 'Have a Shearful Day', desc: 'Craft shears and shear a sheep.', icon: 5 },
            'itsasign': { name: 'It’s a Sign!', desc: 'Craft and place a sign.', icon: 6 },
            'bakebread': { name: 'Bake Bread', desc: 'Craft bread using wheat.', icon: 7 },
            'takinginventory': { name: 'Taking Inventory', desc: 'Open your inventory.', icon: 8 },
            'heartofgold': { name: 'Heart of Gold', desc: 'Craft a golden apple.', icon: 9 },
            'takeaim': { name: 'Take Aim', desc: 'Shoot a mob or player with a bow.', icon: 10 },
            'covermediamonds': { name: 'Cover Me with Diamonds', desc: 'Craft and equip diamond armor.', icon: 11 },
            'deepen': { name: 'We Need to Go Deeper', desc: 'Build and enter a Nether portal.', icon: 12 },
            'diamonds': { name: 'Diamonds!', desc: 'Mine diamond ore and collect a diamond.', icon: 13 },
            'icebucket': { name: 'Ice Bucket Challenge', desc: 'Obtain obsidian (mine it with diamond).', icon: 14 },
            'ironpick': { name: 'Isn’t It Iron Pick', desc: 'Craft an iron pickaxe.', icon: 15 },
            'hotstuff': { name: 'Hot Stuff', desc: 'Fill a bucket with lava.', icon: 16 },
            'suitup': { name: 'Suit Up', desc: 'Craft and equip iron armor.', icon: 17 },
            'acquirehardware': { name: 'Acquire Hardware', desc: 'Smelt iron ore into an iron ingot.', icon: 18 },
            'gettinganupgrade': { name: 'Getting an Upgrade', desc: 'Craft a stone pickaxe.', icon: 19 },
            'stoneage': { name: 'Stone Age', desc: 'Mine stone and collect cobblestone.', icon: 20 },
            'minecraft': { name: 'Minecraft', desc: 'Craft a crafting table.', icon: 21 },
            'sweetdreams': { name: 'Sweet Dreams', desc: 'Sleep in a bed.', icon: 22 },
            'fishybusiness': { name: 'Fishy Business', desc: 'Catch a fish using a fishing rod.', icon: 23 },
            'seedyplace': { name: 'A Seedy Place', desc: 'Plant seeds on farmland.', icon: 24 },
            'parrotsbats': { name: 'The Parrots and the Bats', desc: 'Breed two animals together.', icon: 25 },
            'monsterhunter': { name: 'Monster Hunter', desc: 'Kill a hostile mob.', icon: 26 },
            'whatadeal': { name: 'What a Deal!', desc: 'Trade with a villager.', icon: 27 },
            'olbetsy': { name: 'Ol’ Betsy', desc: 'Shoot a crossbow.', icon: 28 }
        };
        this.unlocked = {};
        this.queue = [];
        this.currentToast = null;
        this.toastTimer = 0;
        
        // Load unlocked from localStorage
        try {
            const saved = localStorage.getItem('mc_achievements_v1');
            if (saved) this.unlocked = JSON.parse(saved);
        } catch(e) {
            console.warn("Failed to load achievements", e);
        }
    }

    grant(id) {
        if (this.unlocked[id] || !this.achievements[id]) return;
        
        this.unlocked[id] = true;
        this.queue.push(this.achievements[id]);
        
        try {
            localStorage.setItem('mc_achievements_v1', JSON.stringify(this.unlocked));
        } catch (e) {
            console.warn("Failed to save achievement", e);
        }
        
        // Play sound if possible
        if (this.minecraft.player) {
            // this.minecraft.soundManager.playSound("random.levelup", this.minecraft.player.x, this.minecraft.player.y, this.minecraft.player.z, 1.0, 1.0);
            let username = this.minecraft.player.username || "Player";
            this.minecraft.addMessageToChat("§e" + username + " has just earned the achievement [" + this.achievements[id].name + "]");
        }
    }

    update() {
        if (this.currentToast) {
            this.toastTimer++;
            if (this.toastTimer > 150) { 
                this.currentToast = null;
            }
        } else if (this.queue.length > 0) {
            this.currentToast = this.queue.shift();
            this.toastTimer = 0;
        }
    }
    
    // Debug method to reset achievements
    reset() {
        this.unlocked = {};
        localStorage.removeItem('mc_achievements_v1');
        this.minecraft.addMessageToChat("Achievements reset.");
    }
}


