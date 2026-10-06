import BlockItem from "./src/js/net/minecraft/client/world/block/type/BlockItem.js";
import BlockRenderType from "./src/js/net/minecraft/util/BlockRenderType.js";
import * as THREE from "./libraries/three.module.js";

export default class BlockMap extends BlockItem {

    constructor(id) {
        super(id, "../../tools (1).png", 40); // 41st sprite = index 40
        this.setMaxStackSize(1); // Maps do not stack

        this.initialized = false;
        this.mapTexture = null;
        
        // Canvas size: 250 map pixels + 11px padding on each side = 272
        this.canvas = document.createElement('canvas');
        this.canvas.width = 272;
        this.canvas.height = 272;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.ctx.imageSmoothingEnabled = false;

        // Initial background state
        this.ctx.fillStyle = "#F2E6C6";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Persistent map data (pixels)
        this.mapData = null;

        this.centerX = 0;
        this.centerZ = 0;
        
        // Map settings
        this.MAP_SIZE = 250;
        this.MAP_RADIUS = this.MAP_SIZE / 2;
        this.OFF_X = 11;
        this.OFF_Y = 11;
        
        // Exploration radius (30x30 block area = +/- 15 blocks)
        this.EXPLORE_RADIUS = 15;
    }

    getRenderType() {
        return BlockRenderType.MAP;
    }

    // Auto-initialize when used or updated, no manual click needed
    onItemUse(world, x, y, z, face, player) {
        return false;
    }

    initializeMap(world, player) {
        this.initialized = true;
        this.centerX = Math.floor(player.x);
        this.centerZ = Math.floor(player.z);
        
        // Load and draw background texture
        let bgImage = world.minecraft.resources["../../map_background.png"] || world.minecraft.resources["map_background.png"];
        if (bgImage) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(bgImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "#F2E6C6";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Snapshot initial state as the base map data (fog of war)
        this.mapData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    
    update(world, player) {
        if (!this.initialized) {
            this.initializeMap(world, player);
        }

        if (!this.mapData) return;

        // Reveal area around player
        this.explore(world, player);

        // Render map to texture
        this.renderToCanvas(player);
    }

    explore(world, player) {
        const px = Math.floor(player.x);
        const pz = Math.floor(player.z);
        
        const pixels = this.mapData.data;
        const width = this.canvas.width;
        
        const rSq = this.EXPLORE_RADIUS * this.EXPLORE_RADIUS;

        // Iterate area around player
        for (let x = px - this.EXPLORE_RADIUS; x <= px + this.EXPLORE_RADIUS; x++) {
            for (let z = pz - this.EXPLORE_RADIUS; z <= pz + this.EXPLORE_RADIUS; z++) {
                
                // Circular check
                let dx = x - px;
                let dz = z - pz;
                if (dx*dx + dz*dz > rSq) continue;
                
                // Calculate map-local coordinates (0 to 249)
                let mx = x - (this.centerX - this.MAP_RADIUS);
                let mz = z - (this.centerZ - this.MAP_RADIUS);

                // Check bounds
                if (mx >= 0 && mx < this.MAP_SIZE && mz >= 0 && mz < this.MAP_SIZE) {
                    
                    // Determine canvas pixel index
                    let canvasX = this.OFF_X + mx;
                    let canvasY = this.OFF_Y + mz;
                    let idx = (canvasY * width + canvasX) * 4;

                    // Get world surface info
                    let height = this.getSurfaceHeight(world, x, z);
                    let northHeight = this.getSurfaceHeight(world, x, z - 1);
                    
                    let blockId = this.getSurfaceBlock(world, x, height, z);
                    let color = this.getMapColor(blockId);
                    
                    // Hill shading (Brightness)
                    let brightness = 220; // Flat
                    if (height > northHeight) brightness = 255; // Highlight (Slope facing camera/light)
                    if (height < northHeight) brightness = 180; // Shadow
                    
                    // Water depth darkening
                    if (blockId === 9 || blockId === 8) {
                        let depth = 0;
                        let dy = height - 1;
                        while(dy > 0 && (world.getBlockAt(x, dy, z) === 9 || world.getBlockAt(x, dy, z) === 8)) {
                            depth++;
                            dy--;
                            if (depth > 5) break;
                        }
                        brightness = Math.max(100, brightness - depth * 15);
                    }

                    // Update pixel data (overwrite fog of war)
                    pixels[idx] = (color[0] * brightness) / 255;
                    pixels[idx+1] = (color[1] * brightness) / 255;
                    pixels[idx+2] = (color[2] * brightness) / 255;
                    pixels[idx+3] = 255; // Alpha opaque
                }
            }
        }
    }

    renderToCanvas(player) {
        // 1. Put terrain data
        this.ctx.putImageData(this.mapData, 0, 0);

        // 2. Draw Player Marker
        let px = player.x;
        let pz = player.z;

        // Calculate relative pixel position
        let markX = (px - (this.centerX - this.MAP_RADIUS)) + this.OFF_X;
        let markY = (pz - (this.centerZ - this.MAP_RADIUS)) + this.OFF_Y;

        this.ctx.save();
        
        // Clip to map view area so marker hides if off-map
        this.ctx.beginPath();
        this.ctx.rect(this.OFF_X, this.OFF_Y, this.MAP_SIZE, this.MAP_SIZE);
        this.ctx.clip();

        this.ctx.translate(markX, markY);
        // Rotate arrow: Player yaw needs 180 flip
        this.ctx.rotate((player.rotationYaw * Math.PI / 180) + Math.PI);
        
        // Draw Arrow shape
        this.ctx.beginPath();
        this.ctx.moveTo(0, -5);
        this.ctx.lineTo(4, 4);
        this.ctx.lineTo(0, 2);
        this.ctx.lineTo(-4, 4);
        this.ctx.closePath();
        
        this.ctx.fillStyle = "white";
        this.ctx.fill();
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();

        // 3. Update Texture
        if (this.mapTexture) {
            this.mapTexture.needsUpdate = true;
        } else {
            this.mapTexture = new THREE.CanvasTexture(this.canvas);
            this.mapTexture.magFilter = THREE.NearestFilter;
            this.mapTexture.minFilter = THREE.NearestFilter;
        }
    }
    
    getSurfaceHeight(world, x, z) {
        let y = world.getHeightAt(x, z);
        // Scan down to find actual surface (liquids count)
        let searchY = y + 1;
        while (searchY > 0) {
            let id = world.getBlockAt(x, searchY - 1, z);
            if (id !== 0) return searchY;
            searchY--;
        }
        return 0;
    }
    
    getSurfaceBlock(world, x, y, z) {
        if (y <= 0) return 0;
        return world.getBlockAt(x, y - 1, z);
    }

    getMapColor(id) {
        switch(id) {
            case 0: return [0,0,0]; // Air
            // Grays
            case 1: case 4: case 257: case 15: case 16: case 98: case 43: case 139: case 61: case 7: return [112, 112, 112];
            // Greens
            case 2: case 31: case 32: case 37: case 38: case 39: case 59: case 141: case 142: case 18: return [127, 178, 56];
            // Browns
            case 3: case 60: case 62: case 88: case 17: case 58: case 5: case 53: case 44: case 85: case 107: case 54: case 64: case 65: return [151, 109, 77];
            // Sand/Desert
            case 12: case 13: case 24: return [247, 233, 163];
            // Water
            case 9: case 8: return [64, 64, 255];
            // Whites/Snow
            case 80: case 78: case 35: return [255, 255, 255];
            // Reds
            case 10: case 11: case 51: return [255, 0, 0];
            case 45: case 336: return [150, 97, 83];
            case 87: return [112, 2, 0];
            // Misc
            case 82: return [164, 168, 184];
            case 14: case 41: case 50: return [250, 238, 77];
            case 56: case 57: return [92, 219, 213];
            case 129: case 133: return [0, 217, 58];
            case 49: return [21, 20, 31];
            case 86: case 91: return [216, 127, 51];
            case 79: case 174: return [160, 160, 255];
            case 89: return [255, 255, 128];
            default: return [127, 127, 127];
        }
    }

    getMapTexture(worldRenderer) {
        if (!this.mapTexture) {
            let bgImage = worldRenderer.minecraft.resources["../../map_background.png"] || worldRenderer.minecraft.resources["map_background.png"];
            if (bgImage) {
                this.ctx.drawImage(bgImage, 0, 0, this.canvas.width, this.canvas.height);
            }
            this.mapTexture = new THREE.CanvasTexture(this.canvas);
            this.mapTexture.magFilter = THREE.NearestFilter;
            this.mapTexture.minFilter = THREE.NearestFilter;
        }
        return this.mapTexture;
    }
}

