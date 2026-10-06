import EnumSkyBlock from "../../util/EnumSkyBlock.js";
import Block from "./block/Block.js";
import World from "./World.js";
import ChunkSection from "./ChunkSection.js";
import * as THREE from "../../../../../../libraries/three.module.js";

export default class Chunk {

    static SECTION_AMOUNT = 16;

    constructor(world, x, z) {
        this.world = world;
        this.x = x;
        this.z = z;

        this.group = new THREE.Object3D();
        this.group.matrixAutoUpdate = false;
        this.group.chunkX = x;
        this.group.chunkZ = z;

        this.loaded = false;
        this.lightReady = false; // Set by LightEngine.initChunk once light is valid
        this.isTerrainPopulated = false;
        this.isDirty = false; // Track if chunk has player modifications

        // Initialize sections
        this.sections = [];
        for (let y = 0; y < Chunk.SECTION_AMOUNT; y++) {
            let section = new ChunkSection(world, this, x, y, z);

            this.sections[y] = section;
            this.group.add(section.group);
        }

        // Create height map and initialize with 0 to prevent "above ground" check failures during initial lighting passes
        this.heightMap = new Int16Array(256).fill(0);

        // Timer for high-frequency refresh bursts (0.1s for 5s)
        this.refreshTimer = 0;
    }

    markDirty() {
        this.isDirty = true;
    }

    /**
     * Full light (re)initialisation. Lighting is owned by world.lightEngine;
     * chunks that are not registered yet are lit when World.getChunkAt adds
     * them, so calling this during generation is a no-op.
     */
    generateSkylightMap() {
        if (this.lightReady && this.world.lightEngine) {
            this.world.lightEngine.initChunk(this);
        }
    }

    generateBlockLightMap() {
        // Handled together with sky light by generateSkylightMap / initChunk
    }

    updateBlockLight() {
        this.setModifiedAllSections();
    }

    calculateHeightAt(x, z, startY) {
        // Scan downwards from the top of the world to find the highest solid block
        // startY is clamped to the true world ceiling (127)
        let checkY = Math.min(128, startY + 1); 
        for (let y = checkY; y > 0; y--) {
            let typeId = this.getBlockAt(x, y - 1, z);
            if (typeId === 0) continue;
            
            let block = Block.getById(typeId);
            // Heightmap only tracks blocks that truly obstruct skylight (opacity > 0)
            if (block && block.getOpacity() > 0) {
                return y;
            }
        }
        return 0;
    }

    updateHeightMapAt(x, z) {
        // Re-scan from top down for the highest block in this column
        let y = this.calculateHeightAt(x, z, 127);
        this.setHeightAt(x, z, y);
    }

    setHeightAt(x, z, height) {
        this.heightMap[z << 4 | x] = height;
    }

    /**
     * Is the highest solid block or above
     */
    isHighestBlock(x, y, z) {
        return y >= this.getHighestBlockAt(x, z);
    }

    /**
     * Is above the highest solid block
     */
    isAboveGround(x, y, z) {
        return y >= this.getHeightAt(x, z);
    }

    /**
     * Get the first non-solid block
     */
    getHeightAt(x, z) {
        return this.heightMap[z << 4 | x];
    }

    /**
     * Get the highest solid block
     */
    getHighestBlockAt(x, z) {
        return this.getHeightAt(x, z) - 1;
    }

    setLightAt(sourceType, x, y, z, level) {
        this.sections[y >> 4].setLightAt(sourceType, x, y & 15, z, level);
    }

    setBlockDataAt(x, y, z, data) {
        this.setBlockAt(x, y, z, this.getBlockAt(x, y, z), data);
    }

    setBlockAt(x, y, z, typeId, data = 0) {
        let section = this.sections[y >> 4];
        let yInSection = y & 15;

        let height = this.getHeightAt(x, z);
        let prevTypeId = section.getBlockAt(x, yInSection, z);
        let prevData = section.getBlockDataAt(x, yInSection, z);

        if (prevTypeId === typeId && prevData === data) {
            return false;
        }

        this.isDirty = true;

        section.setBlockAt(x, yInSection, z, typeId);
        section.setBlockDataAt(x, yInSection, z, data);

        if (this.lightReady && this.world.lightEngine) {
            // Update height map (highest sky-blocking block + 1)
            const engine = this.world.lightEngine;
            let newHeight = height;
            let blocksSky = false;
            if (typeId !== 0) {
                const b = Block.getById(typeId);
                blocksSky = !!(b && b.getOpacity() > 0);
            }
            if (blocksSky) {
                if (y >= height) newHeight = y + 1;
            } else if (y === height - 1) {
                newHeight = this.calculateHeightAt(x, z, y);
            }
            if (this.world.dimension === -1) newHeight = height;

            let totalX = (this.x << 4) + x;
            let totalZ = (this.z << 4) + z;

            if (newHeight !== height) {
                this.setHeightAt(x, z, newHeight);
                engine.queueRegion(EnumSkyBlock.SKY, totalX, Math.min(height, newHeight), totalZ, totalX, Math.max(height, newHeight) - 1, totalZ);
            }

            engine.queueRegion(EnumSkyBlock.SKY, totalX, y, totalZ, totalX, y, totalZ);
            engine.queueRegion(EnumSkyBlock.BLOCK, totalX, y, totalZ, totalX, y, totalZ);
        }

        if (!this.loaded) {
            return true;
        }

        // Handle block abilities
        if (typeId !== 0) {
            let block = Block.getById(typeId);
            if (block) block.onBlockAdded(this.world, (this.x << 4) + x, y, (this.z << 4) + z);
        }

        return true;
    }

    setBlockId(x, y, z, typeId, data = 0) {
        let section = this.getSection(y >> 4);
        section.setBlockAt(x, y & 15, z, typeId);
        if (data !== 0) section.setBlockDataAt(x, y & 15, z, data);
    }

    getBlockID(x, y, z) {
        return this.sections[y >> 4].getBlockAt(x, y & 15, z);
    }

    getBlockAt(x, y, z) {
        return this.sections[y >> 4].getBlockAt(x, y & 15, z);
    }

    getBlockDataAt(x, y, z) {
        return this.sections[y >> 4].getBlockDataAt(x, y & 15, z);
    }

    getSection(y) {
        return this.sections[y];
    }

    rebuild(renderer) {
        for (let y = 0; y < this.sections.length; y++) {
            this.sections[y].rebuild(renderer);
        }
    }

    isLoaded() {
        return this.loaded;
    }

    unload() {
        if (!this.loaded) return;
        this.loaded = false;

        // Explicitly release WebGL buffers for streamed-out geometry. Removing
        // a group from the scene only drops JS references; Three.js otherwise
        // keeps GPU allocations alive until the renderer is torn down.
        for (const section of this.sections) {
            section.group.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material && material.dispose());
                    } else if (child.material && !(child.material.userData && child.material.userData.sharedChunkMaterial)) {
                        child.material.dispose();
                    }
                }
            });
            section.group.clear();
            section.isModified = true;
            section.inUpdateQueue = false;
            section.priority = false;
            section.lastBuiltLOD = null;
        }
    }

    setModifiedAllSections() {
        for (let y = 0; y < this.sections.length; y++) {
            this.sections[y].isModified = true;
        }
    }
}
