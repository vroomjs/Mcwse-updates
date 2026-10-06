import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import MathHelper from "../../../util/MathHelper.js";
import Block from "../../world/block/Block.js";

export default class GuiAchievements extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        
        this.selectedTab = 0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.atlasSpriteCache = new Map();

        // Unified tree structure for all achievements
        this.items = [
            { id: 'takinginventory', x: 0, y: 0, parent: null },
            { id: 'sweetdreams', x: 0, y: 1, parent: 'takinginventory' },
            { id: 'minecraft', x: 1, y: 0, parent: 'takinginventory' },
            { id: 'gettingwood', x: 2, y: 0, parent: 'minecraft' },
            { id: 'stoneage', x: 3, y: 0, parent: 'gettingwood' },
            
            // Progression path
            { id: 'gettinganupgrade', x: 4, y: 0, parent: 'stoneage' },
            { id: 'acquirehardware', x: 5, y: 0, parent: 'gettinganupgrade' },
            { id: 'ironpick', x: 6, y: 0, parent: 'acquirehardware' },
            { id: 'diamonds', x: 7, y: 0, parent: 'ironpick' },
            { id: 'icebucket', x: 8, y: 0, parent: 'diamonds' },
            { id: 'deepen', x: 9, y: 0, parent: 'icebucket' },
            
            // Side paths from Acquire Hardware
            { id: 'suitup', x: 5, y: 1, parent: 'acquirehardware' },
            { id: 'covermediamonds', x: 6, y: 1, parent: 'suitup' },
            { id: 'hotstuff', x: 6, y: -1, parent: 'acquirehardware' },
            
            // Side paths from Diamonds
            { id: 'heartofgold', x: 7, y: -1, parent: 'diamonds' },
            { id: 'whatadeal', x: 7, y: 1, parent: 'diamonds' },
            
            // Side paths from Getting Wood
            { id: 'itsasign', x: 2, y: 1, parent: 'gettingwood' },
            { id: 'fishybusiness', x: 2, y: 2, parent: 'gettingwood' },
            { id: 'shearfulday', x: 2, y: -1, parent: 'gettingwood' },
            
            // Husbandry & Farming
            { id: 'timetofarm', x: 3, y: 2, parent: 'gettingwood' },
            { id: 'seedyplace', x: 4, y: 2, parent: 'timetofarm' },
            { id: 'bakebread', x: 5, y: 2, parent: 'timetofarm' },
            
            { id: 'cowtipper', x: 3, y: -2, parent: 'gettingwood' },
            { id: 'parrotsbats', x: 4, y: -2, parent: 'cowtipper' },
            { id: 'porkchop', x: 5, y: -2, parent: 'cowtipper' },
            { id: 'whenpigsfly', x: 6, y: -2, parent: 'porkchop' },
            
            // Adventure
            { id: 'monsterhunter', x: 4, y: 1, parent: 'gettingwood' },
            { id: 'takeaim', x: 5, y: 1, parent: 'monsterhunter' },
            { id: 'olbetsy', x: 6, y: 1, parent: 'takeaim' }
        ];
        
        // Settings for node grid
        this.nodeSize = 24;
        this.nodePadding = 12;
        this.gridSpacing = 50;
    }

    getAtlasSprite(sheetKey, index, columns) {
        const cacheKey = `${sheetKey}:${index}:${columns}`;
        if (this.atlasSpriteCache.has(cacheKey)) {
            return this.atlasSpriteCache.get(cacheKey);
        }

        const sheet = this.getTexture(sheetKey);
        if (!sheet || !sheet.width || !sheet.height) return null;

        const spriteWidth = Math.floor(sheet.width / columns);
        const sprite = document.createElement("canvas");
        sprite.width = spriteWidth;
        sprite.height = sheet.height;
        const context = sprite.getContext("2d");
        context.imageSmoothingEnabled = false;
        context.drawImage(
            sheet,
            index * spriteWidth,
            0,
            spriteWidth,
            sheet.height,
            0,
            0,
            spriteWidth,
            sheet.height
        );
        this.atlasSpriteCache.set(cacheKey, sprite);
        return sprite;
    }

    init() {
        super.init();

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.winW = 256;
        this.winH = 202;
        this.winX = centerX - this.winW / 2;
        this.winY = centerY - this.winH / 2;

        this.advTexture = this.getTexture("../../advancements (2).png");
        this.iconsSheet = this.getTexture("../../advancements (1).png");
        
        // Sub-texture atlas data for advancements (2).png (the frame sheet)
        this.advAtlas = {
            advancementnotgotten: { x: 1, y: 155, w: 24, h: 24 },
            advancementgotten: { x: 1, y: 129, w: 24, h: 24 },
            collectedtextbox: { x: 0, y: 3, w: 200, h: 20 },
            notcollectedtextbox: { x: 0, y: 29, w: 200, h: 20 },
            descriptionbox: { x: 0, y: 55, w: 200, h: 20 }
        };



        // Footer Done button - matching bottom right position from image
        this.buttonList.push(new GuiButton("Done", this.winX + this.winW - 80, this.winY + this.winH - 24, 72, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
        
        // Initial center pan
        if (this.panX === 0 && this.panY === 0) {
            this.panX = -100;
            this.panY = 0;
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);


        
        // Main Frame with beveled edges look
        this.drawRect(stack, this.winX - 3, this.winY - 3, this.winX + this.winW + 3, this.winY + this.winH + 3, "#101010");
        this.drawRect(stack, this.winX - 2, this.winY - 2, this.winX + this.winW + 2, this.winY + this.winH + 2, "#C6C6C6");
        
        // Window Title
        this.drawStringNoShadow(stack, "Advancements", this.winX + 9, this.winY + 7, 0x404040);
        
        // Content Area dimensions
        const innerX = this.winX + 9;
        const innerY = this.winY + 20;
        const innerW = this.winW - 18;
        const innerH = this.winH - 50;
        
        // Inner Border
        this.drawRect(stack, innerX - 1, innerY - 1, innerX + innerW + 1, innerY + innerH + 1, "#373737");
        
        stack.save();
        stack.beginPath();
        stack.rect(innerX, innerY, innerW, innerH);
        stack.clip();
        
        // Rich Stone Background with Ore flecks logic
        this.drawAchievementBackground(stack, innerX, innerY, innerW, innerH);

        // Draw Nodes and Lines
        this.drawAdvancementTree(stack, innerX + innerW / 2 + this.panX, innerY + innerH / 2 + this.panY, mouseX, mouseY);

        stack.restore();

        // Tooltip (only if mouse inside content area)
        if (mouseX >= innerX && mouseX < innerX + innerW && mouseY >= innerY && mouseY < innerY + innerH) {
            this.drawAdvancementTooltip(stack, innerX, innerY, innerW, innerH, innerX + innerW / 2 + this.panX, innerY + innerH / 2 + this.panY, mouseX, mouseY);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    drawAchievementBackground(stack, x, y, w, h) {
        const stoneTex = this.getAtlasSprite("../../stonesheet.png", 0, 8);
        const oreTex = this.getAtlasSprite("../../orestuff.png", 4, 14);
        const coalTex = this.getTexture("../../blocks.png"); // using atlas for coal flecks
        
        // Base Stone
        if (stoneTex) {
            stack.save();
            const pattern = stack.createPattern(stoneTex, 'repeat');
            stack.fillStyle = pattern;
            stack.translate(this.panX, this.panY);
            stack.globalAlpha = 0.5;
            stack.fillRect(x - this.panX, y - this.panY, w, h);
            stack.restore();
        } else {
            this.drawRect(stack, x, y, x + w, y + h, "#333333");
        }

        // Draw some "ore flecks" manually for flavor like the image
        stack.save();
        stack.beginPath();
        stack.rect(x, y, w, h);
        stack.clip();
        stack.translate(this.panX, this.panY);
        stack.globalAlpha = 0.3;
        
        // Deterministic flecks based on world coordinates
        const spacing = 64;
        const startX = Math.floor((-this.panX + x) / spacing) * spacing;
        const startY = Math.floor((-this.panY + y) / spacing) * spacing;
        
        for (let fx = startX; fx < -this.panX + x + w + spacing; fx += spacing) {
            for (let fy = startY; fy < -this.panY + y + h + spacing; fy += spacing) {
                // simple hash for "random" but static ore type
                let hash = Math.abs((fx * 31 + fy * 17) % 10);
                let oreIcon = null;
                if (hash === 1 && oreTex) { // Redstone
                    this.drawSprite(stack, oreTex, 0, 0, 16, 16, fx, fy, 16, 16);
                } else if (hash === 3 && coalTex) { // Coal (atlas index 2 is dirt, let's use stone/ore index)
                    this.drawSprite(stack, coalTex, 16 * 2, 0, 16, 16, fx, fy, 16, 16);
                }
            }
        }
        stack.restore();
    }



    drawAdvancementTree(stack, originX, originY, mouseX, mouseY) {
        const achievements = this.minecraft.achievementManager.achievements;
        const unlocked = this.minecraft.achievementManager.unlocked;

        // 1. Draw connecting lines
        stack.lineWidth = 2;
        for (let item of this.items) {
            if (item.parent) {
                let parent = this.items.find(i => i.id === item.parent);
                if (parent) {
                    let x1 = originX + parent.x * this.gridSpacing;
                    let y1 = originY + parent.y * this.gridSpacing;
                    let x2 = originX + item.x * this.gridSpacing;
                    let y2 = originY + item.y * this.gridSpacing;
                    
                    let isUnlocked = unlocked[item.id] && unlocked[item.parent];
                    stack.strokeStyle = isUnlocked ? "#FFFFFF" : "#000000";
                    
                    stack.beginPath();
                    stack.moveTo(x1, y1);
                    stack.lineTo(x2, y1);
                    stack.lineTo(x2, y2);
                    stack.stroke();
                }
            }
        }

        // 2. Draw Nodes
        for (let item of this.items) {
            let x = Math.floor(originX + item.x * this.gridSpacing);
            let y = Math.floor(originY + item.y * this.gridSpacing);
            let isUnlocked = unlocked[item.id];
            let ach = achievements[item.id];
            
            const s = this.nodeSize;
            
            // Background sprite from atlas
            if (this.advTexture) {
                const sub = isUnlocked ? this.advAtlas.advancementgotten : this.advAtlas.advancementnotgotten;
                this.drawSprite(stack, this.advTexture, sub.x, sub.y, sub.w, sub.h, x - 12, y - 12, 24, 24);
            } else {
                this.drawRect(stack, x - 12, y - 12, x + 12, y + 12, isUnlocked ? "#FFFF55" : "#404040");
            }

            // Icon
            if (this.iconsSheet) {
                const iconIdx = ach.icon || 0;
                const sw = this.iconsSheet.width / 29;
                this.drawSprite(stack, this.iconsSheet, iconIdx * sw, 0, sw, this.iconsSheet.height, x - 8, y - 8, 16, 16, isUnlocked ? 1.0 : 0.3);
            }
        }
    }

    drawAdvancementTooltip(stack, clipX, clipY, clipW, clipH, originX, originY, mouseX, mouseY) {
        const achievements = this.minecraft.achievementManager.achievements;
        const unlocked = this.minecraft.achievementManager.unlocked;

        for (let item of this.items) {
            let x = originX + item.x * this.gridSpacing;
            let y = originY + item.y * this.gridSpacing;
            const s = this.nodeSize / 2;

            if (mouseX >= x - s && mouseX < x + s && mouseY >= y - s && mouseY < y + s) {
                if (x < clipX || x > clipX + clipW || y < clipY || y > clipY + clipH) continue;

                let ach = achievements[item.id];
                let isUnlocked = unlocked[item.id];
                let title = isUnlocked ? ach.name : "???";
                let desc = isUnlocked ? ach.desc : "Locked advancement";

                let nameW = this.getStringWidth(stack, title);
                let descW = this.getStringWidth(stack, desc);
                let tw = Math.max(120, nameW + 10, descW + 10);
                let th = 40;

                let tx = mouseX + 12;
                let ty = mouseY - 12;
                
                // Adjust tooltip position if it goes off screen
                if (tx + tw > this.width) tx = mouseX - tw - 12;
                if (ty + th > this.height) ty = mouseY - th - 12;

                const a = this.advAtlas;
                if (this.advTexture) {
                    // Title Box
                    const titleTex = isUnlocked ? a.collectedtextbox : a.notcollectedtextbox;
                    this.drawSprite(stack, this.advTexture, titleTex.x, titleTex.y, titleTex.w, titleTex.h, tx, ty, tw, 20);
                    // Description Box
                    this.drawSprite(stack, this.advTexture, a.descriptionbox.x, a.descriptionbox.y, a.descriptionbox.w, a.descriptionbox.h, tx, ty + 20, tw, 20);
                } else {
                    this.drawRect(stack, tx, ty, tx + tw, ty + 20, isUnlocked ? "#8B652A" : "#202020");
                    this.drawRect(stack, tx, ty + 20, tx + tw, ty + 40, "#101010");
                }

                this.drawString(stack, title, tx + 5, ty + 6, isUnlocked ? 0xFFFF55 : 0xFFFFFF);
                this.drawString(stack, desc, tx + 5, ty + 24, 0xAAAAAA);
                return;
            }
        }
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        // Safety check for initialized dimensions
        if (this.winX === undefined) return;

        // Content Panning area
        const innerX = this.winX + 9;
        const innerY = this.winY + 20;
        const innerW = this.winW - 18;
        const innerH = this.winH - 50;
        
        if (mouseX >= innerX && mouseX < innerX + innerW && mouseY >= innerY && mouseY < innerY + innerH) {
            this.isPanning = true;
            this.lastMouseX = mouseX;
            this.lastMouseY = mouseY;
        }

        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    mouseDragged(mouseX, mouseY, mouseButton) {
        if (this.isPanning) {
            this.panX += (mouseX - this.lastMouseX);
            this.panY += (mouseY - this.lastMouseY);
            this.lastMouseX = mouseX;
            this.lastMouseY = mouseY;
        }
        super.mouseDragged(mouseX, mouseY, mouseButton);
    }

    mouseReleased(mouseX, mouseY, mouseButton) {
        this.isPanning = false;
        super.mouseReleased(mouseX, mouseY, mouseButton);
    }

    handleMouseScroll(delta) {
        // Simple zoom? No, just pan vertically?
        this.panY -= delta * 15;
    }

    keyTyped(key, character) {
        if (key === "KeyL" || key === "Escape") { // MC uses L for advancements
            // If no previous screen, default back to game/menu logic in Minecraft.js
            this.minecraft.displayScreen(this.previousScreen || null);
            return true;
        }
        return super.keyTyped(key, character);
    }
}

