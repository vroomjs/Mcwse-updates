import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import MathHelper from "../../../util/MathHelper.js";
import JSZip from "jszip";

export default class GuiMods extends GuiScreen {
    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.savedMods = [];
        this.isLoading = true;
        this.scrollY = 0;
    }

    init() {
        super.init();
        if (this.isLoading) {
            import("../../world/storage/WorldStorage.js").then(module => {
                module.default.getModList().then(list => {
                    this.savedMods = list;
                    this.isLoading = false;
                    this.init();
                });
            });
            return;
        }

        const centerX = this.width / 2;
        if(!this.savedMods.some(m=>m.builtin==='entity-culling')) this.savedMods.unshift({name:'Entity Culling',version:'Built-in browser port',size:0,builtin:'entity-culling'});
        if(!this.savedMods.some(m=>m.builtin==='replaymod')) this.savedMods.splice(1,0,{name:'ReplayMod',version:'Built-in browser port',size:0,builtin:'replaymod'});
        if(!this.savedMods.some(m=>m.builtin==='modernfix')) this.savedMods.splice(5,0,{name:'ModernFix',version:'Built-in browser optimization port',size:0,builtin:'modernfix'});
        if(!this.savedMods.some(m=>m.builtin==='dynamicfps')) this.savedMods.splice(6,0,{name:'Dynamic FPS',version:'Built-in browser port',size:0,builtin:'dynamicfps'});
        if(!this.savedMods.some(m=>m.builtin==='clumps')) this.savedMods.splice(12,0,{name:'Clumps',version:'Built-in browser port',size:0,builtin:'clumps'});
        if(!this.savedMods.some(m=>m.builtin==='memoryleakfix')) this.savedMods.splice(13,0,{name:'MemoryLeakFix',version:'Built-in browser port',size:0,builtin:'memoryleakfix'});
        if(!this.savedMods.some(m=>m.builtin==='zoomify')) this.savedMods.splice(7,0,{name:'Zoomify',version:'Built-in browser port',size:0,builtin:'zoomify'});
        if(!this.savedMods.some(m=>m.builtin==='dynamiclights')) this.savedMods.splice(8,0,{name:'LambDynamicLights',version:'Built-in browser port',size:0,builtin:'dynamiclights'});
        if(!this.savedMods.some(m=>m.builtin==='soundphysics')) this.savedMods.splice(9,0,{name:'Sound Physics Remastered',version:'Built-in browser audio port',size:0,builtin:'soundphysics'});
        if(!this.savedMods.some(m=>m.builtin==='chatheads')) this.savedMods.splice(10,0,{name:'Chat Heads',version:'Built-in browser port',size:0,builtin:'chatheads'});
        this.buttonList.push(new GuiButton(`Sound Physics: ${this.minecraft.soundPhysics?.enabled ? 'ON' : 'OFF'}`, centerX-154, this.height - 172, 150, 20, () => { const m=this.minecraft.soundPhysics; m?.setEnabled(!m.enabled); this.init(); }));
        this.buttonList.push(new GuiButton(`Chat Heads: ${this.minecraft.chatHeads?.enabled ? 'ON' : 'OFF'}`, centerX+4, this.height - 172, 150, 20, () => { const m=this.minecraft.chatHeads; m?.setEnabled(!m.enabled); this.init(); }));
        this.buttonList.push(new GuiButton(`Zoomify: ${this.minecraft.zoomify?.enabled ? 'ON (V)' : 'OFF'}`, centerX-154, this.height - 148, 150, 20, () => { const z=this.minecraft.zoomify; z?.setEnabled(!z.enabled); this.init(); }));
        this.buttonList.push(new GuiButton(`LambDynamicLights: ${this.minecraft.lambDynamicLights?.enabled ? 'ON' : 'OFF'}`, centerX+4, this.height - 148, 150, 20, () => { const l=this.minecraft.lambDynamicLights; l?.setEnabled(!l.enabled); this.init(); }));
        this.buttonList.push(new GuiButton(`Clumps: ${this.minecraft.clumps?.enabled ? 'ON' : 'OFF'}`, centerX-154, this.height - 220, 150, 20, () => { const m=this.minecraft.clumps; m?.setEnabled(!m.enabled); this.init(); }));
        this.buttonList.push(new GuiButton(`MemoryLeakFix: ${this.minecraft.memoryLeakFix?.enabled ? 'ON' : 'OFF'}`, centerX+4, this.height - 220, 150, 20, () => { const m=this.minecraft.memoryLeakFix; m?.setEnabled(!m.enabled); this.init(); }));
        this.buttonList.push(new GuiButton(`Dynamic FPS: ${this.minecraft.dynamicFPS?.active ? 'ON' : 'OFF'}`, centerX+4, this.height - 124, 150, 20, () => { const d=this.minecraft.dynamicFPS; d?.setEnabled(!d.active); this.init(); }));
        this.buttonList.push(new GuiButton(`ModernFix: ${localStorage.getItem('mc_modernfix') === '0' ? 'OFF' : 'ON'}`, centerX-154, this.height - 124, 150, 20, () => { const on=localStorage.getItem('mc_modernfix') !== '0'; localStorage.setItem('mc_modernfix',on?'0':'1'); this.init(); }));
        this.buttonList.push(new GuiButton(`ReplayMod: ${this.minecraft.replayRecorder?.recording ? 'RECORDING' : 'READY'}`, centerX+4, this.height - 76, 150, 20, () => { const r=this.minecraft.replayRecorder; if(!r)return; if(r.recording){r.stop();r.download();}else r.start(); this.init(); }));
        this.buttonList.push(new GuiButton(`Entity Culling: ${localStorage.getItem('mc_entity_culling') === '0' ? 'OFF' : 'ON'}`, centerX-154, this.height - 76, 150, 20, () => { const on=localStorage.getItem('mc_entity_culling') !== '0'; localStorage.setItem('mc_entity_culling',on?'0':'1'); this.init(); }));
        this.buttonList.push(new GuiButton("Upload Mod (.zip)", centerX - 154, this.height - 52, 150, 20, () => {
            this.openModZipPicker();
        }));

        this.buttonList.push(new GuiButton("How-to-mod", centerX + 4, this.height - 52, 150, 20, () => {
            import("./GuiModHowTo.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 28, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    openModZipPicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const module = await import("../../world/storage/WorldStorage.js");
            await module.default.saveMod(file.name, file);
            this.minecraft.addMessageToChat("§aMod uploaded! Refreshing...");
            this.isLoading = true;
            this.init();
            // In a real impl, we'd trigger mod loading here. For now, prompt restart or refresh.
            if (confirm("Mod uploaded. The game needs to reload to apply modded blocks. Reload now?")) {
                window.location.reload();
            }
        };
        input.click();
    }

    handleMouseScroll(delta) {
        const listTop = 32;
        const listBottom = this.height - 64;
        const viewH = listBottom - listTop;
        const totalH = this.savedMods.length * 36;
        if (totalH > viewH) {
            this.scrollY = MathHelper.clamp(this.scrollY + delta * 30, 0, totalH - viewH);
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        if(!this.experimental)this.drawDefaultBackground(stack);
        if(!this.experimental)this.drawCenteredString(stack, "Mods Management", this.width / 2, 12);

        if (this.isLoading) {
            this.drawCenteredString(stack, "Loading mods...", this.width / 2, this.height / 2, 0xAAAAAA);
        } else {
            const listTop = 32;
            const listBottom = this.height - 64;
            const listX = this.width / 2 - 130;
            const listW = 260;
            const slotH = 36;

            stack.save();
            stack.beginPath();
            stack.rect(listX, listTop, listW, listBottom - listTop);
            stack.clip();

            for (let i = 0; i < this.savedMods.length; i++) {
                const mod = this.savedMods[i];
                const y = listTop + i * slotH - this.scrollY;
                if (y + slotH < listTop || y > listBottom) continue;

                this.drawRect(stack, listX, y, listX + listW, y + slotH - 2, "rgba(0,0,0,0.5)");
                this.drawStringNoShadow(stack, mod.name, listX + 5, y + 5, 0xFFFFFF);
                const sizeKB = (mod.size / 1024).toFixed(0) + " KB";
                this.drawStringNoShadow(stack, sizeKB, listX + 5, y + 16, 0x808080);

                const deleteX = listX + listW - 30;
                const btnSize = 22;
                const isDelHover = mouseX >= deleteX && mouseX < deleteX + btnSize && mouseY >= y + 4 && mouseY < y + 4 + btnSize;
                
                this.drawRect(stack, deleteX, y + 4, deleteX + btnSize, y + 4 + btnSize, isDelHover ? "#FF5555" : "#AA0000");
                this.drawCenteredStringNoShadow(stack, "X", deleteX + btnSize/2, y + 4 + btnSize/2 - 4, 0xFFFFFF);
            }
            stack.restore();
        }
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const listTop = 32;
        const listBottom = this.height - 64;
        const listX = this.width / 2 - 130;
        const listW = 260;
        const slotH = 36;

        if (mouseX >= listX && mouseX <= listX + listW && mouseY >= listTop && mouseY <= listBottom) {
            const idx = Math.floor((mouseY - listTop + this.scrollY) / slotH);
            if (idx >= 0 && idx < this.savedMods.length) {
                const mod = this.savedMods[idx];
                const deleteX = listX + listW - 30;
                if (mouseX >= deleteX && mouseX <= deleteX + 22 && !mod.builtin) {
                    import("../../world/storage/WorldStorage.js").then(module => {
                        module.default.deleteMod(mod.name).then(() => {
                            this.isLoading = true;
                            this.init();
                        });
                    });
                }
            }
        }
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }
}