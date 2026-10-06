import Block from "../../world/block/Block.js";

export const XAEROS_MINIMAP_CLIENT_MOD_STORAGE_KEY = "mcwse_builtin_mod_enabled_xaerominimap";

export const XAEROS_MINIMAP_CLIENT_MOD_META = Object.freeze({
    id: "xaerominimap",
    name: "Xaero's Minimap",
    version: "MCWSE 1.07",
    badge: "Client",
    environment: "Client",
    authors: ["Xaero96", "MCWSE Port"],
    summary: "A vanilla-looking minimap port for MCWSE.",
    description: "Native MCWSE port of Xaero's Minimap. The original Fabric/JVM mod cannot run in the browser, so this port implements an in-game top-right minimap, player direction arrow, coordinate readout, terrain relief shading, chunk grid, compass markers, and nearby entity dots using MCWSE's JavaScript world data.",
    icon: "xaerominimap",
    iconImage: "src/js/net/minecraft/client/mods/client/xaerominimap_icon.png",
    license: "All rights reserved",
    website: "https://www.curseforge.com/minecraft/mc-mods/xaeros-minimap",
    issues: "https://www.curseforge.com/minecraft/mc-mods/xaeros-minimap/issues",
    removable: false,
    builtIn: true,
    clientSide: true
});

export function isXaerosMinimapClientModEnabled() {
    try {
        // Opt-in: built-in mods are off until the player enables them in
        // the Mods menu. An explicit stored "true" is the only way on,
        // so anyone who already turned this on keeps it.
        return localStorage.getItem(XAEROS_MINIMAP_CLIENT_MOD_STORAGE_KEY) === "true";
    } catch (_) {
        return false;
    }
}

export function setXaerosMinimapClientModEnabled(enabled) {
    try {
        localStorage.setItem(XAEROS_MINIMAP_CLIENT_MOD_STORAGE_KEY, enabled ? "true" : "false");
    } catch (_) {}
}

export default class XaerosMinimapClientMod {
    constructor(minecraft) {
        this.minecraft = minecraft;
        this.metadata = XAEROS_MINIMAP_CLIENT_MOD_META;
        // 1:1 block-to-pixel, and the display size matches the buffer size so
        // the map is never resampled. The old 112 -> 118 stretch is what made
        // the minimap look blurry next to the rest of the HUD.
        this.mapPixels = 120;
        this.radiusBlocks = 60;
        this.displaySize = 120;
        this.canvas = null;
        this.ctx = null;
        this.lastUpdate = 0;
        this.lastWorld = null;
        this.lastDimension = null;

        // Incremental render state.
        this.imageData = null;
        this.pixelBuffer = null;
        this.heights = null;
        this.originX = 0;
        this.originZ = 0;
        this.scanRow = 0;
        this.dirty = false;
        this.rowsPerPass = 12;   // ~1/10th of the map per pass
        this.scanInterval = 33;  // ms between passes => full refresh ~0.33s
        this.colorCache = new Map();
        this.biomeBandCache = new Map();
    }

    install() {
        this.minecraft.xaerosMinimapClientMod = this;
    }

    isGloballyEnabled() {
        return isXaerosMinimapClientModEnabled();
    }

    setGloballyEnabled(enabled) {
        setXaerosMinimapClientModEnabled(enabled);
        this.lastUpdate = 0;
    }

    /**
     * The HUD canvas is drawn in GUI units and then upscaled by the screen
     * renderer, so a 1-GUI-unit-per-pixel map ends up visibly soft/chunky.
     * Rendering the buffer at the HUD's own resolution (capped at 2x so the
     * sampling cost stays bounded) keeps it sharp on high-DPI displays.
     */
    desiredScale() {
        const resolution = this.minecraft?.screenRenderer?.resolution || 1;
        return Math.max(1, Math.min(2, Math.round(resolution)));
    }

    ensureCanvas() {
        const scale = this.desiredScale();
        const size = this.displaySize * scale;
        if (this.canvas && this.mapPixels === size) return;

        this.mapPixels = size;
        this.rowsPerPass = Math.max(6, Math.ceil(size / 10));
        this.canvas = document.createElement("canvas");
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.ctx.imageSmoothingEnabled = false;
        this.imageData = null;
    }

    getBiomeName(world, x, z) {
        if (!world) return "Unknown";
        if (world.dimension === -1) return "Nether";
        if (world.dimension === 1) return "The End";
        const v = typeof world.getBiomeNoiseAt === "function" ? world.getBiomeNoiseAt(x, z) : 0;
        if (v > 0.72) return "Desert";
        if (v > 0.55) return "Savanna";
        if (v > 0.18) return "Forest";
        if (v < -0.62) return "Snow";
        if (v < -0.38) return "Taiga";
        if (v < -0.12) return "Forest";
        return "Plains";
    }

    blockColor(id, height, world, x, z) {
        if (!id) return world?.dimension === -1 ? "#130507" : "#10223E";
        const colors = {
            1: "#777777", 2: "#4E9B3F", 3: "#7A5635", 4: "#6B6B6B", 5: "#A67847",
            7: "#333333", 8: "#2E6BE6", 9: "#2E6BE6", 10: "#E35A18", 11: "#E35A18",
            12: "#D7C47B", 13: "#77736B", 14: "#8A8058", 15: "#8B7E72", 16: "#3E3E3E",
            17: "#6B4A2D", 18: "#2F7A2F", 20: "#8BD8FF", 21: "#3452A4", 22: "#2440B6",
            24: "#D5C27A", 31: "#4D9B3D", 32: "#3C8D32", 37: "#D8D04A", 38: "#C84A4A",
            41: "#F0D24C", 42: "#D8D8D8", 45: "#8F4A36", 47: "#8A5F35", 48: "#5E7550",
            49: "#18141F", 50: "#F2B84B", 56: "#5ACAD0", 57: "#62E7E7", 78: "#F0F5FF",
            79: "#A8D6FF", 80: "#F6F8FF", 81: "#2E9A3E", 82: "#9DA8AA", 86: "#C66C22",
            87: "#7D2525", 88: "#55402A", 89: "#C9A85B", 91: "#D9842D", 98: "#6F6F6F",
            99: "#9A8065", 100: "#7B4A35", 110: "#5F4A7E", 121: "#D7CF9A", 129: "#39A65A",
            155: "#E9E1C8", 159: "#A06955", 162: "#724C30", 170: "#B79A3A", 172: "#44372F",
            173: "#191919", 174: "#B3D5F5", 236: "#9E3519"
        };

        let color = colors[id];
        if (!color) {
            const block = Block.getById(id);
            const name = String(block?.name || block?.constructor?.name || "").toLowerCase();
            if (name.includes("water")) color = "#2E6BE6";
            else if (name.includes("lava") || name.includes("magma")) color = "#E35A18";
            else if (name.includes("leaf") || name.includes("foliage") || name.includes("grass")) color = "#3F9138";
            else if (name.includes("sand")) color = "#D7C47B";
            else if (name.includes("wood") || name.includes("log") || name.includes("plank")) color = "#8A5F35";
            else if (name.includes("snow") || name.includes("ice")) color = "#E9F4FF";
            else color = "#707070";
        }

        if (world?.dimension === 0 && (id === 2 || id === 31 || id === 32 || id === 18)) {
            const biome = this.getBiomeName(world, x, z);
            if (biome === "Desert" || biome === "Savanna") color = this.mix(color, "#C8B45C", 0.28);
            else if (biome === "Snow" || biome === "Taiga") color = this.mix(color, "#7FAF86", 0.22);
            else if (biome === "Forest") color = this.mix(color, "#1F6F2F", 0.18);
        }
        if (world?.dimension === -1 && id !== 10 && id !== 11) color = this.mix(color, "#6A2626", 0.24);

        const heightShade = Math.max(-22, Math.min(22, (height - 64) * 0.45));
        return this.adjust(color, heightShade);
    }

    adjust(hex, amount) {
        if (hex.startsWith("rgb")) return hex;
        const n = parseInt(hex.slice(1), 16);
        const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
        const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
        const b = Math.max(0, Math.min(255, (n & 255) + amount));
        return `rgb(${r | 0},${g | 0},${b | 0})`;
    }

    mix(a, b, t) {
        const an = parseInt(a.slice(1), 16), bn = parseInt(b.slice(1), 16);
        const ar = (an >> 16) & 255, ag = (an >> 8) & 255, ab = an & 255;
        const br = (bn >> 16) & 255, bg = (bn >> 8) & 255, bb = bn & 255;
        return `#${[
            ar + (br - ar) * t,
            ag + (bg - ag) * t,
            ab + (bb - ab) * t
        ].map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, "0")).join("")}`;
    }

    /**
     * Rebuilds the map image.
     *
     * The old implementation re-scanned every one of the 112x112 samples and
     * issued a fillRect per pixel (and a second one for relief shading, and a
     * third for the chunk grid) on every refresh, on the main thread, every
     * time the player moved two blocks. That is ~37k canvas calls and ~12.5k
     * heightmap probes per refresh, which is where the lag came from.
     *
     * Now: one ImageData buffer written with typed-array maths, a cached
     * colour table, and the scan is amortised across frames in horizontal
     * slices so no single frame pays for the whole map. When the player moves,
     * the existing image is scrolled by the delta and only the newly exposed
     * edge rows/columns are re-scanned.
     */
    updateMap(player) {
        const world = this.minecraft.world;
        if (!world || !player) return;
        this.ensureCanvas();

        const pixels = this.mapPixels;
        const px = Math.floor(player.x);
        const pz = Math.floor(player.z);

        // Dimension or world switch: throw everything away.
        if (world !== this.lastWorld || world.dimension !== this.lastDimension) {
            this.lastWorld = world;
            this.lastDimension = world.dimension;
            this.colorCache.clear();
            this.imageData = null;
        }

        if (!this.imageData) {
            this.imageData = this.ctx.createImageData(pixels, pixels);
            this.pixelBuffer = new Uint32Array(this.imageData.data.buffer);
            this.heights = new Int16Array(pixels * pixels);
            this.originX = px;
            this.originZ = pz;
            this.scanRow = 0;
            this.pixelBuffer.fill(this.backgroundColor(world));
            this.dirty = true;
        }

        // Scroll the already-rendered image instead of redrawing it.
        const shiftX = px - this.originX;
        const shiftZ = pz - this.originZ;
        if (shiftX !== 0 || shiftZ !== 0) {
            if (Math.abs(shiftX) >= pixels || Math.abs(shiftZ) >= pixels) {
                this.pixelBuffer.fill(this.backgroundColor(world));
                this.heights.fill(0);
                this.scanRow = 0;
            } else {
                this.scrollBuffer(shiftX, shiftZ);
            }
            this.originX = px;
            this.originZ = pz;
            this.dirty = true;
        }

        // Amortised scan: a slice of rows per call, so the per-frame cost is
        // bounded no matter how fast the player is moving.
        const now = performance.now();
        if (now - this.lastUpdate < this.scanInterval) {
            this.flush();
            return;
        }
        this.lastUpdate = now;

        const rowsThisPass = Math.max(4, this.rowsPerPass);
        for (let n = 0; n < rowsThisPass; n++) {
            this.scanLine(world, this.scanRow);
            this.scanRow = (this.scanRow + 1) % pixels;
        }
        this.dirty = true;
        this.flush();
    }

    backgroundColor(world) {
        // ABGR, because Uint32Array over RGBA bytes is little-endian.
        return world?.dimension === -1 ? 0xFF070616 : 0xFF30170B;
    }

    scrollBuffer(shiftX, shiftZ) {
        const pixels = this.mapPixels;
        const buffer = this.pixelBuffer;
        const heights = this.heights;
        const copy = buffer.slice();
        const copyH = heights.slice();
        const fill = this.backgroundColor(this.minecraft.world);

        for (let y = 0; y < pixels; y++) {
            const sourceY = y + shiftZ;
            const rowOut = y * pixels;
            if (sourceY < 0 || sourceY >= pixels) {
                buffer.fill(fill, rowOut, rowOut + pixels);
                heights.fill(0, rowOut, rowOut + pixels);
                continue;
            }
            const rowIn = sourceY * pixels;
            for (let x = 0; x < pixels; x++) {
                const sourceX = x + shiftX;
                if (sourceX < 0 || sourceX >= pixels) {
                    buffer[rowOut + x] = fill;
                    heights[rowOut + x] = 0;
                } else {
                    buffer[rowOut + x] = copy[rowIn + sourceX];
                    heights[rowOut + x] = copyH[rowIn + sourceX];
                }
            }
        }
    }

    /** Scans one row of the map into the pixel buffer. */
    scanLine(world, py) {
        const pixels = this.mapPixels;
        const step = (this.radiusBlocks * 2) / pixels;
        const buffer = this.pixelBuffer;
        const heights = this.heights;
        const wz = Math.floor(this.originZ + (py - pixels / 2) * step);
        const rowOffset = py * pixels;
        const nether = world.dimension === -1;
        let westHeight = -1;

        let lastChunkX = Number.NaN;
        let chunkPresent = false;
        const chunkZ = wz >> 4;

        for (let pxl = 0; pxl < pixels; pxl++) {
            const wx = Math.floor(this.originX + (pxl - pixels / 2) * step);
            const chunkX = wx >> 4;
            if (chunkX !== lastChunkX) {
                lastChunkX = chunkX;
                chunkPresent = world.chunkExists(chunkX, chunkZ);
            }
            if (!chunkPresent) {
                westHeight = -1;
                continue;
            }

            const h = Math.max(0, Math.min(127, world.getHighestBlockAt(wx, wz)));
            let id = world.getBlockAt(wx, h, wz);
            if (!id && h > 0) id = world.getBlockAt(wx, h - 1, wz);

            // Relief against the neighbour to the west and the row to the
            // north, matching the old look without extra canvas ops.
            const north = heights[rowOffset - pixels + pxl] || h;
            const west = westHeight < 0 ? h : westHeight;
            const relief = Math.max(-24, Math.min(24, (h - west) * 5 + (h - north) * 3));
            const grid = ((wx & 15) === 0 || (wz & 15) === 0) ? -8 : 0;

            buffer[rowOffset + pxl] = this.packedColor(id, h, world, wx, wz, nether, relief + grid);
            heights[rowOffset + pxl] = h;
            westHeight = h;
        }
    }

    /**
     * Colour lookup returning a packed ABGR int, memoised per
     * (block, height band, biome band) so the string parsing and biome probe
     * only ever run once per distinct combination.
     */
    packedColor(id, height, world, x, z, nether, shade) {
        const band = height >> 2;
        const biomeBand = (!nether && (id === 2 || id === 31 || id === 32 || id === 18))
            ? this.biomeBandAt(world, x, z)
            : 0;
        const shadeBand = Math.max(-8, Math.min(8, Math.round(shade / 4)));
        const key = (id << 14) ^ (band << 7) ^ (biomeBand << 4) ^ (shadeBand + 8);

        const cached = this.colorCache.get(key);
        if (cached !== undefined) return cached;

        const hex = this.blockColor(id, height, world, x, z);
        const rgb = this.toRgb(hex);
        const lift = shadeBand * 4;
        const r = Math.max(0, Math.min(255, rgb[0] + lift));
        const g = Math.max(0, Math.min(255, rgb[1] + lift));
        const b = Math.max(0, Math.min(255, rgb[2] + lift));
        const packed = (0xFF << 24 | b << 16 | g << 8 | r) >>> 0;

        if (this.colorCache.size > 4096) this.colorCache.clear();
        this.colorCache.set(key, packed);
        return packed;
    }

    biomeBandAt(world, x, z) {
        // Quantised to 8-block cells so the cache actually hits.
        const key = ((x >> 3) << 16) ^ (z >> 3);
        const cached = this.biomeBandCache.get(key);
        if (cached !== undefined) return cached;
        const biome = this.getBiomeName(world, x, z);
        const band = biome === "Desert" || biome === "Savanna" ? 1
            : biome === "Snow" || biome === "Taiga" ? 2
            : biome === "Forest" ? 3 : 0;
        if (this.biomeBandCache.size > 8192) this.biomeBandCache.clear();
        this.biomeBandCache.set(key, band);
        return band;
    }

    toRgb(color) {
        if (color.startsWith("#")) {
            const n = parseInt(color.slice(1), 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }
        const m = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : [112, 112, 112];
    }

    flush() {
        if (!this.dirty || !this.imageData) return;
        this.ctx.putImageData(this.imageData, 0, 0);
        this.dirty = false;
    }

    getHeading(yaw) {
        const dirs = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"];
        const idx = Math.round((((yaw % 360) + 360) % 360) / 45) & 7;
        return dirs[idx];
    }

    renderEntityDots(stack, x, y, size, player) {
        const world = this.minecraft.world;
        if (!world?.entities) return;
        const half = size / 2;
        const scale = size / (this.radiusBlocks * 2);
        for (const entity of world.entities) {
            if (!entity || entity === player) continue;
            const dx = entity.x - player.x;
            const dz = entity.z - player.z;
            if (dx * dx + dz * dz > this.radiusBlocks * this.radiusBlocks) continue;
            const ex = x + half + dx * scale;
            const ez = y + half + dz * scale;
            const dist = Math.hypot(ex - (x + half), ez - (y + half));
            if (dist > half - 5) continue;

            const className = entity.constructor?.name || "";
            const isPlayer = entity.username || className === "RemotePlayerEntity" || className === "PlayerEntity";
            const isItem = className.includes("DroppedItem");
            stack.save();
            stack.fillStyle = isPlayer ? "#55AAFF" : (isItem ? "#FFD85A" : "#FF5555");
            stack.strokeStyle = "rgba(0,0,0,0.85)";
            stack.lineWidth = 1;
            stack.beginPath();
            stack.arc(ex, ez, isPlayer ? 2.5 : 2, 0, Math.PI * 2);
            stack.fill();
            stack.stroke();
            stack.restore();
        }
    }

    renderPlayerArrow(stack, cx, cy, yaw) {
        stack.save();
        stack.translate(cx, cy);
        // MCWSE yaw 0 faces +Z (south), while the minimap arrow art points
        // upward (north) before rotation. Add 180 degrees so the arrow matches
        // the real camera/player direction on the north-up map.
        stack.rotate(((yaw || 0) + 180) * Math.PI / 180);
        stack.fillStyle = "#FFFFFF";
        stack.strokeStyle = "#111111";
        stack.lineWidth = 1.25;
        stack.beginPath();
        stack.moveTo(0, -8);
        stack.lineTo(5.5, 6.5);
        stack.lineTo(0, 3.5);
        stack.lineTo(-5.5, 6.5);
        stack.closePath();
        stack.fill();
        stack.stroke();
        stack.restore();
    }

    render(stack, width, height, player) {
        if (!this.isGloballyEnabled()) return;
        if (!this.minecraft.world || !player || this.minecraft.currentScreen) return;

        this.updateMap(player);
        if (!this.canvas) return;

        const world = this.minecraft.world;
        const mapSize = this.displaySize;
        const pad = 10;
        const x = width - mapSize - 14;
        const y = 14;
        const cx = x + mapSize / 2;
        const cy = y + mapSize / 2;
        const radius = mapSize / 2;

        stack.save();
        stack.imageSmoothingEnabled = false;

        // Drop shadow + outer frame.
        stack.fillStyle = "rgba(0,0,0,0.48)";
        stack.beginPath();
        stack.arc(cx + 2, cy + 3, radius + 7, 0, Math.PI * 2);
        stack.fill();
        stack.fillStyle = "rgba(18,18,22,0.92)";
        stack.beginPath();
        stack.arc(cx, cy, radius + 6, 0, Math.PI * 2);
        stack.fill();
        stack.strokeStyle = "rgba(255,255,255,0.70)";
        stack.lineWidth = 2;
        stack.beginPath();
        stack.arc(cx, cy, radius + 4, 0, Math.PI * 2);
        stack.stroke();
        stack.strokeStyle = "rgba(0,0,0,0.85)";
        stack.lineWidth = 2;
        stack.beginPath();
        stack.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
        stack.stroke();

        // Circular map clip.
        stack.save();
        stack.beginPath();
        stack.arc(cx, cy, radius, 0, Math.PI * 2);
        stack.clip();
        stack.drawImage(this.canvas, x, y, mapSize, mapSize);
        const vignette = stack.createRadialGradient(cx, cy, radius * 0.45, cx, cy, radius);
        vignette.addColorStop(0, "rgba(255,255,255,0.00)");
        vignette.addColorStop(0.72, "rgba(0,0,0,0.00)");
        vignette.addColorStop(1, "rgba(0,0,0,0.35)");
        stack.fillStyle = vignette;
        stack.fillRect(x, y, mapSize, mapSize);
        this.renderEntityDots(stack, x, y, mapSize, player);
        stack.restore();

        // Crosshair and player arrow.
        stack.strokeStyle = "rgba(255,255,255,0.55)";
        stack.lineWidth = 1;
        stack.beginPath();
        stack.moveTo(cx - 6, cy);
        stack.lineTo(cx + 6, cy);
        stack.moveTo(cx, cy - 6);
        stack.lineTo(cx, cy + 6);
        stack.stroke();
        this.renderPlayerArrow(stack, cx, cy, player.rotationYaw || 0);

        // Compass markers.
        stack.font = "bold 10px monospace";
        stack.textAlign = "center";
        stack.textBaseline = "middle";
        const labels = [
            ["N", cx, y + 7, "#FF6666"],
            ["E", x + mapSize - 7, cy, "#FFFFFF"],
            ["S", cx, y + mapSize - 7, "#FFFFFF"],
            ["W", x + 7, cy, "#FFFFFF"]
        ];
        for (const [label, lx, ly, color] of labels) {
            stack.fillStyle = "rgba(0,0,0,0.72)";
            stack.fillText(label, lx + 1, ly + 1);
            stack.fillStyle = color;
            stack.fillText(label, lx, ly);
        }

        // Coordinate/biome strip.
        const biome = this.getBiomeName(world, Math.floor(player.x), Math.floor(player.z));
        const heading = this.getHeading(player.rotationYaw || 0);
        const coord = `${Math.floor(player.x)}, ${Math.floor(player.y)}, ${Math.floor(player.z)}  ${heading}`;
        const stripY = y + mapSize + 9;
        stack.fillStyle = "rgba(0,0,0,0.58)";
        stack.fillRect(x + 3, stripY, mapSize - 6, 22);
        stack.strokeStyle = "rgba(255,255,255,0.35)";
        stack.strokeRect(x + 3.5, stripY + 0.5, mapSize - 7, 21);
        stack.font = "10px monospace";
        stack.fillStyle = "#FFFFFF";
        stack.fillText(coord, cx, stripY + 8);
        stack.fillStyle = world.dimension === -1 ? "#FF9A9A" :  "#B8FFB8";
        stack.fillText(biome, cx, stripY + 18);

        stack.restore();
    }
}
