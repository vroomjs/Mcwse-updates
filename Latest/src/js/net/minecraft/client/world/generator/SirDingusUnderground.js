/*
 * Underground feature portion ported from the supplied
 * "literally just minecraft by SirDingus" project.
 *
 * It intentionally handles only worm caves, ravines, and the source project's
 * low-level lava fill. Surface decoration and every tree generator stay in the
 * existing WorldGenerator population path.
 */

import {BlockRegistry} from "../block/BlockRegistry.js";

function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function chunkSeed(seed, chunkX, chunkZ, salt) {
    let hash = seed ^ Math.imul(chunkX, 341873128) ^ Math.imul(chunkZ, 132897987) ^ Math.imul(salt, 2654435761);
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^ (hash >>> 16)) >>> 0;
}

function nextSeed(random) {
    return (random() * 0x100000000) >>> 0;
}

export default class SirDingusUnderground {
    constructor(seed) {
        this.seed = Number(seed) >>> 0;
        this.chunkRange = 8;
        // 1-in-N chunks may start a ravine (vanilla-ish is 50; this build read
        // far too dense at that value with its smaller world scale).
        this.ravineRarity = 160;
    }

    generateInChunk(chunkX, chunkZ, primer) {
        const ids = {
            air: 0,
            stone: BlockRegistry.STONE.getId(),
            grass: BlockRegistry.GRASS.getId(),
            dirt: BlockRegistry.DIRT.getId(),
            water: BlockRegistry.WATER.getId(),
            lava: BlockRegistry.LAVA.getId(),
            sand: BlockRegistry.SAND.getId(),
            gravel: BlockRegistry.GRAVEL.getId(),
            sandstone: BlockRegistry.SANDSTONE.getId(),
            coalOre: BlockRegistry.COAL_ORE.getId(),
            ironOre: BlockRegistry.IRON_ORE.getId(),
            goldOre: BlockRegistry.GOLD_ORE.getId(),
            lapisOre: BlockRegistry.LAPIS_ORE.getId(),
            diamondOre: BlockRegistry.DIAMOND_ORE.getId(),
            redstoneOre: BlockRegistry.REDSTONE_ORE.getId()
        };

        this.generateCaves(chunkX, chunkZ, primer, ids);
        this.generateRavines(chunkX, chunkZ, primer, ids);
    }

    generateCaves(originChunkX, originChunkZ, primer, ids) {
        const range = this.chunkRange;

        for (let chunkX = originChunkX - range; chunkX <= originChunkX + range; chunkX++) {
            for (let chunkZ = originChunkZ - range; chunkZ <= originChunkZ + range; chunkZ++) {
                const random = mulberry32(chunkSeed(this.seed, chunkX, chunkZ, 7));
                const randomInt = bound => (random() * bound) | 0;
                let caveCount = randomInt(randomInt(randomInt(40) + 1) + 1);
                if (randomInt(15) !== 0) caveCount = 0;

                for (let cave = 0; cave < caveCount; cave++) {
                    const x = chunkX * 16 + randomInt(16);
                    const y = randomInt(randomInt(120) + 8);
                    const z = chunkZ * 16 + randomInt(16);
                    let tunnelCount = 1;

                    if (randomInt(4) === 0) {
                        this.carveTunnel(
                            originChunkX, originChunkZ, primer, ids, random,
                            x, y, z, 1 + random() * 6, 0, 0, -1, -1, 0.5
                        );
                        tunnelCount += randomInt(4);
                    }

                    for (let tunnel = 0; tunnel < tunnelCount; tunnel++) {
                        let width = random() * 2 + random();
                        if (randomInt(10) === 0) width *= random() * random() * 3 + 1;

                        this.carveTunnel(
                            originChunkX, originChunkZ, primer, ids, mulberry32(nextSeed(random)),
                            x, y, z, width, random() * Math.PI * 2,
                            (random() - 0.5) * 2 / 8, 0, 0, 1
                        );
                    }
                }
            }
        }
    }

    carveTunnel(originChunkX, originChunkZ, primer, ids, random, x, y, z, width, yaw, pitch, step, length, verticalScale) {
        const chunkMiddleX = originChunkX * 16 + 8;
        const chunkMiddleZ = originChunkZ * 16 + 8;
        let yawChange = 0;
        let pitchChange = 0;

        if (length <= 0) length = 112 - ((random() * 28) | 0);
        let room = false;
        if (step === -1) {
            step = length / 2;
            room = true;
        }

        const splitAt = ((random() * length / 2) | 0) + length / 4;
        const steep = random() * 6 === 0;

        for (; step < length; step++) {
            const horizontalRadius = 1.5 + Math.sin(step * Math.PI / length) * width;
            const verticalRadius = horizontalRadius * verticalScale;
            const cosine = Math.cos(pitch);
            x += Math.cos(yaw) * cosine;
            y += Math.sin(pitch);
            z += Math.sin(yaw) * cosine;

            pitch *= steep ? 0.92 : 0.7;
            pitch += pitchChange * 0.1;
            yaw += yawChange * 0.1;
            pitchChange *= 0.9;
            yawChange *= 0.75;
            pitchChange += (random() - random()) * random() * 2;
            yawChange += (random() - random()) * random() * 4;

            if (!room && step === splitAt && width > 1) {
                this.carveTunnel(originChunkX, originChunkZ, primer, ids, mulberry32(nextSeed(random)), x, y, z, random() * 0.5 + 0.5, yaw - Math.PI / 2, pitch / 3, step, length, 1);
                this.carveTunnel(originChunkX, originChunkZ, primer, ids, mulberry32(nextSeed(random)), x, y, z, random() * 0.5 + 0.5, yaw + Math.PI / 2, pitch / 3, step, length, 1);
                return;
            }

            if (!room && ((random() * 4) | 0) === 0) continue;

            const distanceX = x - chunkMiddleX;
            const distanceZ = z - chunkMiddleZ;
            const remaining = length - step;
            const limit = width + 18;
            if (distanceX * distanceX + distanceZ * distanceZ - remaining * remaining > limit * limit) return;
            if (x < chunkMiddleX - 16 - horizontalRadius * 2 || z < chunkMiddleZ - 16 - horizontalRadius * 2 || x > chunkMiddleX + 16 + horizontalRadius * 2 || z > chunkMiddleZ + 16 + horizontalRadius * 2) continue;

            const minX = Math.max(0, Math.floor(x - horizontalRadius) - originChunkX * 16 - 1);
            const maxX = Math.min(16, Math.floor(x + horizontalRadius) - originChunkX * 16 + 1);
            const minY = Math.max(1, Math.floor(y - verticalRadius) - 1);
            const maxY = Math.min(120, Math.floor(y + verticalRadius) + 1);
            const minZ = Math.max(0, Math.floor(z - horizontalRadius) - originChunkZ * 16 - 1);
            const maxZ = Math.min(16, Math.floor(z + horizontalRadius) - originChunkZ * 16 + 1);

            if (this.hasWater(primer, ids, minX, maxX, minY, maxY, minZ, maxZ)) continue;

            for (let blockX = minX; blockX < maxX; blockX++) {
                const offsetX = (blockX + originChunkX * 16 + 0.5 - x) / horizontalRadius;
                for (let blockZ = minZ; blockZ < maxZ; blockZ++) {
                    const offsetZ = (blockZ + originChunkZ * 16 + 0.5 - z) / horizontalRadius;
                    if (offsetX * offsetX + offsetZ * offsetZ >= 1) continue;

                    let hitGrass = false;
                    for (let blockY = maxY - 1; blockY >= minY; blockY--) {
                        const offsetY = (blockY + 0.5 - y) / verticalRadius;
                        if (offsetY > -0.7 && offsetX * offsetX + offsetY * offsetY + offsetZ * offsetZ < 1) {
                            const block = primer.get(blockX, blockY, blockZ);
                            if (block === ids.grass) hitGrass = true;

                            if (this.isCaveCarvable(block, blockY, ids)) {
                                if (blockY < 10) {
                                    // SirDingus fills the deep portions of caves with lava.
                                    primer.set(blockX, blockY, blockZ, ids.lava);
                                } else {
                                    primer.set(blockX, blockY, blockZ, ids.air);
                                    if (hitGrass && blockY > 0 && primer.get(blockX, blockY - 1, blockZ) === ids.dirt) {
                                        primer.set(blockX, blockY - 1, blockZ, ids.grass);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (room) break;
        }
    }

    generateRavines(originChunkX, originChunkZ, primer, ids) {
        const range = this.chunkRange;

        for (let chunkX = originChunkX - range; chunkX <= originChunkX + range; chunkX++) {
            for (let chunkZ = originChunkZ - range; chunkZ <= originChunkZ + range; chunkZ++) {
                const random = mulberry32(chunkSeed(this.seed, chunkX, chunkZ, 11));
                // Ravines were spawning on ~1 chunk in 50 with a 17x17 chunk
                // search window, so almost every surface area had one cutting
                // through it. Thinned out so they read as a landmark again.
                if (((random() * this.ravineRarity) | 0) !== 0) continue;

                const x = chunkX * 16 + random() * 16;
                // Biased deeper as well, so most of them are something you
                // find while caving rather than a scar across the surface.
                const y = 20 + ((random() * 28) | 0);
                const z = chunkZ * 16 + random() * 16;
                const yaw = random() * Math.PI * 2;
                const pitch = (random() - 0.5) * 2 / 8;
                const width = (random() * 2 + random()) * 2.6 + 1;
                const length = 112 - ((random() * 28) | 0);

                this.carveRavine(originChunkX, originChunkZ, primer, ids, mulberry32(nextSeed(random)), x, y, z, width, yaw, pitch, length);
            }
        }
    }

    carveRavine(originChunkX, originChunkZ, primer, ids, random, x, y, z, width, yaw, pitch, length) {
        const chunkMiddleX = originChunkX * 16 + 8;
        const chunkMiddleZ = originChunkZ * 16 + 8;
        let yawChange = 0;
        let pitchChange = 0;
        const verticalShape = new Float32Array(128);
        let multiplier = 1;

        for (let y = 0; y < 128; y++) {
            if (y === 0 || ((random() * 3) | 0) === 0) multiplier = 1 + random() * random();
            verticalShape[y] = multiplier * multiplier;
        }

        for (let step = 0; step < length; step++) {
            let horizontalRadius = 1.5 + Math.sin(step * Math.PI / length) * width;
            let verticalRadius = horizontalRadius * 3.5;
            horizontalRadius *= random() * 0.25 + 0.75;
            verticalRadius *= random() * 0.25 + 0.75;

            const cosine = Math.cos(pitch);
            x += Math.cos(yaw) * cosine;
            y += Math.sin(pitch);
            z += Math.sin(yaw) * cosine;
            pitch *= 0.7;
            pitch += pitchChange * 0.05;
            yaw += yawChange * 0.05;
            pitchChange *= 0.8;
            yawChange *= 0.5;
            pitchChange += (random() - random()) * random() * 2;
            yawChange += (random() - random()) * random() * 4;

            if (((random() * 4) | 0) === 0) continue;

            const distanceX = x - chunkMiddleX;
            const distanceZ = z - chunkMiddleZ;
            const remaining = length - step;
            const limit = width + 18;
            if (distanceX * distanceX + distanceZ * distanceZ - remaining * remaining > limit * limit) return;
            if (x < chunkMiddleX - 16 - horizontalRadius * 2 || z < chunkMiddleZ - 16 - horizontalRadius * 2 || x > chunkMiddleX + 16 + horizontalRadius * 2 || z > chunkMiddleZ + 16 + horizontalRadius * 2) continue;

            const minX = Math.max(0, Math.floor(x - horizontalRadius) - originChunkX * 16 - 1);
            const maxX = Math.min(16, Math.floor(x + horizontalRadius) - originChunkX * 16 + 1);
            const minY = Math.max(1, Math.floor(y - verticalRadius) - 1);
            const maxY = Math.min(120, Math.floor(y + verticalRadius) + 1);
            const minZ = Math.max(0, Math.floor(z - horizontalRadius) - originChunkZ * 16 - 1);
            const maxZ = Math.min(16, Math.floor(z + horizontalRadius) - originChunkZ * 16 + 1);

            if (this.hasWater(primer, ids, minX, maxX, minY, maxY, minZ, maxZ)) continue;

            for (let blockX = minX; blockX < maxX; blockX++) {
                const offsetX = (blockX + originChunkX * 16 + 0.5 - x) / horizontalRadius;
                for (let blockZ = minZ; blockZ < maxZ; blockZ++) {
                    const offsetZ = (blockZ + originChunkZ * 16 + 0.5 - z) / horizontalRadius;
                    if (offsetX * offsetX + offsetZ * offsetZ >= 1) continue;

                    let hitGrass = false;
                    for (let blockY = maxY - 1; blockY >= minY; blockY--) {
                        const offsetY = (blockY + 0.5 - y) / verticalRadius;
                        if ((offsetX * offsetX + offsetZ * offsetZ) * verticalShape[blockY] + offsetY * offsetY / 6 < 1) {
                            const block = primer.get(blockX, blockY, blockZ);
                            if (block === ids.grass) hitGrass = true;

                            if (this.isRavineCarvable(block, ids)) {
                                if (blockY < 10) {
                                    // This is the source project's lava-pool behavior.
                                    primer.set(blockX, blockY, blockZ, ids.lava);
                                } else {
                                    primer.set(blockX, blockY, blockZ, ids.air);
                                    if (hitGrass && primer.get(blockX, blockY - 1, blockZ) === ids.dirt) {
                                        primer.set(blockX, blockY - 1, blockZ, ids.grass);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    hasWater(primer, ids, minX, maxX, minY, maxY, minZ, maxZ) {
        for (let x = minX; x < maxX; x++) {
            for (let z = minZ; z < maxZ; z++) {
                for (let y = maxY + 1; y >= minY - 1; y--) {
                    if (y < 0 || y >= 128) continue;
                    if (primer.get(x, y, z) === ids.water) return true;

                    // Match the source optimization: inner columns have no
                    // need to examine every vertical block for water.
                    if (y !== minY - 1 && x !== minX && x !== maxX - 1 && z !== minZ && z !== maxZ - 1) y = minY;
                }
            }
        }
        return false;
    }

    isCaveCarvable(block, y, ids) {
        return block === ids.stone || block === ids.grass || block === ids.dirt || block === ids.gravel || block === ids.sandstone || (block === ids.sand && y < 50);
    }

    isRavineCarvable(block, ids) {
        return block === ids.stone || block === ids.grass || block === ids.dirt || block === ids.gravel || block === ids.sand || block === ids.sandstone || block === ids.goldOre || block === ids.ironOre || block === ids.coalOre || block === ids.lapisOre || block === ids.diamondOre || block === ids.redstoneOre;
    }
}
