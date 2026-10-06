import * as THREE from "three";
import Tessellator from "./src/js/net/minecraft/client/render/Tessellator.js";
import Block from "./src/js/net/minecraft/client/world/block/Block.js";
import { BlockRegistry } from "./src/js/net/minecraft/client/world/block/BlockRegistry.js";
import EnumBlockFace from "./src/js/net/minecraft/util/EnumBlockFace.js";
import BoundingBox from "./src/js/net/minecraft/util/BoundingBox.js";
import BlockRenderType from "./src/js/net/minecraft/util/BlockRenderType.js";
import { disposeGroup } from "./src/js/net/minecraft/util/dispose.js";

class Particle {
    constructor(world, x, y, z, mx, my, mz, block, color = 0xFFFFFF) {
        this.world = world;
        this.x = x;
        this.y = y;
        this.z = z;
        this.prevX = x;
        this.prevY = y;
        this.prevZ = z;
        this.motionX = mx;
        this.motionY = my;
        this.motionZ = mz;
        this.block = block;
        this.color = color;
        
        this.age = 0;
        this.maxAge = 10 + Math.random() * 20; // 0.5s - 1.5s
        
        this.boundingBox = new BoundingBox(x-0.1, y-0.1, z-0.1, x+0.1, y+0.1, z+0.1);
        this.onGround = false;
        
        this.isFlame = false;
        this.isLavaPop = false;
        this.isSmoke = false;
        this.isCrit = false;
        this.isNote = false;
        this.baseScale = 1.0;
        this.floating = false;

        // Random texture offset (0-3 for 4x4 grid)
        this.uOff = Math.floor(Math.random() * 4);
        this.vOff = Math.floor(Math.random() * 4);
    }
    
    tick() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.prevZ = this.z;
        this.age++;
        
        this.motionY -= 0.04; // Gravity
        
        // Collision / Move
        let dx = this.motionX;
        let dy = this.motionY;
        let dz = this.motionZ;
        
        let boxes = this.world.getCollisionBoxes(this.boundingBox.expand(dx, dy, dz));
        let orgDy = dy;
        
        for (let bb of boxes) dy = bb.clipYCollide(this.boundingBox, dy);
        this.boundingBox.move(0, dy, 0);
        
        for (let bb of boxes) dx = bb.clipXCollide(this.boundingBox, dx);
        this.boundingBox.move(dx, 0, 0);
        
        for (let bb of boxes) dz = bb.clipZCollide(this.boundingBox, dz);
        this.boundingBox.move(0, 0, dz);
        
        this.x = (this.boundingBox.minX + this.boundingBox.maxX) / 2;
        this.y = this.boundingBox.minY + 0.1;
        this.z = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2;
        
        this.onGround = orgDy !== dy && orgDy < 0;
        
        if (this.onGround) {
            this.motionX *= 0.1;
            this.motionZ *= 0.1;
            this.motionY *= -0.5; // Bounce
            if (Math.abs(this.motionY) < 0.05) this.motionY = 0;
        } else {
            this.motionX *= 0.98;
            this.motionY *= 0.98;
            this.motionZ *= 0.98;
        }
    }
}

export default class ParticleManager {
    constructor(minecraft) {
        this.minecraft = minecraft;
        this.isRemoteParticle = false;
        this.particles = [];
        this.tessellator = new Tessellator();
        this.group = new THREE.Object3D();
    }
    
    spawnBlockBreakParticles(world, x, y, z, block) {
        if (!block || block.getId() === 0) return;
        
        // Sync to multiplayer
        if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected && !this.isRemoteParticle) {
            this.minecraft.multiplayer.broadcast({
                type: "particle_burst",
                pType: "block_break",
                x, y, z,
                blockId: block.getId()
            });
        }

        const settings = this.minecraft.settings;
        let count = 4;
        let skipChance = 0.5;

        // Capture color based on block type. Grass should be mostly dirt-colored (side/bottom).
        let queryFace = EnumBlockFace.NORTH;
        let particleBlock = block;
        
        // Grass (2) and Grass Path (566) special handling: mix of top foliage and side dirt
        if (block.getId() === 2 || block.getId() === 566) {
            if (Math.random() < 0.2) {
                queryFace = EnumBlockFace.TOP;
            } else {
                particleBlock = BlockRegistry.DIRT; // Use dirt for side/bottom flecks to ensure neutral color
                queryFace = EnumBlockFace.NORTH;
            }
        }
        
        const color = particleBlock.getColor(world, x, y, z, queryFace);

        // Apply Particles setting: 0=Minimal, 1=Normal, 2=Extra
        if (settings.particles === 0) {
            count = 2; // Much fewer particles
            skipChance = 0.7;
        } else if (settings.particles === 2) {
            count = 6; // Denser grid
            skipChance = 0.3;
        }

        for (let i = 0; i < count; i++) {
            for (let j = 0; j < count; j++) {
                for (let k = 0; k < count; k++) {
                    if (Math.random() > (1.0 - skipChance)) continue; 
                    
                    let px = x + (i + 0.5) / count;
                    let py = y + (j + 0.5) / count;
                    let pz = z + (k + 0.5) / count;
                    
                    let mx = (px - (x + 0.5)) * 0.3;
                    let my = (py - (y + 0.5)) * 0.3;
                    let mz = (pz - (z + 0.5)) * 0.3;
                    
                    let p = new Particle(world, px, py, pz, mx, my, mz, particleBlock, color);
                    p.uOff = i; 
                    p.vOff = j; 
                    this.particles.push(p);
                }
            }
        }
    }
    
    spawnHeartParticles(world, x, y, z, count = 1) {
        for (let i = 0; i < count; i++) {
            // Hearts are custom particles that float up
            let px = x + (Math.random() - 0.5) * 0.8;
            let py = y + (Math.random() - 0.5) * 0.4;
            let pz = z + (Math.random() - 0.5) * 0.8;

            let mx = (Math.random() - 0.5) * 0.02;
            let my = 0.05 + Math.random() * 0.05;
            let mz = (Math.random() - 0.5) * 0.02;

            // Using REDSTONE as color proxy for heart
            let p = new Particle(world, px, py, pz, mx, my, mz, Block.getById(152), 0xFF5555);
            p.maxAge = 40 + Math.random() * 20;
            p.floating = true; // Heart particles shouldn't fall
            this.particles.push(p);
        }
    }

    spawnBlockHitParticles(world, x, y, z, face) {
        let blockId = world.getBlockAt(x, y, z);
        if (blockId === 0) return;
        let block = Block.getById(blockId);
        if (!block) return;
        
        const color = block.getColor(world, x, y, z, face);

        // 4 particles
        for (let i=0; i<4; i++) {
            let px = x + 0.5 + (Math.random()-0.5)*0.5 + face.x * 0.6;
            let py = y + 0.5 + (Math.random()-0.5)*0.5 + face.y * 0.6;
            let pz = z + 0.5 + (Math.random()-0.5)*0.5 + face.z * 0.6;
            
            let mx = (face.x * 0.2 + (Math.random()-0.5)*0.1) * 0.5;
            let my = (face.y * 0.2 + (Math.random()-0.5)*0.1) * 0.5;
            let mz = (face.z * 0.2 + (Math.random()-0.5)*0.1) * 0.5;
            
            this.particles.push(new Particle(world, px, py, pz, mx, my, mz, block, color));
        }
    }

    spawnFlameParticle(world, x, y, z, mx, my, mz, scale = 1.0) {
        let p = new Particle(world, x, y, z, mx, my, mz, null);
        p.isFlame = true;
        p.maxAge = 15 + Math.random() * 10;
        p.baseScale = scale;
        p.floating = true;
        this.particles.push(p);
    }

    spawnLavaPop(world, x, y, z) {
        // High upward velocity and slight random horizontal spread for "arc" motion
        let mx = (Math.random() - 0.5) * 0.12;
        let my = 0.15 + Math.random() * 0.25;
        let mz = (Math.random() - 0.5) * 0.12;
        
        let p = new Particle(world, x, y, z, mx, my, mz, null, 0xFFCC00);
        p.isLavaPop = true;
        p.maxAge = 15 + Math.random() * 15;
        p.baseScale = 0.8 + Math.random() * 0.4;
        this.particles.push(p);
    }

    spawnDeathSmoke(world, x, y, z) {
        // Spawn many smoke particles on mob death
        const count = 24 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
            // Volume slightly larger than the mob
            let px = x + (Math.random() - 0.5) * 1.0;
            let py = y + (Math.random() - 0.5) * 1.8;
            let pz = z + (Math.random() - 0.5) * 1.0;

            // Subtle rising motion (positive motionY)
            let mx = (Math.random() - 0.5) * 0.015;
            let my = 0.02 + Math.random() * 0.05; 
            let mz = (Math.random() - 0.5) * 0.015;

            let p = new Particle(world, px, py, pz, mx, my, mz, null);
            p.isSmoke = true;
            p.maxAge = 25 + Math.random() * 15; // 1.25s - 2.0s
            p.floating = true; // Smoke rises without falling back
            // Increased scale by 70% (1.6 * 1.7 = 2.72)
            p.baseScale = 2.72 + Math.random() * 1.36;
            this.particles.push(p);
        }
    }

    spawnTorchSmoke(world, x, y, z) {
        this.spawnCustomSmoke(world, x, y, z, (Math.random() < 0.12) ? 0x222222 : 0xAAAAAA);
    }

    spawnCustomSmoke(world, x, y, z, color) {
        let mx = (Math.random() - 0.5) * 0.01;
        let my = 0.015 + Math.random() * 0.02; 
        let mz = (Math.random() - 0.5) * 0.01;

        let p = new Particle(world, x, y, z, mx, my, mz, null);
        p.isSmoke = true;
        p.maxAge = 20 + Math.random() * 20;
        p.floating = true;
        p.baseScale = 1.0 + Math.random() * 0.5;
        p.color = color;
        this.particles.push(p);
    }

    spawnCritParticles(world, x, y, z) {
        for (let i = 0; i < 12; i++) {
            let mx = (Math.random() - 0.5) * 0.2;
            let my = (Math.random() - 0.5) * 0.2;
            let mz = (Math.random() - 0.5) * 0.2;
            
            let p = new Particle(world, x, y, z, mx, my, mz, null);
            p.isCrit = true;
            p.maxAge = 15 + Math.random() * 10;
            p.baseScale = 0.8 + Math.random() * 0.5;
            this.particles.push(p);
        }
    }

    spawnNoteParticles(world, x, y, z) {
        const colors = [0xFF0000, 0x0000FF, 0xFFAA00, 0xFFFF00, 0xAA00FF]; 
        const color = colors[Math.floor(Math.random() * colors.length)];

        let mx = (Math.random() - 0.5) * 0.02;
        let my = 0.04 + Math.random() * 0.04; // Slightly faster rise speed
        let mz = (Math.random() - 0.5) * 0.02;

        let p = new Particle(world, x, y, z, mx, my, mz, null);
        p.isNote = true;
        p.color = color;
        p.maxAge = 35 + Math.random() * 15;
        p.floating = true; 
        p.baseScale = 1.1;
        this.particles.push(p);
    }

    spawnEatingParticles(player, block) {
        if (!block) return;
        
        const eyePos = player.getPositionEyes(1.0);
        const look = player.getLook(1.0);
        
        // Spawn particles in front of player's face
        const px = eyePos.x + look.x * 0.4;
        const py = eyePos.y + look.y * 0.4 - 0.15;
        const pz = eyePos.z + look.z * 0.4;

        const color = block.getColor(null, 0, 0, 0, EnumBlockFace.TOP);

        for (let i = 0; i < 6; i++) {
            let mx = (Math.random() - 0.5) * 0.08;
            let my = (Math.random() - 0.5) * 0.08 - 0.05; 
            let mz = (Math.random() - 0.5) * 0.08;
            
            let p = new Particle(player.world, px + mx, py, pz + mz, mx, my, mz, block, color);
            // Randomly pick a corner of the food texture
            p.uOff = Math.floor(Math.random() * 4);
            p.vOff = Math.floor(Math.random() * 4);
            this.particles.push(p);
        }
    }
    
    tick() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            
            p.prevX = p.x;
            p.prevY = p.y;
            p.prevZ = p.z;
            p.age++;

            if (!p.floating) {
                p.motionY -= 0.04; // Gravity
            }
            
            p.x += p.motionX;
            p.y += p.motionY;
            p.z += p.motionZ;

            p.motionX *= 0.98;
            p.motionY *= 0.98;
            p.motionZ *= 0.98;

            if (p.age > p.maxAge) {
                this.particles.splice(i, 1);
            }
        }

        // Particle bursts (block breaks, mob deaths, explosions) can
        // temporarily outpace expiration. Keep a hard, settings-aware cap so
        // a busy world cannot retain thousands of collision objects.
        const particleSetting = this.minecraft.settings.particles;
        const maxParticles = particleSetting === 0 ? 600 : (particleSetting === 2 ? 2400 : 1200);
        if (this.particles.length > maxParticles) {
            this.particles.splice(0, this.particles.length - maxParticles);
        }
    }
    
    render(camera, partialTicks) {
        // Must clear previous frame geometry
        // Particle materials point at the shared Minecraft texture cache.
        // Dispose transient geometry/materials, but never tear down those
        // shared textures every frame.
        disposeGroup(this.group, false);
        
        if (this.particles.length === 0) return;
        
        // Group particles by texture to batch draw calls
        let batches = new Map();
        
        for (let p of this.particles) {
            let texInfo = this.getTextureInfo(p);
            let key = texInfo.texture; // The texture object or name
            
            if (!batches.has(key)) {
                batches.set(key, { texture: key, particles: [], isAtlas: texInfo.isAtlas });
            }
            batches.get(key).particles.push(p);
        }

        let matrix = camera.matrixWorld;
        let right = new THREE.Vector3(matrix.elements[0], matrix.elements[1], matrix.elements[2]);
        let up = new THREE.Vector3(matrix.elements[4], matrix.elements[5], matrix.elements[6]);
        let baseSize = 0.055; 

        // Render each batch
        for (let batch of batches.values()) {
            let tess = new Tessellator();
            tess.skipNormalCalculation = true;
            let texture = (typeof batch.texture === 'string') ? this.minecraft.getThreeTexture(batch.texture) : batch.texture;

            if (batch.isAtlas) {
                texture = this.minecraft.worldRenderer.textureTerrain;
            }
            
            if (texture) {
                tess.bindTexture(texture);
            }

            tess.startDrawing();
            
            // Set full white color with alpha
            tess.setColor(1, 1, 1, 1);

            for (let p of batch.particles) {
                let x = p.prevX + (p.x - p.prevX) * partialTicks;
                let y = p.prevY + (p.y - p.prevY) * partialTicks;
                let z = p.prevZ + (p.z - p.prevZ) * partialTicks;
                
                let minU = 0, maxU = 1, minV = 0, maxV = 1;
                if (p.isSmoke) {
                    // 8 frame strip. Play right to left (7 down to 0) as particle ages
                    let frame = 7 - Math.floor((p.age / p.maxAge) * 8);
                    frame = Math.max(0, Math.min(7, frame));
                    minU = frame / 8.0;
                    maxU = (frame + 1) / 8.0;
                    // Note: If sheet is small to big (0->7), playing 7->0 makes it start big and vanish
                } else if (p.isCrit || p.isNote) {
                    // Spritesheet 2x1: 0=Crit, 1=Note
                    minU = p.isCrit ? 0.0 : 0.5;
                    maxU = minU + 0.5;
                    minV = 0.0;
                    maxV = 1.0;
                    if (p.isNote) {
                        // Fix flipped note particle
                        [minV, maxV] = [maxV, minV];
                    }
                } else if (!p.isFlame && !p.isLavaPop) {
                    let uv = this.getParticleUV(p.block, p.uOff, p.vOff);
                    minU = uv.minU; maxU = uv.maxU; minV = uv.minV; maxV = uv.maxV;
                }
                
                // Flip V for renderer
                let t = minV; minV = 1-maxV; maxV = 1-t;
                
                // Shrinking logic for flame
                let scale = p.baseScale;
                let finalBaseSize = baseSize;

                if (p.isFlame) {
                    scale *= (1.0 - (p.age / p.maxAge));
                    // Increase flame particle size by 60% again (2.56 * 1.6 ≈ 4.1)
                    finalBaseSize *= 4.1;
                }

                if (p.isLavaPop) {
                    // Lava pops shrink slightly before vanishing
                    scale *= (1.2 - (p.age / p.maxAge) * 0.4);
                    finalBaseSize *= 3.2; // Lava pops are chunky
                }
                
                if (p.isCrit) {
                    // Crits shrink fast
                    scale *= (1.0 - (p.age / p.maxAge));
                    finalBaseSize *= 2.5;
                }

                let size = finalBaseSize * scale;

                // Apply lighting brightness (ensure minimum so particles aren't pitch black)
                // Smoke is now treated similarly to flame/lava for consistent visibility
                let brightness = (p.isFlame || p.isLavaPop || p.isSmoke || p.isCrit || p.isNote) ? 1.0 : Math.max(0.4, p.world.getLightBrightness(Math.floor(p.x) || 0, Math.floor(p.y) || 0, Math.floor(p.z) || 0));
                
                // Ensure brightness and color components are valid numbers to prevent WebGL black screens
                brightness = isFinite(brightness) ? brightness : 1.0;
                const r = isFinite((p.color >> 16) & 0xFF) ? ((p.color >> 16) & 0xFF) / 255 : 1.0;
                const g = isFinite((p.color >> 8) & 0xFF) ? ((p.color >> 8) & 0xFF) / 255 : 1.0;
                const b = isFinite(p.color & 0xFF) ? (p.color & 0xFF) / 255 : 1.0;
                
                tess.setColor(r * brightness, g * brightness, b * brightness, 1);
                
                tess.addVertexWithUV(x + (-right.x - up.x) * size, y + (-right.y - up.y) * size, z + (-right.z - up.z) * size, minU, maxV);
                tess.addVertexWithUV(x + (right.x - up.x) * size, y + (right.y - up.y) * size, z + (right.z - up.z) * size, maxU, maxV);
                tess.addVertexWithUV(x + (right.x + up.x) * size, y + (right.y + up.y) * size, z + (right.z + up.z) * size, maxU, minV);
                tess.addVertexWithUV(x + (-right.x + up.x) * size, y + (-right.y + up.y) * size, z + (-right.z + up.z) * size, minU, minV);
            }
            
            let mesh = tess.draw(this.group);
            if (mesh) {
                mesh.material.side = THREE.DoubleSide;
                mesh.material.alphaTest = 0.1;
                // Ensure transparency is enabled for particles (foliage etc)
                mesh.material.transparent = true;
                // Disable depth writing for better sorting of overlapping particles
                mesh.material.depthWrite = false;
            }
        }
    }

    getTextureInfo(particle) {
        if (!particle || !particle.block) {
            if (particle && particle.isLavaPop) return { texture: "../../lava (3).png", isAtlas: false };
            if (particle && particle.isSmoke) return { texture: "../../smoke.png", isAtlas: false };
            if (particle && (particle.isCrit || particle.isNote)) return { texture: "../../critandnote.png", isAtlas: false };
            return { texture: "../../flame.png", isAtlas: false };
        }
        let block = particle.block;

        // 1. Check for custom face objects
        let textureInfo = block.getTextureForFace(EnumBlockFace.NORTH);
        if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
            let tex = this.minecraft.getThreeTexture(textureInfo.name);
            if (!tex && !textureInfo.name.startsWith("../../")) {
                tex = this.minecraft.getThreeTexture("../../" + textureInfo.name);
            }
            if (tex) return { texture: tex, isAtlas: false };
        }

        // 2. Check explicitly provided texture names (standard for items/ores/special blocks)
        if (block.textureName) {
            let tex = this.minecraft.getThreeTexture(block.textureName);
            if (!tex && !block.textureName.startsWith("../../")) {
                tex = this.minecraft.getThreeTexture("../../" + block.textureName);
            }
            if (tex) return { texture: tex, isAtlas: false };
        }

        // 3. Handle default atlas types
        let type = block.getRenderType();
        if (type === BlockRenderType.BLOCK || type === BlockRenderType.TORCH) {
            return { texture: null, isAtlas: true };
        }
        
        // 4. Fallback to atlas if nothing else found
        return { texture: null, isAtlas: true };
    }

    getParticleUV(block, uOff, vOff) {
        // Calculate UVs based on block type/texture
        let type = block.getRenderType();
        // Use TOP for Grass and Mycelium to get the correct texture/index from the atlas
        let queryFace = EnumBlockFace.NORTH;
        if (block.getId() === 2 || block.getId() === 110) queryFace = EnumBlockFace.TOP;

        let textureInfo = block.getTextureForFace(queryFace);
        
        let uBase = 0;
        let vBase = 0;
        let uSize = 1;
        let vSize = 1;

        // If the block provides a detailed texture object, use its metadata primarily
        if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
            let spriteCount = textureInfo.cols || block.cols || 1;
            let spriteRows = textureInfo.rows || block.rows || 1;
            let index = textureInfo.index !== undefined ? textureInfo.index : (block.textureIndex || 0);
            
            uSize = 1.0 / spriteCount;
            vSize = 1.0 / spriteRows;
            uBase = (index % spriteCount) * uSize;
            vBase = Math.floor(index / spriteCount) * vSize;
        } 
        // Fallback for blocks that have a textureName but return simple IDs or use the hardcoded list
        else if (block.textureName) {
            const name = block.textureName;
            let spriteCols = block.cols || 1;
            let spriteRows = block.rows || 1;

            if (spriteCols === 1) { // Only if not already defined by block
                if (name.includes("tools (1).png")) spriteCols = 43;
                else if (name.includes("redstonestuff.png")) spriteCols = 22;
                else if (name.includes("items (1).png")) spriteCols = 37;
                else if (name.includes("farming.png")) spriteCols = 20;
                else if (name.includes("food.png")) spriteCols = 18;
                else if (name.includes("sandstuff.png")) spriteCols = 10;
                else if (name.includes("desert (1).png")) spriteCols = 10;
                else if (name.includes("orestuff.png")) spriteCols = 14;
                else if (name.includes("nether.png")) spriteCols = 5;
                else if (name.includes("furnace")) spriteCols = 4;
                else if (name.includes("chest")) spriteCols = 3;
                else if (name.includes("stonesheet")) spriteCols = 8;
                else if (name.includes("trapdoorsheet")) spriteCols = 6;
                else if (name.includes("All doors")) spriteCols = 17;
                else if (name.includes("magma")) spriteCols = 3;
                else if (name.includes("coloredglass")) spriteCols = 14;
                else if (name.includes("wools.png")) spriteCols = 15;
                else if (name.includes("grasslandfoliage")) spriteCols = 5;
                else if (name.includes("deadandsugar")) spriteCols = 2;
                else if (name.includes("desert (3)")) spriteCols = 11;
                else if (name.includes("beetroot")) spriteCols = 7;
                else if (name.includes("dye.png")) spriteCols = 16;
                else if (name.includes("foliage.png")) spriteCols = 21;
                else if (name.includes("endstuff.png")) spriteCols = 7;
                else if (name.includes("signs.png")) spriteCols = 5;
                else if (name.includes("food2.png")) spriteCols = 5;
                else if (name.includes("treestuff.png")) spriteCols = 30;
            }

            uSize = 1.0 / spriteCols;
            vSize = 1.0 / spriteRows;
            
            // Resolve index correctly for logs and complex items
            let index = block.textureIndex;
            if (index === undefined && typeof textureInfo === 'number') index = textureInfo;
            if (index === undefined) index = 0;

            uBase = (index % spriteCols) * uSize;
            vBase = Math.floor(index / spriteCols) * vSize;
        } else if (typeof textureInfo === 'number') {
            // Priority 2: Standard Terrain Atlas (blocks.png) - 14 columns, 1 row
            let spriteCount = 14;
            uSize = 1.0 / spriteCount;
            uBase = (textureInfo % spriteCount) * uSize;
        }

        // 4x4 subdivision logic within the resolved sprite area
        let subU = uSize / 4;
        let subV = vSize / 4;
        
        let minU = uBase + (uOff % 4) * subU;
        let maxU = minU + subU;
        let minV = vBase + (vOff % 4) * subV;
        let maxV = minV + subV;
        
        return { minU, maxU, minV, maxV };
    }
}
