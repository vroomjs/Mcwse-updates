import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import Block from "../../world/block/Block.js";
import BoundingBox from "../../../util/BoundingBox.js";

export default class GuiStructureBlock extends GuiScreen {

    constructor(player, x, y, z, tileEntity) {
        super();
        this.player = player;
        this.world = player.world;
        this.pos = {x, y, z};
        this.te = tileEntity;
    }

    init() {
        super.init();

        const centerX = this.width / 2;
        const startY = 40;

        // Structure Name
        this.fieldName = new GuiTextField(centerX - 100, startY, 200, 20);
        this.fieldName.text = this.te.name || "";
        this.fieldName.maxLength = 64;
        this.buttonList.push(this.fieldName);

        // Mode Toggle
        this.btnMode = new GuiButton("Mode: " + (this.te.mode || "SAVE"), centerX - 100, startY + 24, 200, 20, () => {
            this.te.mode = (this.te.mode === "SAVE" ? "LOAD" : "SAVE");
            this.btnMode.string = "Mode: " + this.te.mode;
            this.refreshButtons();
        });
        this.buttonList.push(this.btnMode);

        // Offset Inputs (X, Y, Z)
        let rowY = startY + 54;
        this.fieldOffX = new GuiTextField(centerX - 100, rowY, 64, 20);
        this.fieldOffX.text = String(this.te.offsetX || 0);
        this.buttonList.push(this.fieldOffX);

        this.fieldOffY = new GuiTextField(centerX - 32, rowY, 64, 20);
        this.fieldOffY.text = String(this.te.offsetY || 0);
        this.buttonList.push(this.fieldOffY);

        this.fieldOffZ = new GuiTextField(centerX + 36, rowY, 64, 20);
        this.fieldOffZ.text = String(this.te.offsetZ || 0);
        this.buttonList.push(this.fieldOffZ);

        // Size Inputs (X, Y, Z)
        rowY += 30;
        this.fieldSizeX = new GuiTextField(centerX - 100, rowY, 64, 20);
        this.fieldSizeX.text = String(this.te.sizeX || 1);
        this.buttonList.push(this.fieldSizeX);

        this.fieldSizeY = new GuiTextField(centerX - 32, rowY, 64, 20);
        this.fieldSizeY.text = String(this.te.sizeY || 1);
        this.buttonList.push(this.fieldSizeY);

        this.fieldSizeZ = new GuiTextField(centerX + 36, rowY, 64, 20);
        this.fieldSizeZ.text = String(this.te.sizeZ || 1);
        this.buttonList.push(this.fieldSizeZ);

        // Action Buttons
        rowY += 30;
        this.btnAction = new GuiButton(this.te.mode === "SAVE" ? "SAVE" : "LOAD", centerX - 100, rowY, 98, 20, () => {
            this.applyData();
            if (this.te.mode === "SAVE") this.saveStructure();
            else this.loadStructure();
        });
        this.buttonList.push(this.btnAction);

        this.btnExport = new GuiButton("EXPORT", centerX + 2, rowY, 98, 20, () => {
            this.applyData();
            this.exportStructure();
        });
        this.buttonList.push(this.btnExport);

        // Footer
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 30, 98, 20, () => {
            this.applyData();
            this.minecraft.displayScreen(null);
        }));

        this.buttonList.push(new GuiButton("Cancel", centerX + 2, this.height - 30, 98, 20, () => {
            this.minecraft.displayScreen(null);
        }));

        this.refreshButtons();
    }

    refreshButtons() {
        if (this.btnAction) this.btnAction.string = this.te.mode === "SAVE" ? "SAVE" : "LOAD";
    }

    applyData() {
        this.te.name = this.fieldName.getText();
        this.te.offsetX = parseInt(this.fieldOffX.getText()) || 0;
        this.te.offsetY = parseInt(this.fieldOffY.getText()) || 0;
        this.te.offsetZ = parseInt(this.fieldOffZ.getText()) || 0;
        this.te.sizeX = Math.max(1, Math.min(32, parseInt(this.fieldSizeX.getText()) || 1));
        this.te.sizeY = Math.max(1, Math.min(32, parseInt(this.fieldSizeY.getText()) || 1));
        this.te.sizeZ = Math.max(1, Math.min(32, parseInt(this.fieldSizeZ.getText()) || 1));
        
        // Persist back to world
        this.world.setTileEntity(this.pos.x, this.pos.y, this.pos.z, this.te);
        // Force world renderer rebuild to update outline
        this.minecraft.worldRenderer.flushRebuild = true;
    }

    async saveStructure() {
        if (!this.te.name) {
            this.minecraft.addMessageToChat("§cPlease enter a structure name.");
            return;
        }

        const data = this.captureData();
        
        try {
            const module = await import("../../world/storage/WorldStorage.js");
            await module.default.saveStructure(this.te.name, data);
            this.minecraft.addMessageToChat("§eStructure '" + this.te.name + "' saved to local storage.");
        } catch (e) {
            console.error(e);
            this.minecraft.addMessageToChat("§cFailed to save structure.");
        }
    }

    async loadStructure() {
        if (!this.te.name) return;

        try {
            const module = await import("../../world/storage/WorldStorage.js");
            const data = await module.default.loadStructure(this.te.name);

            if (data) {
                this.spawnData(data);
                this.minecraft.addMessageToChat("§aStructure '" + this.te.name + "' loaded.");
            } else {
                this.minecraft.addMessageToChat("§cStructure '" + this.te.name + "' not found locally.");
            }
        } catch (e) {
            console.error(e);
        }
    }

    captureData() {
        const blocks = [];
        const entities = [];
        const tileEntities = {};
        const sx = this.te.sizeX;
        const sy = this.te.sizeY;
        const sz = this.te.sizeZ;
        const ox = this.pos.x + this.te.offsetX;
        const oy = this.pos.y + this.te.offsetY;
        const oz = this.pos.z + this.te.offsetZ;

        const volume = new BoundingBox(ox, oy, oz, ox + sx, oy + sy, oz + sz);

        for (let x = 0; x < sx; x++) {
            for (let y = 0; y < sy; y++) {
                for (let z = 0; z < sz; z++) {
                    const wx = ox + x;
                    const wy = oy + y;
                    const wz = oz + z;
                    const id = this.world.getBlockAt(wx, wy, wz);
                    const data = this.world.getBlockDataAt(wx, wy, wz);
                    if (id !== 0) {
                        blocks.push([x, y, z, id, data]);
                        
                        // Capture Tile Entity Data (Chest contents, Spawner types, etc)
                        const te = this.world.getTileEntity(wx, wy, wz);
                        if (te && id !== 255) { // Skip recursive structure blocks
                            tileEntities[`${x},${y},${z}`] = te;
                        }
                    }
                }
            }
        }

        // Capture Entities in the area
        for (const entity of this.world.entities) {
            if (entity === this.player || entity.constructor.name === "RemotePlayerEntity") continue;
            if (volume.intersects(entity.boundingBox)) {
                entities.push({
                    class: entity.constructor.name,
                    rx: entity.x - ox,
                    ry: entity.y - oy,
                    rz: entity.z - oz,
                    yaw: entity.rotationYaw,
                    pitch: entity.rotationPitch,
                    data: {
                        isChild: entity.isChild,
                        attributeScale: entity.attributeScale,
                        profession: entity.profession,
                        sheared: entity.sheared,
                        carriedBlockId: entity.carriedBlockId,
                        carriedBlockData: entity.carriedBlockData,
                        size: entity.size
                    }
                });
            }
        }

        return {
            v: 2,
            size: [sx, sy, sz],
            blocks: blocks,
            tileEntities: tileEntities,
            entities: entities,
            meta: {
                author: this.player.username,
                date: Date.now()
            }
        };
    }

    spawnData(data) {
        const ox = this.pos.x + this.te.offsetX;
        const oy = this.pos.y + this.te.offsetY;
        const oz = this.pos.z + this.te.offsetZ;

        // 1. Restore Blocks and Tile Entities
        for (const [rx, ry, rz, id, blockData] of data.blocks) {
            const wx = ox + rx;
            const wy = oy + ry;
            const wz = oz + rz;
            this.world.setBlockAt(wx, wy, wz, id, blockData, true);
            
            const teKey = `${rx},${ry},${rz}`;
            if (data.tileEntities && data.tileEntities[teKey]) {
                this.world.setTileEntity(wx, wy, wz, JSON.parse(JSON.stringify(data.tileEntities[teKey])));
            }
        }

        // 2. Restore Entities
        if (data.entities) {
            for (const ent of data.entities) {
                const ClassRef = this.minecraft.commandHandler.mobMap[ent.class.replace("Entity", "").toLowerCase()];
                if (ClassRef) {
                    const entity = new ClassRef(this.minecraft, this.world);
                    entity.setPosition(ox + ent.rx, oy + ent.ry, oz + ent.rz);
                    entity.rotationYaw = ent.yaw;
                    entity.rotationPitch = ent.pitch;
                    if (ent.data) {
                        Object.assign(entity, ent.data);
                        if (typeof entity.setPosition === 'function') entity.setPosition(entity.x, entity.y, entity.z);
                    }
                    this.world.addEntity(entity);
                }
            }
        }
        
        if (this.minecraft.worldRenderer) this.minecraft.worldRenderer.flushRebuild = true;
    }

    exportStructure() {
        const data = this.captureData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (this.te.name || "structure") + ".json";
        a.click();
        URL.revokeObjectURL(url);
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Structure Block Settings", this.width / 2, 15);
        
        let y = 30;
        this.drawString(stack, "Structure Name", this.width / 2 - 100, y, 0xA0A0A0);
        y += 54;
        this.drawString(stack, "Relative Offset (X, Y, Z)", this.width / 2 - 100, y - 10, 0xA0A0A0);
        y += 30;
        this.drawString(stack, "Structure Size (X, Y, Z)", this.width / 2 - 100, y - 10, 0xA0A0A0);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}