import Gui from "./Gui.js";
import Block from "../world/block/Block.js";
import EnumBlockFace from "../../util/EnumBlockFace.js";
import ChatOverlay from "./ChatOverlay.js";

export default class IngameOverlay extends Gui {

    constructor(minecraft, window) {
        super();
        this.minecraft = minecraft;
        this.window = window;

        this.textureCrosshair = minecraft.resources["gui/icons.png"];
        this.textureHotbar = minecraft.resources["gui/gui.png"];

        this.chatOverlay = new ChatOverlay(minecraft);

        this.lastSelectedSlot = -1;
        this.lastItemId = 0;
        this.itemNameToShow = "";
        this.itemNameDisplayTime = 0;
    }

    render(stack, mouseX, mouseY, partialTicks, player = null, width = -1, height = -1) {
        if (!player) player = this.minecraft.player;
        if (width === -1) width = this.window.width;
        if (height === -1) height = this.window.height;

        const isMainPlayer = (player === this.minecraft.player);

        // Render crosshair
        if (this.minecraft.hasInGameFocus() && !this.window.isMobile) {
            this.renderCrosshair(stack, width / 2, height / 2)
        }

        // Render Asset Loading Indicator
        if (this.minecraft.assetsLoading) {
            this.drawRightString(stack, "§8Assets loading...", width - 5, height - 10);
        }

        // Render bars
        if (player.gameMode !== 1) {
            this.renderHearts(stack, width / 2 - 91, height - 34, player);
            this.renderFood(stack, width / 2 + 10, height - 34, player);
            this.renderArmor(stack, width / 2 - 91, height - 44, player);
            
            // Render Horse health if riding
            if (player.isRiding() && player.ridingEntity.constructor.name.includes("Horse")) {
                this.renderHorseHearts(stack, width / 2 + 10, height - 44, player.ridingEntity);
            }
        }

        // Render hotbar
        this.renderHotbar(stack, width / 2 - 91, height - 22, partialTicks, player);

        // Pistol ammunition counter, positioned in the lower-right HUD.
        if (isMainPlayer && player.inventory.getItemInSelectedSlot() === 568) {
            const ammo = this.minecraft.pistolAmmo ?? 6;
            const ammoText = this.minecraft.pistolMagOut ? "-/-" : (ammo + "/6");
            this.drawRightString(stack, "AMMO " + ammoText, width - 12, height - 22, 0xFFFFFF);
        }

        // Synced .lrc lyrics use the same HUD slot as the held item tooltip,
        // directly above the hotbar. If an item tooltip is also fading in, move
        // it up one line so both remain readable.
        const soundManager = this.minecraft.soundManager;
        const lyricLine = isMainPlayer && soundManager?.getCurrentLyricLine
            ? soundManager.getCurrentLyricLine()
            : null;
        const waveformActive = isMainPlayer && !lyricLine && soundManager?.isBackgroundMusicPlaying?.();
        const musicHudActive = !!lyricLine || !!waveformActive;

        // Render held item name above hotbar (Only for local active focus or main player)
        if (this.itemNameDisplayTime > 0 && isMainPlayer) {
            stack.save();
            let alpha = 1.0;
            if (this.itemNameDisplayTime < 15) alpha = this.itemNameDisplayTime / 15.0;
            stack.globalAlpha = alpha;
            this.drawCenteredString(stack, this.itemNameToShow, width / 2, musicHudActive ? height - 64 : height - 52, 0xFFFFFF);
            stack.restore();
        }

        if (lyricLine) {
            stack.save();
            const lyricText = this.fitHudText(stack, "Lyrics: " + lyricLine, width - 32);
            const lyricWidth = this.getStringWidth(stack, lyricText);
            const lyricX = width / 2;
            const lyricY = height - 52;
            this.drawRect(stack, lyricX - lyricWidth / 2 - 6, lyricY - 3, lyricX + lyricWidth / 2 + 6, lyricY + 10, "#000000", 0.48);
            this.drawCenteredString(stack, lyricText, lyricX, lyricY, 0xE8FFE8);
            stack.restore();
        } else if (waveformActive) {
            this.renderMusicWaveform(stack, width / 2, height - 52, width, partialTicks, soundManager);
        }

        // Render chat (Only for main UI pass)
        if (isMainPlayer) {
            this.chatOverlay.render(stack, mouseX, mouseY, partialTicks);
        }

        let world = this.minecraft.world;

        if (isMainPlayer) {
            this.minecraft.xaerosMinimapClientMod?.render(stack, width, height, player);
        }

        // Local-only production camera status. The clean broadcast pass never renders this 2D canvas.
        if (isMainPlayer && player.isCameraman) {
            const cm=this.minecraft.cameraManager, x=8, y=8;
            this.drawRect(stack,x-4,y-4,x+145,y+62,'black',0.58);
            this.drawString(stack,"§bCAMERAMAN",x,y,0x55ffff);
            this.drawString(stack,"Mode: §f"+(player.cameraMode||"operator").toUpperCase(),x,y+11);
            this.drawString(stack,"FOV: §f"+Math.round(player.cameraFov||70)+"°",x,y+22);
            this.drawString(stack,"Speed: §f"+(cm.controller.speed/0.18).toFixed(1)+"x",x,y+33);
            this.drawString(stack,"Broadcast: "+(cm.session.active?"§c● LIVE":"§7OFF"),x,y+44);
            this.drawString(stack,"§7V Mode  F8 Camera Studio",x,y+55);
        }
        if (isMainPlayer && !this.minecraft.currentScreen && !this.minecraft.cameraManager?.placement) {
            const looked=this.minecraft.cameraManager?.getLookedAtCamera?.();
            if(looked)this.drawCenteredString(stack,"§fE §7— Manage Camera",width/2,height/2+18,0xffffff);
        }
        if (isMainPlayer && this.minecraft.cameraManager?.placement) {
            this.drawCenteredString(stack,"§bCAMERA PLACEMENT",width/2,24,0x55ffff);
            this.drawCenteredString(stack,"§fLeft click: Place   §7Right click/Esc: Cancel",width/2,36,0xffffff);
        }
        
        // One Block HUD - Updated to use DOM elements for better formatting and top-right placement
        const obHud = document.getElementById('one-block-hud');
        if (isMainPlayer && world && world._gameType === 'oneblock') {
            if (obHud) {
                obHud.style.display = 'block';
                const phases = world.oneBlockPhases;
                const currentPhaseIdx = world.oneBlock.phase;
                const phaseName = phases[currentPhaseIdx] ? phases[currentPhaseIdx].name : "Unknown";
                const mined = world.oneBlock.mined;
                
                document.getElementById('ob-phase').innerText = "Phase: " + phaseName;
                document.getElementById('ob-mined').innerText = "Blocks Mined: " + mined;
            }
        } else if (obHud) {
            obHud.style.display = 'none';
        }

        // Portal Overlay
        if (player && player.timeInPortal > 0) {
            this.renderPortalOverlay(stack, this.window.width, this.window.height, partialTicks);
        }

        // Sleep Fade Overlay (Global)
        if (this.minecraft.sleepTimer > 0) {
            let t = this.minecraft.sleepTimer + partialTicks;
            let alpha = 0;
            if (t < 15) alpha = t / 15; // Fade In
            else if (t > 25) alpha = 1.0 - (t - 25) / 15; // Fade Out
            else alpha = 1.0; // Fully black
            
            this.drawRect(stack, 0, 0, width, height, 'black', Math.max(0, Math.min(1, alpha)));
        }

        let x = Math.floor(player.x);
        let y = Math.floor(player.y);
        let z = Math.floor(player.z);

        // Debug info (Main player only)
        if (!isMainPlayer) return;

        let fps = Math.floor(this.minecraft.fps);
        let inputLag = (this.minecraft.renderTimestamp - this.minecraft.inputLatencyStart).toFixed(2);
        let lightUpdates = world.lightUpdateQueue.length;
        let chunkUpdates = this.minecraft.worldRenderer.chunkSectionUpdateQueue.length;
        let lightLevel = world.getTotalLightAt(x, y, z);

        // Debug
        const s = this.minecraft.settings;
        let debugY = 1;

        if (s.showFPS) {
            this.drawString(stack, fps + " fps (Input Lag: " + inputLag + "ms)", 1, debugY);
            debugY += 9;
        }
        
        if (s.showLightUpdates) {
            this.drawString(stack, lightUpdates + " light updates," + " " + chunkUpdates + " chunk updates", 1, debugY);
            debugY += 9;
        }

        if (s.showCoordinates) {
            this.drawString(stack, x + ", " + y + ", " + z + " (" + (x >> 4) + ", " + (y >> 4) + ", " + (z >> 4) + ")", 1, debugY);
            debugY += 9;
        }

        if (world.gameRules.showDayCounter) {
            let day = Math.floor(world.time / 24000);
            this.drawString(stack, "Day " + day, 1, debugY);
            debugY += 9;
        }

        // Autosave indicator in bottom right
        if (this.minecraft.autosaveDisplayTimer > 0) {
            stack.save();
            let alpha = 1.0;
            if (this.minecraft.autosaveDisplayTimer < 20) alpha = this.minecraft.autosaveDisplayTimer / 20.0;
            stack.globalAlpha = alpha;
            // Draw more prominent text with shadow and slight glow
            this.drawRightString(stack, "Saving level...", width - 6, height - 32, 0x000000); // Shadow
            this.drawRightString(stack, "Saving level...", width - 7, height - 33, 0xFFFF55); // Yellow text
            stack.restore();
        }

        // Render Title
        this.renderTitle(stack, partialTicks);

        // Render Persistent HUDs
        this.renderHUDs(stack);

        // Render Achievement Toast
        this.renderAchievement(stack, partialTicks);
    }

    renderHUDs(stack) {
        if (!this.minecraft.hudElements || this.minecraft.hudElements.size === 0) return;

        const width = this.window.width;
        const height = this.window.height;

        for (let [id, layout] of this.minecraft.hudElements) {
            if (!layout.elements) continue;

            for (let el of layout.elements) {
                if (el.type === "text") {
                    // Resolve dynamic text using CommandHandler logic (roughly)
                    let text = el.text;
                    if (text && text.includes("{storage:")) {
                        const matches = text.match(/\{storage:([a-zA-Z0-9.]+)\}/g);
                        if (matches) {
                            for (let m of matches) {
                                const path = m.substring(9, m.length - 1);
                                const val = this.minecraft.commandHandler.getStorageValue(path);
                                text = text.replace(m, val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : val) : "?");
                            }
                        }
                    }

                    const x = el.x !== undefined ? width / 2 + el.x : width / 2;
                    const y = el.y !== undefined ? height / 2 + el.y : 40;
                    const color = el.color !== undefined ? (typeof el.color === 'string' ? parseInt(el.color.replace('#', '0x')) : el.color) : 0xFFFFFF;
                    
                    this.drawCenteredString(stack, text, x, y, color);
                }
            }
        }
    }

    renderTitle(stack, partialTicks) {
        if (!this.minecraft.titleState) return;
        const state = this.minecraft.titleState;
        const now = Date.now();
        
        if (now > state.endTime) return;

        const width = this.window.width;
        const height = this.window.height;

        // Calculate fade
        let alpha = 1.0;
        const timeLeft = state.endTime - now;
        const timeActive = now - state.startTime;

        if (timeActive < state.fadeIn) alpha = timeActive / state.fadeIn;
        else if (timeLeft < state.fadeOut) alpha = timeLeft / state.fadeOut;

        stack.save();
        stack.globalAlpha = alpha;

        if (state.mainTitle) {
            stack.save();
            stack.translate(width / 2, height / 2 - 20, 0);
            stack.scale(3, 3, 3);
            this.drawCenteredString(stack, state.mainTitle, 0, 0, state.mainColor);
            stack.restore();
        }

        if (state.subTitle) {
            stack.save();
            stack.translate(width / 2, height / 2 + 20, 0);
            stack.scale(1.5, 1.5, 1.5);
            this.drawCenteredString(stack, state.subTitle, 0, 0, state.subColor);
            stack.restore();
        }
        
        if (state.actionBar) {
            this.drawCenteredString(stack, state.actionBar, width / 2, height - 60, state.actionColor);
        }

        stack.restore();

        // Render Debug Stick Info
        if (this.minecraft.debugStickDisplayTimer > 0) {
            stack.save();
            let dAlpha = Math.min(1.0, this.minecraft.debugStickDisplayTimer / 10.0);
            stack.globalAlpha = dAlpha;
            this.drawCenteredString(stack, this.minecraft.debugStickDisplayText, width / 2, height - 72, 0x55FFFF);
            stack.restore();
        }
    }

    onTick() {
        if (this.minecraft.debugStickDisplayTimer > 0) {
            this.minecraft.debugStickDisplayTimer--;
        }
        if (this.chatOverlay) {
            this.chatOverlay.onTick();
        }

        // Track changes to selected slot or item ID to show name
        if (this.minecraft.player && this.minecraft.player.inventory) {
            let inv = this.minecraft.player.inventory;
            let currentSlot = inv.selectedSlotIndex;
            let currentItem = inv.getItemInSelectedSlot();

            if (currentSlot !== this.lastSelectedSlot || currentItem !== this.lastItemId) {
                this.lastSelectedSlot = currentSlot;
                this.lastItemId = currentItem;

                if (currentItem !== 0) {
                    let block = Block.getById(currentItem);
                    this.itemNameToShow = block ? block.name : "Item";
                    this.itemNameDisplayTime = 60; // 3 seconds at 20 TPS
                } else {
                    this.itemNameDisplayTime = 0;
                }
            }
        }

        if (this.itemNameDisplayTime > 0) {
            this.itemNameDisplayTime--;
        }
    }
    
    renderPortalOverlay(stack, width, height, partialTicks) {
        let texture = this.getTexture("../../nether_portal.png");
        if (!texture) return;
        
        let player = this.minecraft.player;
        let time = player.prevTimeInPortal + (player.timeInPortal - player.prevTimeInPortal) * partialTicks;
        
        if (time > 0) {
            let alpha = time / 100.0; // Ramp up
            if (alpha > 1.0) alpha = 1.0;
            
            // Animate frame
            let frameCount = 32;
            let frame = Math.floor(Date.now() / 50) % frameCount;
            
            let textureWidth = this.getTextureWidth(texture, 32);
            let textureHeight = this.getTextureHeight(texture, 32);
            let spriteH = textureHeight / frameCount;
            let sy = frame * spriteH;
            
            // Color: Purple
            let color = 0x2d043e; // Dark purple base
            
            // Draw full screen rect with alpha
            // To draw animated sprite tiled/stretched:
            stack.save();
            stack.globalAlpha = alpha * 0.8; // Max 80% opacity
            
            // Draw stretched portal texture
            this.drawSprite(stack, texture, 0, sy, textureWidth, spriteH, 0, 0, width, height);
            
            stack.restore();
        }
    }

    renderHearts(stack, x, y, player) {
        let health = player.health;
        let maxHealth = player.maxHealth || 20.0;
        
        let texFull = this.getTexture("../../heartfull.png");
        let texHalf = this.getTexture("../../hearthalffull.png");
        let texEmpty = this.getTexture("../../heartempty.png");

        let totalHearts = Math.ceil(maxHealth / 2);

        for (let i = 0; i < totalHearts; i++) {
            let row = Math.floor(i / 10);
            let col = i % 10;
            let heartX = x + col * 8;
            let heartY = y - row * 9; // Stack rows upward

            let yOffset = 0;
            if (health <= 4 && (this.minecraft.frames % 10 < 5)) {
                yOffset = (Math.random() * 2 - 1);
            }

            if (texEmpty) {
                let w = this.getTextureWidth(texEmpty, 9);
                let h = this.getTextureHeight(texEmpty, 9);
                this.drawSprite(stack, texEmpty, 0, 0, w, h, heartX, heartY + yOffset, 9, 9);
            }
            
            let fullThreshold = (i + 1) * 2;
            let halfThreshold = (i * 2) + 1;
            
            let texture = null;
            if (health >= fullThreshold) {
                texture = texFull;
            } else if (health >= halfThreshold) {
                texture = texHalf;
            }
            
            if (texture) {
                let w = this.getTextureWidth(texture, 9);
                let h = this.getTextureHeight(texture, 9);
                this.drawSprite(stack, texture, 0, 0, w, h, heartX, heartY + yOffset, 9, 9);
            }
        }
    }

    renderArmor(stack, x, y, player) {
        if (!player || !player.inventory) return;

        // Calculate total armor points
        let armorPoints = 0;
        const pointMap = {
            // Iron
            306: 2, 307: 6, 308: 5, 309: 2,
            // Diamond
            310: 3, 311: 8, 312: 6, 313: 3,
            // Gold
            314: 2, 315: 5, 316: 3, 317: 1
        };

        for (let i = 0; i < 4; i++) {
            let item = player.inventory.getArmor(i);
            if (item && item.id !== 0) {
                armorPoints += pointMap[item.id] || 0;
            }
        }

        if (armorPoints <= 0) return;

        let texFull = this.getTexture("../../armorfull.png");
        let texHalf = this.getTexture("../../armorhalf.png");
        let texEmpty = this.getTexture("../../armorempty.png");

        // Draw 10 armor icons (each icon = 2 points, max 20)
        for (let i = 0; i < 10; i++) {
            let iconX = x + i * 8;

            // Always draw empty as background
            if (texEmpty) {
                this.drawSprite(stack, texEmpty, 0, 0, this.getTextureWidth(texEmpty, 9), this.getTextureHeight(texEmpty, 9), iconX, y, 9, 9);
            }

            let fullThreshold = (i + 1) * 2;
            let halfThreshold = (i * 2) + 1;

            let texture = null;
            if (armorPoints >= fullThreshold) texture = texFull;
            else if (armorPoints >= halfThreshold) texture = texHalf;

            if (texture) {
                this.drawSprite(stack, texture, 0, 0, this.getTextureWidth(texture, 9), this.getTextureHeight(texture, 9), iconX, y, 9, 9);
            }
        }
    }

    renderHorseHearts(stack, x, y, horse) {
        let health = horse.health;
        let maxHealth = horse.maxHealth || 30.0;
        
        let texFull = this.getTexture("../../heartfull.png");
        let texHalf = this.getTexture("../../hearthalffull.png");
        let texEmpty = this.getTexture("../../heartempty.png");

        let totalHearts = Math.ceil(maxHealth / 2);

        for (let i = 0; i < totalHearts; i++) {
            let row = Math.floor(i / 10);
            let col = i % 10;
            let heartX = x + (9 - col) * 8; // Render from right to left
            let heartY = y - row * 9;

            if (texEmpty) {
                this.drawSprite(stack, texEmpty, 0, 0, 9, 9, heartX, heartY, 9, 9);
            }
            
            let fullThreshold = (i + 1) * 2;
            let halfThreshold = (i * 2) + 1;
            
            let texture = null;
            if (health >= fullThreshold) texture = texFull;
            else if (health >= halfThreshold) texture = texHalf;
            
            if (texture) {
                stack.save();
                stack.filter = "hue-rotate(240deg)"; // Tint hearts gold/yellow for horse
                this.drawSprite(stack, texture, 0, 0, 9, 9, heartX, heartY, 9, 9);
                stack.restore();
            }
        }
    }

    renderFood(stack, x, y, player) {
        let food = player.foodLevel;
        
        let texFull = this.getTexture("../../foodfull.png");
        let texHalf = this.getTexture("../../foodhalffull.png");
        let texEmpty = this.getTexture("../../foodempty.png");

        // Draw 10 food icons
        for (let i = 0; i < 10; i++) {
            let foodX = x + i * 8;

            // Always draw empty food as background
            if (texEmpty) {
                let w = this.getTextureWidth(texEmpty, 9);
                let h = this.getTextureHeight(texEmpty, 9);
                this.drawSprite(stack, texEmpty, 0, 0, w, h, foodX, y, 9, 9);
            }
            
            // "Lose from left to right" means the leftmost icons (i=0) represent the highest food values.
            // i=0 (leftmost) -> Represents food level 19-20
            // i=9 (rightmost) -> Represents food level 1-2
            
            let fullThreshold = (10 - i) * 2;     // i=0 -> 20, i=9 -> 2
            let halfThreshold = (10 - i) * 2 - 1; // i=0 -> 19, i=9 -> 1
            
            let texture = null;
            
            if (food >= fullThreshold) {
                texture = texFull;
            } else if (food >= halfThreshold) {
                texture = texHalf;
            }
            
            if (texture) {
                let w = this.getTextureWidth(texture, 9);
                let h = this.getTextureHeight(texture, 9);
                this.drawSprite(stack, texture, 0, 0, w, h, foodX, y, 9, 9);
            }
        }
    }

    renderCounts(stack, mouseX, mouseY, partialTicks, player = null, width = -1, height = -1) {
        if (!this.minecraft.isInGame()) return;
        if (!player) player = this.minecraft.player;
        if (width === -1) width = this.window.width;
        if (height === -1) height = this.window.height;

        if (!player || !player.inventory) return;

        let x = width / 2 - 91;
        let y = height - 22;

        for (let i = 0; i < 9; i++) {
            let itemStack = player.inventory.getStackInSlot(i);
            if (itemStack && itemStack.id !== 0) {
                let block = Block.getById(itemStack.id);
                let slotX = x + i * 20 + 1; // Aligned to slot interior

                // Render Item Count
                if (itemStack.count > 1 && (!block.maxStackSize || block.maxStackSize > 1)) {
                    this.drawRightString(stack, "" + itemStack.count, slotX + 17, y + 13, 0xFFFFFF);
                }

                // Render Durability Bar (on counts layer so it's on top of 3D icons)
                if (block.maxDamage > 0 && itemStack.damage > 0) {
                    this.drawDurabilityBar(stack, slotX, y + 3, itemStack.damage, block.maxDamage);
                }
            }
        }
    }

    renderCrosshair(stack, x, y) {
        let size = 15;
        let texture = this.getTexture("gui/icons.png");
        if (texture) {
            this.drawSprite(stack, texture, 0, 0, 15, 15, x - size / 2, y - size / 2, size, size, 0.6);
        }
    }

    renderHotbar(stack, x, y, partialTicks, player) {
        let texture = this.getTexture("gui/gui.png");
        const isMainPlayer = (player === this.minecraft.player);
        const prefix = isMainPlayer ? "p1_" : "p2_";

        if (texture) {
            // Render background
            this.drawSprite(stack, texture, 0, 0, 182, 22, x, y, 182, 22);
            this.drawSprite(
                stack,
                texture,
                0, 22,
                24, 24,
                x + player.inventory.selectedSlotIndex * 20 - 1, y - 1,
                24, 24
            );
        }

        // Render items
        for (let i = 0; i < 9; i++) {
            let itemStack = player.inventory.getStackInSlot(i);
            const renderId = prefix + "hotbar" + i;
            if (itemStack && itemStack.id !== 0) {
                let block = Block.getById(itemStack.id);
                this.minecraft.itemRenderer.renderItemInGui(renderId, block, x + i * 20 + 11, y + 11, 10, 1.0, 0, itemStack.tag);
            } else {
                if (this.minecraft.itemRenderer.items[renderId]) {
                    this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
                    delete this.minecraft.itemRenderer.items[renderId];
                }
            }
        }
    }

    fitHudText(stack, text, maxWidth) {
        text = String(text || "");
        if (this.getStringWidth(stack, text) <= maxWidth) return text;

        let shortened = text;
        while (shortened.length > 3 && this.getStringWidth(stack, shortened + "...") > maxWidth) {
            shortened = shortened.slice(0, -1);
        }
        return shortened + "...";
    }

    renderMusicWaveform(stack, centerX, y, width, partialTicks, soundManager) {
        const panelW = Math.min(150, Math.max(92, width - 32));
        const panelH = 18;
        const left = centerX - panelW / 2;
        const top = y - 5;
        const midY = top + panelH / 2;
        const bars = 34;
        const levels = soundManager?.getMusicWaveformLevels?.(bars);

        this.drawRect(stack, left - 5, top - 2, left + panelW + 5, top + panelH + 2, "#000000", 0.46);
        this.drawRect(stack, left, midY, left + panelW, midY + 1, "#ffffff", 0.25);

        if (!levels || levels.length === 0) {
            // Analyser may need a frame to attach. Draw only the real baseline
            // rather than a fake waveform.
            return;
        }

        const gap = panelW / bars;
        const barW = Math.max(1, Math.min(3, gap - 1));
        const maxH = panelH - 3;
        for (let i = 0; i < bars; i++) {
            const level = Math.max(0, Math.min(1, levels[i] || 0));
            const x = left + i * gap + (gap - barW) / 2;
            const h = Math.max(1, maxH * Math.min(1, level * 1.45));
            this.drawRect(stack, x, midY - h / 2, x + barW, midY + h / 2, "#ffffff", 0.92);
        }
    }

    renderAchievement(stack, partialTicks) {
        const mgr = this.minecraft.achievementManager;
        if (!mgr || !mgr.currentToast) return;

        const toast = mgr.currentToast;
        
        const w = 160;
        const h = 32;
        let x = this.window.width;
        const y = 0; 

        let t = mgr.toastTimer + partialTicks; 
        
        // Animation: slide in (0-20), stay, slide out (130-150)
        if (t < 20) {
            let p = t / 20;
            if (p < 0.8) {
                let subP = p / 0.8;
                subP = 1 - Math.pow(1 - subP, 3); 
                x = this.window.width - (w * subP + 10 * subP); 
            } else {
                let subP = (p - 0.8) / 0.2; 
                x = (this.window.width - w - 10) + (10 * subP);
            }
        } else if (t > 130) {
            let p = (t - 130) / 20;
            p = p * p; 
            x = (this.window.width - w) + (w * p);
        } else {
            x = this.window.width - w;
        }

        x = Math.floor(x);

        // Draw Toast Background
        this.drawRect(stack, x, y, x + w, y + h, "#202020");
        this.drawRect(stack, x + 2, y + 2, x + w - 2, y + h - 2, "#101010"); 

        // Draw Icon from advancements (1).png sheet
        let sheet = this.getTexture("../../advancements (1).png");
        if (sheet) {
            const iconIdx = toast.icon || 0;
            const sw = sheet.width / 29;
            this.drawSprite(stack, sheet, iconIdx * sw, 0, sw, sheet.height, x + 4, y + 4, 24, 24);
        }

        // Draw Text
        this.drawString(stack, "Achievement Get!", x + 34, y + 6, 0xFFFF00);
        this.drawString(stack, toast.name, x + 34, y + 16, 0xFFFFFF);
    }

}
