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
        return localStorage.getItem(XAEROS_MINIMAP_CLIENT_MOD_STORAGE_KEY) !== "false";
    } catch (_) {
        return true;
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
        this.mapPixels = 112;
        this.radiusBlocks = 56;
        this.displaySize = 118;
        this.canvas = null;
        this.ctx = null;
        this.lastUpdate = 0;
        this.lastPlayerX = NaN;
        this.lastPlayerZ = NaN;
        this.lastWorld = null;
        this.lastDimension = null;
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

    ensureCanvas() {
        if (this.canvas) return;
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.mapPixels;
        this.canvas.height = this.mapPixels;
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.ctx.imageSmoothingEnabled = false;
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

    updateMap(player) {
        const world = this.minecraft.world;
        if (!world || !player) return;
        this.ensureCanvas();

        const now = performance.now();
        const px = Math.floor(player.x);
        const pz = Math.floor(player.z);
        if (world === this.lastWorld && world.dimension === this.lastDimension && now - this.lastUpdate < 240 &&
            Math.abs(px - this.lastPlayerX) < 2 && Math.abs(pz - this.lastPlayerZ) < 2) {
            return;
        }
        this.lastWorld = world;
        this.lastDimension = world.dimension;
        this.lastUpdate = now;
        this.lastPlayerX = px;
        this.lastPlayerZ = pz;

        const ctx = this.ctx;
        const pixels = this.mapPixels;
        const radius = this.radiusBlocks;
        const step = (radius * 2) / pixels;
        const northHeights = new Int16Array(pixels);
        northHeights.fill(64);

        ctx.fillStyle = world.dimension === -1 ? "#160607" : "#0B1730";
        ctx.fillRect(0, 0, pixels, pixels);

        for (let py = 0; py < pixels; py++) {
            let westHeight = 64;
            const wz = Math.floor(pz + (py - pixels / 2) * step);
            for (let pxl = 0; pxl < pixels; pxl++) {
                const wx = Math.floor(px + (pxl - pixels / 2) * step);
                if (!world.chunkExists(wx >> 4, wz >> 4)) continue;

                const h = Math.max(0, Math.min(127, world.getHighestBlockAt(wx, wz)));
                let id = world.getBlockAt(wx, h, wz);
                if (!id && h > 0) id = world.getBlockAt(wx, h - 1, wz);
                ctx.fillStyle = this.blockColor(id, h, world, wx, wz);
                ctx.fillRect(pxl, py, 1, 1);

                // Relief shading and chunk-grid overlay make the small map more readable.
                const relief = Math.max(-30, Math.min(30, (h - westHeight) * 4 + (h - northHeights[pxl]) * 3));
                if (relief !== 0) {
                    ctx.fillStyle = relief > 0 ? `rgba(255,255,255,${Math.min(0.28, relief / 120)})` : `rgba(0,0,0,${Math.min(0.30, -relief / 110)})`;
                    ctx.fillRect(pxl, py, 1, 1);
                }
                if (((wx & 15) === 0 || (wz & 15) === 0) && ((wx & 3) === 0 || (wz & 3) === 0)) {
                    ctx.fillStyle = "rgba(0,0,0,0.10)";
                    ctx.fillRect(pxl, py, 1, 1);
                }
                westHeight = h;
                northHeights[pxl] = h;
            }
        }
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
