import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiCreateWorld from "./GuiCreateWorld.js";
import World from "../../world/World.js";
import GuiTextField from "../widgets/GuiTextField.js";
import MathHelper from "../../../util/MathHelper.js";

export default class GuiSelectWorld extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.selectedWorldIndex = -1;
        this.savedWorlds = [];
        this.totalStorageUsed = 0;
        this.isLoading = true;
    }

    init() {
        super.init();

        if (this.isLoading) {
            import("../../world/storage/WorldStorage.js").then(module => {
                const WorldStorage = module.default;
                WorldStorage.migrateFromLocalStorage().then(() => {
                    WorldStorage.getWorldList().then(list => {
                        this.savedWorlds = list;
                        this.totalStorageUsed = list.reduce((acc, w) => acc + (w.size || 0), 0);
                        this.isLoading = false;
                        this.init(); // Refresh UI after load
                    }).catch(err => {
                        console.error("Failed to load world list from IndexedDB:", err);
                        this.isLoading = false;
                        this.init();
                    });
                });
            }).catch(err => {
                console.error("Failed to load WorldStorage module:", err);
                this.isLoading = false;
                this.init();
            });
            return;
        }
        // Preserve scroll position across re-initializations (e.g. window resize)
        if (this.scrollY === undefined) this.scrollY = 0;
        
        this.itemHeight = 36;
        this.totalListHeight = this.savedWorlds.length * this.itemHeight;

        let y = this.height - 52;
        
        // Pre-calculate scroll limits to ensure scrollY is valid on init
        const listTop = 48;
        const listBottom = this.height - 64;
        const viewH = Math.max(1, listBottom - listTop);
        const maxScroll = Math.max(0, this.totalListHeight - viewH);
        this.scrollY = MathHelper.clamp(this.scrollY, 0, maxScroll);
        
        // Row 1
        this.buttonPlayWorld = new GuiButton("Play Selected World", this.width / 2 - 154, y, 150, 20, () => {
            if (this.selectedWorldIndex >= 0 && this.selectedWorldIndex < this.savedWorlds.length) {
                this.loadAndPlayWorld(this.savedWorlds[this.selectedWorldIndex]);
            }
        });
        this.buttonPlayWorld.setEnabled(this.selectedWorldIndex >= 0);
        this.buttonList.push(this.buttonPlayWorld);

        this.buttonList.push(new GuiButton("Create New World", this.width / 2 + 4, y, 150, 20, () => {
            this.minecraft.displayScreen(new GuiCreateWorldChoice(this));
        }));
        
        y += 24;

        // Row 2
        this.buttonEdit = new GuiButton("Edit", this.width / 2 - 154, y, 72, 20, () => {
            if (this.selectedWorldIndex >= 0 && this.selectedWorldIndex < this.savedWorlds.length) {
                this.minecraft.displayScreen(new GuiEditWorld(this, this.savedWorlds[this.selectedWorldIndex]));
            }
        });
        this.buttonEdit.setEnabled(this.selectedWorldIndex >= 0);
        this.buttonList.push(this.buttonEdit);
        
        this.buttonDelete = new GuiButton("Delete", this.width / 2 - 78, y, 72, 20, () => {
            if (this.selectedWorldIndex >= 0 && this.selectedWorldIndex < this.savedWorlds.length) {
                this.deleteWorld(this.savedWorlds[this.selectedWorldIndex]);
            }
        });
        this.buttonDelete.setEnabled(this.selectedWorldIndex >= 0);
        this.buttonList.push(this.buttonDelete);
        
        this.buttonRecreate = new GuiButton("Re-Create", this.width / 2 + 4, y, 72, 20, () => {
            if (this.selectedWorldIndex >= 0 && this.selectedWorldIndex < this.savedWorlds.length) {
                const info = this.savedWorlds[this.selectedWorldIndex];
                import("../../world/storage/WorldStorage.js").then(module => {
                    module.default.loadWorld(info.id).then(data => {
                        if (data) {
                            const preset = {
                                name: data.n,
                                seed: data.s,
                                worldType: data.wt,
                                gameMode: data.gm,
                                bonusChest: data.bonusChest
                            };
                            this.minecraft.displayScreen(new GuiCreateWorld(this, preset));
                        }
                    });
                });
            }
        });
        this.buttonRecreate.setEnabled(this.selectedWorldIndex >= 0);
        this.buttonList.push(this.buttonRecreate);
        
        this.buttonList.push(new GuiButton("Cancel", this.width / 2 + 82, y, 72, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));

        this.thumbnailTexture = this.getTexture("../../worldthumbnail (6).png");
        this.iconsTexture = this.getTexture("gui/icons.png");
    }

    handleMouseScroll(delta) {
        const listTop = 48;
        const listBottom = this.height - 64;
        const viewH = Math.max(1, listBottom - listTop);
        const maxScroll = Math.max(0, this.totalListHeight - viewH);
        
        // Correct scrolling direction: scrolling down (delta > 0) should increase scrollY
        // Increase sensitivity slightly (30 instead of 20)
        this.scrollY = MathHelper.clamp(this.scrollY + delta * 30, 0, maxScroll);
    }

    loadAndPlayWorld(worldInfo) {
        import("../../world/storage/WorldStorage.js").then(module => {
            const WorldStorage = module.default;
            WorldStorage.loadWorld(worldInfo.id).then(worldData => {
                if (!worldData) {
                    console.error("World data not found");
                    return;
                }
                // Pass gameMode (gm) to constructor for persistence
                const world = new World(this.minecraft, worldData.s, worldInfo.id, worldData.gm);
                world.name = worldData.n;
                world.worldType = worldData.wt !== undefined ? worldData.wt : (worldData.f === 1 ? 1 : 0);
                world._gameType = worldData.gt; 
                world.savedData = worldData;
                this.minecraft.loadWorld(world);
            });
        });
    }

    deleteWorld(worldInfo) {
        import("../../world/storage/WorldStorage.js").then(module => {
            const WorldStorage = module.default;
            WorldStorage.deleteWorld(worldInfo.id).then(() => {
                this.savedWorlds = this.savedWorlds.filter(w => w.id !== worldInfo.id);
                this.selectedWorldIndex = -1;
                this.init();
            });
        });
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);

        // Header - move title down slightly to avoid cutting off
        this.drawCenteredString(stack, "Select World", this.width / 2, 18);

        const listTop = 48;
        const listBottom = this.height - 64;
        const viewH = Math.max(1, listBottom - listTop);
        const slotHeight = 36;
        const listWidth = 260;
        const listX = this.width / 2 - listWidth / 2;

        // Clip the world list
        stack.save();
        stack.beginPath();
        stack.rect(0, listTop, this.width, viewH);
        stack.clip();

        for (let i = 0; i < this.savedWorlds.length; i++) {
            const world = this.savedWorlds[i];
            const y = listTop + i * slotHeight - this.scrollY;
            
            // Skip if completely out of bounds
            if (y + slotHeight < listTop || y > listBottom) continue;
            
            const isSelected = i === this.selectedWorldIndex;
            const isHovered = mouseY >= y && mouseY < y + slotHeight && mouseX >= listX && mouseX <= listX + listWidth && mouseY >= listTop && mouseY <= listBottom;
            
            // Draw background if hovered or selected
            if (isSelected) {
                // White border for selected item
                this.drawRect(stack, listX - 1, y - 1, listX + listWidth + 1, y + slotHeight + 1, "#FFFFFF");
                this.drawRect(stack, listX, y, listX + listWidth, y + slotHeight, "#000000");
            } else if (isHovered) {
                this.drawRect(stack, listX - 1, y - 1, listX + listWidth + 1, y + slotHeight + 1, "#808080");
                this.drawRect(stack, listX, y, listX + listWidth, y + slotHeight, "#000000");
            }
            
            // Draw thumbnail
            if (this.thumbnailTexture) {
                this.drawSprite(stack, this.thumbnailTexture, 0, 0, this.thumbnailTexture.width, this.thumbnailTexture.height, listX + 2, y + 2, 32, 32);
            } else {
                this.drawRect(stack, listX + 2, y + 2, listX + 34, y + 34, "#404040");
            }

            // Draw Play icon overlay on thumbnail if hovered/selected
            if (isHovered || isSelected) {
                this.drawRect(stack, listX + 2, y + 2, listX + 34, y + 34, "rgba(0,0,0,0.4)");
                // Draw a small white play triangle
                stack.save();
                stack.fillStyle = "#FFFFFF";
                stack.beginPath();
                stack.moveTo(listX + 12, y + 10);
                stack.lineTo(listX + 24, y + 18);
                stack.lineTo(listX + 12, y + 26);
                stack.closePath();
                stack.fill();
                stack.restore();
            }

            // Draw Text Info
            let textX = listX + 38;
            this.drawStringNoShadow(stack, world.name, textX, y + 4, 0xFFFFFF);

            let dateString = new Date(world.lastPlayed).toLocaleDateString();
            let timeString = new Date(world.lastPlayed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.drawStringNoShadow(stack, `${world.name} (${dateString}, ${timeString})`, textX, y + 14, 0x808080);
            
            // Mode and Version info
            let modeText = "Survival Mode";
            if (world.gm === 1) modeText = "Creative Mode";
            if (world.gm === 3) modeText = "Spectator Mode";

            let version = "Version: 1.0"; 
            this.drawStringNoShadow(stack, `${modeText}, ${version}`, textX, y + 24, 0x808080);
        }

        stack.restore();

        // Draw dark overlays for top and bottom to hide partially scrolled items, ensuring title is clear


        // Draw Scrollbar for visual feedback
        if (this.totalListHeight > viewH) {
            let scrollBarX = listX + listWidth + 6;
            let scrollBarWidth = 4;
            let scrollBarHeight = viewH;
            
            // Track
            this.drawRect(stack, scrollBarX, listTop, scrollBarX + scrollBarWidth, listBottom, "#000000", 0.5);
            
            // Thumb
            let viewableRatio = viewH / this.totalListHeight;
            let thumbHeight = Math.max(20, scrollBarHeight * viewableRatio);
            let scrollRatio = this.scrollY / (this.totalListHeight - viewH);
            let thumbY = listTop + scrollRatio * (scrollBarHeight - thumbHeight);
            
            this.drawRect(stack, scrollBarX, thumbY, scrollBarX + scrollBarWidth, thumbY + thumbHeight, "#808080");
        }



        const totalUsedMB = (this.totalStorageUsed / (1024 * 1024)).toFixed(2);
        // Display storage at bottom right
        this.drawRightString(stack, `Storage used: ${totalUsedMB} MB`, this.width - 5, this.height - 10, 0x808080);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const listTop = 48;
        const listBottom = this.height - 64;
        const slotHeight = 36;
        const listWidth = 260;
        const listX = this.width / 2 - listWidth / 2;
        
        if (mouseY >= listTop && mouseY <= listBottom && mouseX >= listX && mouseX <= listX + listWidth) {
            for (let i = 0; i < this.savedWorlds.length; i++) {
                const y = listTop + i * slotHeight - this.scrollY;
                if (y + slotHeight < listTop) continue;
                if (y > listBottom) break;

                if (mouseY >= y && mouseY < y + slotHeight) {
                    if (this.selectedWorldIndex === i && mouseButton === 0) {
                        // Double click/click on same item -> Play
                        this.loadAndPlayWorld(this.savedWorlds[i]);
                        return;
                    }
                    this.selectedWorldIndex = i;
                    this.buttonPlayWorld.setEnabled(true);
                    this.buttonDelete.setEnabled(true);
                    this.buttonEdit.setEnabled(true);
                    this.buttonRecreate.setEnabled(true);
                    break;
                }
            }
        }
        
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }
}

class GuiEditWorld extends GuiScreen {
    constructor(previousScreen, worldInfo) {
        super();
        this.previousScreen = previousScreen;
        this.worldInfo = worldInfo;
        this.data = null;
        this.isLoadingData = true;
    }

    init() {
        super.init();

        if (this.isLoadingData) {
            import("../../world/storage/WorldStorage.js").then(module => {
                module.default.loadWorld(this.worldInfo.id).then(data => {
                    if (data) {
                        this.data = data;
                        this.isLoadingData = false;
                        this.init();
                    } else {
                        this.minecraft.displayScreen(this.previousScreen);
                    }
                }).catch(() => {
                    this.minecraft.displayScreen(this.previousScreen);
                });
            });
            return;
        }

        const y = this.height / 4;
        
        this.fieldName = new GuiTextField(this.width / 2 - 100, y, 200, 20);
        this.fieldName.text = this.data.n;
        this.fieldName.maxLength = 32;
        this.buttonList.push(this.fieldName);

        this.buttonList.push(new GuiButton("Reset Name", this.width / 2 - 100, y + 24, 200, 20, () => {
            this.fieldName.text = this.data.n; 
        }));
        
        this.gameMode = (this.gameMode !== undefined) ? this.gameMode : this.data.gm;
        this.buttonList.push(new GuiButton("Save World", this.width / 2 - 100, this.height - 84, 98, 20, () => {
            this.saveChanges();
        }));

        this.buttonList.push(new GuiButton("Download", this.width / 2 + 2, this.height - 84, 98, 20, () => {
            this.downloadWorld();
        }));

        this.buttonList.push(new GuiButton("Cancel", this.width / 2 - 100, this.height - 52, 200, 20, () => {
             this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    saveChanges() {
        const newName = this.fieldName.getText();
        this.data.n = newName;
        this.data.gm = this.gameMode;
        
        // Update the reference used by the parent list immediately
        if (this.worldInfo) {
            this.worldInfo.name = newName;
            this.worldInfo.gm = this.gameMode;
        }
        
        import("../../world/storage/WorldStorage.js").then(module => {
            module.default.saveWorld(this.worldInfo.id, this.data).then(() => {
                // Ensure the list re-initializes to show updated metadata
                if (this.previousScreen instanceof GuiSelectWorld) {
                    this.previousScreen.isLoading = true;
                }
                this.minecraft.displayScreen(this.previousScreen);
            });
        });
    }

    downloadWorld() {
        if (!this.data) return;
        try {
            // Apply current field values to data object before download
            const downloadData = { ...this.data };
            downloadData.n = this.fieldName.getText();
            downloadData.gm = this.gameMode;

            const json = JSON.stringify(downloadData, null, 2);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (downloadData.n || "world") + ".json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to download world:", e);
        }
    }
    
    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Edit World", this.width / 2, 20);
        
        if (this.isLoadingData) {
            this.drawCenteredString(stack, "Loading world data...", this.width / 2, this.height / 2, 0xAAAAAA);
        } else {
            this.drawString(stack, "World Name", this.width / 2 - 100, this.height / 4 - 12, 0xA0A0A0);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}

class GuiCreateWorldChoice extends GuiScreen {
    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
    }

    init() {
        super.init();
        let y = this.height / 2 - 30;
        this.buttonList.push(new GuiButton("Create New World", this.width / 2 - 100, y, 200, 20, () => {
            this.minecraft.displayScreen(new GuiCreateWorld(this.previousScreen));
        }));
        this.buttonList.push(new GuiButton("Load Previous World", this.width / 2 - 100, y + 24, 200, 20, () => {
            this.importWorld();
        }));
        this.buttonList.push(new GuiButton("Back", this.width / 2 - 100, y + 54, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    importWorld() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    // Extract properties
                    const seed = data.s || "0";
                    const name = data.n || "Imported World";
                    const worldId = data.id || 'w_imp_' + Date.now();
                    
                    const world = new World(this.minecraft, seed, worldId);
                    world.name = name;
                    world.savedData = data;
                    
                    import("../../world/storage/WorldStorage.js").then(module => {
                        module.default.saveWorld(worldId, data).then(() => {
                            this.minecraft.loadWorld(world);
                        });
                    });
                } catch(err) {
                    console.error("Failed to import world:", err);
                    if (this.minecraft.addMessageToChat) {
                        this.minecraft.addMessageToChat("§cFailed to import world file.");
                    }
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Select Action", this.width / 2, this.height / 2 - 60);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}