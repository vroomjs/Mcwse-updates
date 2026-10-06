import Point from "../render/isometric/Point.js";
import IsometricRenderer from "../render/isometric/IsometricRenderer.js";
import EnumBlockFace from "../../util/EnumBlockFace.js";
import BlockRenderType from "../../util/BlockRenderType.js";

export default class Gui {

    constructor(minecraft = null) {
        this.minecraft = minecraft;

        // Cache for tinted item icons to avoid rebuilding every frame
        this._tintedIconCache = {};
    }

    getTexture(id) {
        return this.minecraft.resources[id];
    }

    // Resource-pack images are decoded with createImageBitmap(), which exposes
    // width/height but not the HTMLImageElement naturalWidth/naturalHeight
    // properties used by the older GUI screens. Keep both image types usable.
    getTextureWidth(texture, fallback = 0) {
        return texture ? (texture.naturalWidth || texture.width || fallback) : fallback;
    }

    getTextureHeight(texture, fallback = 0) {
        return texture ? (texture.naturalHeight || texture.height || fallback) : fallback;
    }

    refreshTextureReferences() {
        const bindings = {
            textureBackground: "gui/background.png",
            textureGui: "gui/gui.png",
            textureCrosshair: "gui/icons.png",
            textureHotbar: "gui/gui.png",
            inventoryBackground: "../../inventoryUIborder.png",
            inventoryUIBorder: "../../inventoryUIborder.png",
            windowBorder: "../../inventoryUIborder.png",
            inventorySlot: "../../inventoryslot.png",
            arrow: "../../arrow_0_0.png",
            tabSelected: "../../tabselected_1_0 (2).png",
            tabUnselected: "../../tabnotselected_0_0 (8).png",
            bookTexture: "../../recipe_book.png",
            recipeBook: "../../recipe_book.png",
            iconsTexture: "gui/icons.png",
            iconsSheet: "../../advancements (1).png",
            advTexture: "../../advancements (2).png"
        };

        for (const [property, key] of Object.entries(bindings)) {
            if (!Object.prototype.hasOwnProperty.call(this, property)) continue;
            const texture = this.getTexture(key);
            if (texture) this[property] = texture;
        }

        this._tintedIconCache = {};
    }

    /**
     * Return a cached (or newly created) tinted canvas for foliage/grass sprites.
     * block : Block instance
     */
    getTintedIconCanvas(block) {
        if (!block) return null;
        const id = block.getId();
        // Only tint for greenery IDs: grass block(2), grass(31), fern(32), tall grass(204), large fern(190), vines(106), lily pad(567)
        if (![2, 31, 32, 204, 190, 106, 567].includes(id)) return null;

        if (this._tintedIconCache[id]) return this._tintedIconCache[id];

        // Determine source texture
        let texture;
        // For grass block (id 2) use atlas blocks.png and top face texture index
        if (id === 2) {
            texture = this.getTexture("../../blocks.png");
            const texIndex = block.getTextureForFace(EnumBlockFace.TOP);
            if (!texture) return null;

            const spriteW = 16;
            const spriteH = 16;
            const cols = 14;
            const sx = (texIndex % cols) * spriteW;
            const sy = Math.floor(texIndex / cols) * spriteH;

            const canvas = document.createElement('canvas');
            canvas.width = spriteW;
            canvas.height = spriteH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(texture, sx, sy, spriteW, spriteH, 0, 0, spriteW, spriteH);

            const color = block.getColor(null, 0, 0, 0, EnumBlockFace.TOP);
            const r = (color >> 16) & 255;
            const g = (color >> 8) & 255;
            const b = color & 255;

            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, spriteW, spriteH);
            ctx.globalCompositeOperation = 'destination-in';
            const mask = document.createElement('canvas');
            mask.width = spriteW; mask.height = spriteH;
            const mctx = mask.getContext('2d');
            mctx.imageSmoothingEnabled = false;
            mctx.drawImage(texture, sx, sy, spriteW, spriteH, 0, 0, spriteW, spriteH);
            ctx.drawImage(mask, 0, 0);

            this._tintedIconCache[id] = canvas;
            return canvas;
        } else {
            // foliage, ferns, vines use the foliage.png atlas
            let path = block.textureName;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            texture = this.getTexture(path) || this.getTexture(block.textureName);
            if (!texture) return null;

            // foliage.png has 21 columns
            const cols = path.includes("foliage.png") ? 21 : (block.textureName === "grasslandfoliage.png" ? 5 : 3);
            const spriteW = Math.floor(texture.width / cols);
            const spriteH = texture.height;
            const sx = (block.textureIndex % cols) * spriteW;
            const sy = 0;

            const canvas = document.createElement('canvas');
            canvas.width = spriteW;
            canvas.height = spriteH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(texture, sx, sy, spriteW, spriteH, 0, 0, spriteW, spriteH);

            const color = block.getColor(null, 0, 0, 0, null);
            const r = (color >> 16) & 255;
            const g = (color >> 8) & 255;
            const b = color & 255;

            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, spriteW, spriteH);
            ctx.globalCompositeOperation = 'destination-in';
            const mask = document.createElement('canvas');
            mask.width = spriteW; mask.height = spriteH;
            const mctx = mask.getContext('2d');
            mctx.imageSmoothingEnabled = false;
            mctx.drawImage(texture, sx, sy, spriteW, spriteH, 0, 0, spriteW, spriteH);
            ctx.drawImage(mask, 0, 0);

            this._tintedIconCache[id] = canvas;
            return canvas;
        }
    }

    drawCenteredString(stack, string, x, y, color = -1) {
        this.minecraft.fontRenderer.drawString(stack, string, x - this.getStringWidth(stack, string) / 2, y, color);
    }

    drawCenteredStringNoShadow(stack, string, x, y, color = -1) {
        this.minecraft.fontRenderer.drawString(stack, string, x - this.getStringWidth(stack, string) / 2, y, color, false);
    }

    drawRightString(stack, string, x, y, color = -1) {
        this.minecraft.fontRenderer.drawString(stack, string, x - this.getStringWidth(stack, string), y, color);
    }

    // Keep stack counts anchored to the same bottom-right corner for every
    // container slot. The slot origin is its top-left content coordinate.
    drawItemCount(stack, count, x, y) {
        if (count > 1) {
            this.drawRightString(stack, String(count), x + 17, y + 9, 0xFFFFFF);
        }
    }

    drawString(stack, string, x, y, color = -1) {
        this.minecraft.fontRenderer.drawString(stack, string, x, y, color, true);
    }

    drawStringNoShadow(stack, string, x, y, color = -1) {
        this.minecraft.fontRenderer.drawString(stack, string, x, y, color, false);
    }

    getStringWidth(stack, string) {
        return this.minecraft.fontRenderer.getStringWidth(string);
    }

    drawRect(stack, left, top, right, bottom, color, alpha = 1) {
        stack.save();
        stack.fillStyle = color;
        stack.globalAlpha = alpha;
        stack.fillRect(Math.floor(left), Math.floor(top), Math.floor(right - left), Math.floor(bottom - top));
        stack.restore();
    }

    drawGradientRect(stack, left, top, right, bottom, color1, color2) {
        let gradient = stack.createLinearGradient(left + (right - left) / 2, top, left + (right - left) / 2, bottom - top);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        stack.fillStyle = gradient;
        stack.fillRect(left, top, right - left, bottom - top);
    }

    /**
     * 10x10 "unseen notification" badge: a red tile with a yellow exclamation
     * mark. Drawn procedurally from the reference pixels so it needs no texture
     * and stays crisp at any GUI scale.
     */
    drawUnseenBadge(stack, x, y, scale = 1) {
        const FILL = "#D22323";
        const EDGE = "#740A0A";
        const CORNER = "#6E0808";
        const MARK = "#FFFF55";

        const p = (a, b, c, d, color) => this.drawRect(
            stack,
            x + a * scale, y + b * scale,
            x + c * scale, y + d * scale,
            color
        );

        p(0, 0, 10, 10, EDGE);
        p(1, 1, 9, 9, FILL);

        // The four corner pixels are a shade darker than the rest of the edge.
        p(0, 0, 1, 1, CORNER);
        p(9, 0, 10, 1, CORNER);
        p(0, 9, 1, 10, CORNER);
        p(9, 9, 10, 10, CORNER);

        // Exclamation mark: 2px stem over a 1px gap, then the dot.
        p(4, 2, 6, 6, MARK);
        p(4, 7, 6, 8, MARK);
    }

    drawTexture(stack, texture, x, y, width, height, alpha = 1.0) {
        Gui.drawSprite(stack, texture, 0, 0, 256, 256, x, y, width, height, alpha);
    }

    drawSprite(stack, texture, spriteX, spriteY, spriteWidth, spriteHeight, x, y, width, height, alpha = 1.0) {
        Gui.drawSprite(stack, texture, spriteX, spriteY, spriteWidth, spriteHeight, x, y, width, height, alpha);
    }

    drawBackground(stack, texture, width, height, scale = 2) {
        let pattern = stack.createPattern(texture, "repeat");
        stack.save();
        // Disable slow CSS filter
        // stack.filter = "brightness(28%)";
        stack.scale(scale, scale);
        stack.rect(0, 0, width / scale, height / scale);
        stack.fillStyle = pattern;
        stack.fill();
        
        // Use a semi-transparent black overlay for darkening instead (much faster)
        stack.fillStyle = "rgba(0, 0, 0, 0.72)";
        stack.fillRect(0, 0, width / scale, height / scale);
        
        stack.restore();
    }

    renderItem(stack, block, x, y, size) {
        let texture;
        let spriteWidth = 16;
        let spriteHeight = 16;
        let textureIndex = 0;
        let textureCols = 16;
        let textureRows = 1;

        // Attempt to use a pre-tinted icon for grass/fern/foliage
        const tinted = this.getTintedIconCanvas(block);
        if (tinted) {
            // Draw the tinted canvas scaled to requested size
            stack.drawImage(tinted, 0, 0, tinted.width, tinted.height, x, y, size, size);
            return;
        }

        // Special priority for redstone stuff to prevent full-spritesheet bug
        if (block.textureName && block.textureName.toLowerCase().includes("redstonestuff")) {
            texture = this.getTexture("../../redstonestuff.png") || this.getTexture("redstonestuff.png") || this.getTexture(block.textureName);
            if (texture) {
                const cols = 22;
                const sw = texture.width / cols;
                // Ensure we use the block's specific textureIndex (0: item, 1: dust, 6/7: torch, etc)
                this.drawSprite(stack, texture, (block.textureIndex || 0) * sw, 0, sw, texture.height, x, y, size, size);
                return;
            }
        }

        if (block.textureWidth > 0 && block.textureHeight > 0) {
            texture = this.getTexture(block.textureName) || this.getTexture("../../" + block.textureName);
            textureCols = Math.floor(block.textureWidth / 16);
            textureRows = Math.floor(block.textureHeight / 16);
            textureIndex = block.textureIndex || 0;
        } else if (block.getRenderType() === BlockRenderType.ORE || block.getRenderType() === BlockRenderType.MINERAL || block.getRenderType() === BlockRenderType.STRUCTURE_BLOCK) {
            let path = block.textureName;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            texture = this.getTexture(path) || this.getTexture(block.textureName);
            textureIndex = block.textureIndex || 0;
            textureCols = 1;
            if (path && path.includes("orestuff.png")) textureCols = 14;
            else if (path && path.includes("stonesheet.png")) textureCols = 8;
            else if (path && path.includes("nether.png")) textureCols = 5;
            else if (path && path.includes("endstuff.png")) textureCols = 7;
            else if (path && path.includes("magma")) textureCols = 3;
            else if (texture && texture.width > texture.height) textureCols = Math.floor(texture.width / texture.height);
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.CROSS) {
            let path = block.textureName;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            texture = this.getTexture(path) || this.getTexture(block.textureName);
            textureIndex = block.textureIndex;
            
            if (path && path.includes("foliage.png")) {
                textureCols = 21;
            } else if (block.textureName) {
                const name = block.textureName.toLowerCase();
                if (name.includes("deadandsugar")) textureCols = 2;
                else if (name.includes("grasslandfoliage")) textureCols = 5;
                else if (name.includes("sandstuff")) textureCols = 10;
                else if (name.includes("tulip") || name.includes("lily") || name.includes("mushroom") || name.includes("sapling") || name.includes("wheat_stage") || name.includes("beetroot")) textureCols = 7;
                else textureCols = 3;
            } else {
                textureCols = 3;
            }
        } else if (block.getRenderType() === BlockRenderType.CRAFTING_TABLE) {
            texture = this.getTexture(block.textureName);
            textureIndex = block.getTextureForFace(EnumBlockFace.NORTH); // Show front texture
            textureCols = 3; // The spritesheet has 3 sprites
        } else if (block.getRenderType() === BlockRenderType.DOOR) {
            let path = block.textureName;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            texture = this.getTexture(path) || this.getTexture(block.textureName);
            // Use specific icon index if provided, otherwise fallback to textureIndex
            textureIndex = (block.iconIndex !== undefined) ? block.iconIndex : (block.textureIndex || 0); 
            textureCols = 17;
        } else if (block.getRenderType() === BlockRenderType.TRAPDOOR) {
            texture = this.getTexture(block.textureName);
            textureIndex = block.textureIndex || 0; 
            textureCols = 6;
        } else if (block.getRenderType() === BlockRenderType.CHEST) {
            // Chest uses a 3-column spritesheet: front / sides / top -> use front (column 0) for inventory icon
            texture = this.getTexture(block.textureName);
            textureIndex = 0; // front
            textureCols = 3;
        } else if (block.getRenderType() === BlockRenderType.FURNACE) {
            // Furnace spritesheet columns: 0=Lit Front, 1=Unlit Front, 2=Sides, 3=Top/Bottom
            // For inventory/icon we want the (unlit) front face
            texture = this.getTexture(block.textureName);
            textureIndex = 1; // unlit front
            textureCols = 4;
        } else if (block.getRenderType() === BlockRenderType.PUMPKIN) {
            // Pumpkin spritesheet: 0=Top, 1=Side, 2=Front, 3=Jack
            texture = this.getTexture(block.textureName);
            textureIndex = block.isLit ? 3 : 2; // Jack or regular front
            textureCols = 4;
        } else if (block.getRenderType() === BlockRenderType.SANDSTONE) {
            texture = this.getTexture(block.textureName) || this.getTexture("../../" + block.textureName);
            textureIndex = block.textureIndex || 0;
            textureCols = 1;
        } else if (block.getRenderType() === BlockRenderType.NETHER) {
            texture = this.getTexture("../../nether.png");
            textureIndex = block.textureIndex;
            textureCols = 5;
        } else if (block.getRenderType() === BlockRenderType.PAINTING) {
            texture = this.getTexture(block.textureName);
            textureIndex = 0;
            textureCols = 1;
        } else if (block.getRenderType() === BlockRenderType.MAP) {
            if (block.canvas) {
                // Map has a dynamic canvas to display explored area
                this.drawSprite(stack, block.canvas, 0, 0, block.canvas.width, block.canvas.height, x, y, size, size);
                return;
            } else {
                // Fallback to static texture if canvas isn't ready
                texture = this.getTexture(block.textureName);
                if (texture) {
                    this.drawSprite(stack, texture, 0, 0, texture.width, texture.height, x, y, size, size);
                    return;
                }
            }
        } else if (block.getId() === 415) { // Quartz Item
            texture = this.getTexture("../../quartz.png");
            this.drawSprite(stack, texture, 0, 0, texture.width / 8, texture.height, x, y, size, size);
            return;
        } else if (block.textureName && block.textureName.toLowerCase().includes("redstonestuff.png")) {
            texture = this.getTexture("../../redstonestuff.png") || this.getTexture("redstonestuff.png");
            const cols = 22;
            const sw = texture.width / cols;
            // Ensure we use the block's specific textureIndex (1 for dust, 6/7 for torch, etc)
            this.drawSprite(stack, texture, (block.textureIndex || 0) * sw, 0, sw, texture.height, x, y, size, size);
            return;
        } else if (block.getRenderType() === BlockRenderType.ITEM || block.getRenderType() === BlockRenderType.SIGN || block.getRenderType() === BlockRenderType.WALL_SIGN || block.getRenderType() === BlockRenderType.REDSTONE_DUST || block.getRenderType() === BlockRenderType.LIGHT || block.getRenderType() === BlockRenderType.BARRIER) {
            texture = this.getTexture(block.textureName);
            textureIndex = block.textureIndex || 0;
            textureCols = 1;
            const name = block.textureName || "";
            if (name.includes("random stuff")) textureCols = 9;
            else if (name.includes("tools (1).png")) textureCols = 43;
            else if (name.includes("techstuff.png")) textureCols = 17;
            else if (name.includes("items (1).png")) textureCols = 37;
            else if (name.includes("farming.png")) textureCols = 20;
            else if (name.includes("food.png")) textureCols = 18;
            else if (name.includes("beetroot")) textureCols = 7;
            else if (name.includes("endstuff.png")) textureCols = 7;
            else if (name.includes("dye.png")) textureCols = 16;
            else if (name.includes("signs.png")) textureCols = 5;
            else if (name.includes("food2.png")) textureCols = 5;
            else if (name.includes("slimestuff.png")) textureCols = 2;
            else if (name.includes("newblocksset1.png")) textureCols = 9;
            else if (name.includes("dicsandbox")) textureCols = 14;
            else if (name.includes("redstonestuff")) textureCols = 22;

            // Fix for Eye of Ender index mapping in the 7-column endstuff.png
            if (name.includes("endstuff.png") && block.id === 360) {
                textureIndex = 1;
            }
        } else if (block.getRenderType() === BlockRenderType.LADDER) {
            texture = this.getTexture(block.textureName);
            textureIndex = block.textureIndex || 36;
            textureCols = 37;
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.PANE || block.getRenderType() === BlockRenderType.LILY_PAD || block.getRenderType() === BlockRenderType.GRASS_PATH) {
            texture = this.getTexture(block.textureName) || this.getTexture("../../" + block.textureName);
            textureIndex = block.textureIndex;
            textureCols = block.cols || 9;
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.TORCH) {
            texture = this.getTexture("../../blocks.png");
            textureIndex = block.getTextureForFace(EnumBlockFace.NORTH);
            textureCols = 14; 
            textureRows = 1; // Fix: Torch is in a 1-row strip (blocks.png)
        } else if (block.getRenderType() === BlockRenderType.BED) {
            texture = this.getTexture("../../bed.png");
            textureIndex = 1; // Use foot top as icon
            textureCols = 4;
            textureRows = 2;
        } else if (block.getRenderType() === BlockRenderType.RAIL) {
            texture = this.getTexture("../../items (1).png");
            const id = block.getId();
            if (id === 159) textureIndex = 34;
            else if (id === 158) textureIndex = 35;
            else textureIndex = 32;
            textureCols = 37;
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.DOUBLE_PLANT) {
            // For inventory, use bottom index into the plant sheet
            let path = block.textureName;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            texture = this.getTexture(path) || this.getTexture(block.textureName);
            textureIndex = block.textureIndex; // uses bottomIndex
            textureCols = (path && path.includes("foliage.png")) ? 21 : 1;
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.SNOW_LAYER) {
            texture = this.getTexture("../../snow.png");
            textureIndex = 0;
            textureCols = 1;
            textureRows = 1;
        } else if (block.getId() === 46 /* TNT ID */) {
            // TNT needs specific texture load for 2D icon
            texture = this.getTexture("../../tnt_side.png");
            textureIndex = 0;
            textureCols = 1;
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.STAIRS || block.getRenderType() === BlockRenderType.SLAB) {
            if (block.textureName) {
                texture = this.getTexture(block.textureName) || this.getTexture("../../" + block.textureName);
                textureIndex = 0;
                textureCols = 1;
                textureRows = 1;
            } else {
                texture = this.getTexture("../../blocks.png");
                textureIndex = block.textureSlotId;
                textureCols = 14;
                textureRows = 1;
            }
        } else if (block.getRenderType() === BlockRenderType.LEVER) {
            texture = this.getTexture("../../lever.png");
            textureIndex = 0;
            textureCols = 1;
            textureRows = 1;
        } else {
            let textureInfo = block.getTextureForFace(EnumBlockFace.NORTH);
            if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
                texture = this.getTexture(textureInfo.name);
                textureIndex = textureInfo.index || 0;
                textureCols = textureInfo.cols || 1;
                textureRows = textureInfo.rows || 1;
            } else {
                texture = this.getTexture("../../blocks.png");
                textureIndex = textureInfo;
                textureCols = 14;
                textureRows = 1;
            }
        }

        if (!texture) {
            return;
        }

        // Dynamic sprite size calculation
        if (texture.width && texture.height) {
            spriteWidth = Math.floor(texture.width / textureCols);
            
            if (block.getRenderType() === BlockRenderType.BLOCK) {
                // For terrain grid (blocks.png), tiles are square
                spriteHeight = spriteWidth;
            } else {
                // For strips (ore, foliage, door, etc), height is full image height
                spriteHeight = Math.floor(texture.height / textureRows);
            }
        }

        // Calculate Grid Coordinates
        // Note: For standard strips (rows=1), spriteY is 0.
        // For terrain atlas (rows>1), we need to map index to x/y grid.
        let col = textureIndex % textureCols;
        let row = Math.floor(textureIndex / textureCols);

        let spriteX = col * spriteWidth;
        let spriteY = row * spriteHeight;

        this.drawSprite(stack, texture, spriteX, spriteY, spriteWidth, spriteHeight, x, y, size, size);
    }

    drawDurabilityBar(stack, x, y, damage, maxDamage) {
        if (damage > 0 && maxDamage > 0) {
            let ratio = Math.max(0, (maxDamage - damage) / maxDamage);
            let width = Math.floor(ratio * 13.0);

            // standard durability bar position (bottom of slot)
            let barX = x + 2;
            let barY = y + 13;

            // Background (Black) - 13x2 area
            this.drawRect(stack, barX, barY, barX + 13, barY + 2, "#000000");

            // Color calculation (Green to Red)
            let hue = ratio * 120; // 0..120
            let color = `hsl(${hue}, 100%, 45%)`;

            // Bar - 1px height
            this.drawRect(stack, barX, barY, barX + width, barY + 1, color);
        }
    }

    renderBlock(stack, texture, block, x, y) {
        let scale = 0.18;

        let blockWidth = 32 * scale;

        let sideY = 16 * scale;
        let sideHeight = 40 * scale;
        let middleTopHeight = 32 * scale;
        let middleBottomHeight = 40 * scale;

        let topTip = new Point(0, -middleTopHeight);
        let center = new Point(0, 0);
        let bottomTip = new Point(0, middleBottomHeight);

        let topLeft = new Point(-blockWidth, -middleTopHeight + sideY);
        let bottomLeft = new Point(-blockWidth, -middleTopHeight + sideY + sideHeight);

        let topRight = new Point(blockWidth, -middleTopHeight + sideY);
        let bottomRight = new Point(blockWidth, -middleTopHeight + sideY + sideHeight);

        let trianglesLeft = IsometricRenderer.createTriangles(
            texture,
            topLeft,
            center,
            bottomTip,
            bottomLeft
        );

        let trianglesRight = IsometricRenderer.createTriangles(
            texture,
            center,
            topRight,
            bottomRight,
            bottomTip
        );

        let trianglesTop = IsometricRenderer.createTriangles(
            texture,
            topLeft,
            topTip,
            topRight,
            center
        );

        stack.save();
        stack.translate(x + 0.5, y + 0.5);
        stack.imageSmoothingEnabled = true;
        this.renderBlockFace(stack, texture, block, trianglesLeft, EnumBlockFace.NORTH);
        this.renderBlockFace(stack, texture, block, trianglesRight, EnumBlockFace.EAST);
        this.renderBlockFace(stack, texture, block, trianglesTop, EnumBlockFace.TOP);
        stack.restore();
    }

    renderBlockFace(stack, texture, block, triangles, face) {
        // UV Mapping
        let textureIndex = block.getTextureForFace(face);
        let minU = (textureIndex % 16) / 16.0;
        let minV = Math.floor(textureIndex / 16) / 16.0;

        stack.save();
        IsometricRenderer.render(stack, triangles, _ => this.drawSprite(stack, texture, minU * 256, minV, 16, 16, 0, 0, 256, 256));
        stack.restore();
    }

    static drawSprite(stack, texture, spriteX, spriteY, spriteWidth, spriteHeight, x, y, width, height, alpha = 1.0) {
        if (!texture || !stack) return;
        stack.save();
        stack.globalAlpha = alpha;
        stack.drawImage(
            texture,
            spriteX,
            spriteY,
            spriteWidth,
            spriteHeight,
            Math.floor(x),
            Math.floor(y),
            Math.floor(width),
            Math.floor(height)
        );
        stack.restore();
    }
}
