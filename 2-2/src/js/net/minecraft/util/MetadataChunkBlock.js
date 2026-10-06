import Block from "../client/world/block/Block.js";
import EnumSkyBlock from "./EnumSkyBlock.js";
import World from "../client/world/World.js";

export default class MetadataChunkBlock {

    constructor(type, x1, y1, z1, x2, y2, z2) {
        this.type = type;
        this.x1 = x1;
        this.y1 = y1;
        this.z1 = z1;
        this.x2 = x2;
        this.y2 = y2;
        this.z2 = z2;
    }

    updateBlockLightning(world) {
        let lastChunkX = -999999, lastChunkZ = -999999;
        let lastChunk = null;

        for (let x = this.x1; x <= this.x2; x++) {
            for (let z = this.z1; z <= this.z2; z++) {
                let chunkX = x >> 4, chunkZ = z >> 4;
                if (chunkX !== lastChunkX || chunkZ !== lastChunkZ) {
                    lastChunk = world.getChunkAt(chunkX, chunkZ);
                    lastChunkX = chunkX, lastChunkZ = chunkZ;
                }
                if (!lastChunk || !lastChunk.loaded) continue;

                // Process vertical column top-down to allow skylight to propagate efficiently.
                for (let y = this.y2; y >= this.y1; y--) {
                    if (y < 0 || y >= World.TOTAL_HEIGHT) continue;

                    let section = lastChunk.getSection(y >> 4);
                    let relX = x & 15, relY = y & 15, relZ = z & 15;
                    let savedLightValue = section.getLightAt(this.type, relX, relY, relZ);
                    
                    let typeId = section.getBlockAt(relX, relY, relZ);
                    let block = Block.getById(typeId);
                    
                    // True block opacity (0 for air, up to 15).
                    // Translucent blocks like glass (opacity 0.01) result in 0 int opacity.
                    let opacity = (typeId === 0 || !block) ? 0 : Math.round(block.getOpacity() * 15);
                    
                    // All light movement through blocks (even air) must decay by at least 1,
                    // except for vertical sunlight through non-opaque blocks.
                    let propagationDecay = Math.max(1, opacity);

                    let sourceLevel = 0;
                    if (this.type === EnumSkyBlock.SKY) {
                        if (lastChunk.isAboveGround(relX, y, relZ)) sourceLevel = 15;
                    } else {
                        sourceLevel = typeId === 0 ? 0 : block.getLightValue(world, x, y, z);
                    }

                    let newLevel = 0;
                    if (opacity < 15 || sourceLevel > 0) {
                        // Sample neighbors in 6 directions.
                        let x1 = world.getSavedLightValue(this.type, x - 1, y, z);
                        let x2 = world.getSavedLightValue(this.type, x + 1, y, z);
                        let y1 = world.getSavedLightValue(this.type, x, y - 1, z);
                        let y2 = world.getSavedLightValue(this.type, x, y + 1, z);
                        let z1 = world.getSavedLightValue(this.type, x, y, z - 1);
                        let z2 = world.getSavedLightValue(this.type, x, y, z + 1);

                        // Vertical sky light special case: no decay if falling straight down from an air block above.
                        if (this.type === EnumSkyBlock.SKY && y2 === 15 && opacity === 0 && world.dimension !== -1) {
                            newLevel = 15;
                        } else {
                            newLevel = Math.max(x1, x2, y1, y2, z1, z2) - propagationDecay;
                        }
                        
                        if (newLevel < 0) newLevel = 0;
                        if (sourceLevel > newLevel) newLevel = sourceLevel;
                    }

                    if (savedLightValue !== newLevel) {
                        section.setLightAt(this.type, relX, relY, relZ, newLevel);
                        
                        // If light level changed significantly, ensure visuals refresh.
                        if (Math.abs(savedLightValue - newLevel) >= 1) {
                             section.isModified = true;
                             // Notify neighboring chunks at boundaries to fix seams.
                             if (relX === 0) world.markNeighborsForRebuild(lastChunk.x - 1, lastChunk.z);
                             if (relX === 15) world.markNeighborsForRebuild(lastChunk.x + 1, lastChunk.z);
                             if (relZ === 0) world.markNeighborsForRebuild(lastChunk.x, lastChunk.z - 1);
                             if (relZ === 15) world.markNeighborsForRebuild(lastChunk.x, lastChunk.z + 1);
                        }

                        // Propagate change to neighbors by queuing updates.
                        const notify = (nx, ny, nz) => {
                            world.updateLight(this.type, nx, ny, nz, nx, ny, nz, false);
                        };
                        notify(x - 1, y, z);
                        notify(x + 1, y, z);
                        notify(x, y - 1, z);
                        notify(x, y + 1, z);
                        notify(x, y, z - 1);
                        notify(x, y, z + 1);
                    }
                }
            }
        }
    }

    isOutsideOf(x1, y1, z1, x2, y2, z2) {
        if (x1 >= this.x1 && y1 >= this.y1 && z1 >= this.z1 && x2 <= this.x2 && y2 <= this.y2 && z2 <= this.z2) {
            return true;
        }

        let radius = 1;
        if (x1 >= this.x1 - radius
            && y1 >= this.y1 - radius
            && z1 >= this.z1 - radius
            && x2 <= this.x2 + radius
            && y2 <= this.y2 + radius
            && z2 <= this.z2 + radius) {

            let distanceX = this.x2 - this.x1;
            let distanceY = this.y2 - this.y1;
            let distanceZ = this.z2 - this.z1;

            if (x1 > this.x1) {
                x1 = this.x1;
            }
            if (y1 > this.y1) {
                y1 = this.y1;
            }
            if (z1 > this.z1) {
                z1 = this.z1;
            }
            if (x2 < this.x2) {
                x2 = this.x2;
            }
            if (y2 < this.y2) {
                y2 = this.y2;
            }
            if (z2 < this.z2) {
                z2 = this.z2;
            }

            let newDistanceX = x2 - x1;
            let newDistanceY = y2 - y1;
            let newDistanceZ = z2 - z1;

            let size = distanceX * distanceY * distanceZ;
            let newSize = newDistanceX * newDistanceY * newDistanceZ;

            if (newSize - size <= 2) {
                this.x1 = x1;
                this.y1 = y1;
                this.z1 = z1;
                this.x2 = x2;
                this.y2 = y2;
                this.z2 = z2;
                return true;
            }
        }
        return false;
    }

}