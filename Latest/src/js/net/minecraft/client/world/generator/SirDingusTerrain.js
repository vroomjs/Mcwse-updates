/*
 * Terrain-density portion ported from the supplied
 * "literally just minecraft by SirDingus" project.
 *
 * This module deliberately contains only the overworld shape generator:
 * biome-weighted density, water level, and amplified-density options. Surface
 * painting, caves, ores, structures, entities, and all other game systems
 * remain in this project’s existing generator.
 */

class Perlin {
    constructor(random) {
        const permutation = new Uint8Array(256);
        for (let i = 0; i < 256; i++) permutation[i] = i;

        for (let i = 255; i > 0; i--) {
            const j = (random() * (i + 1)) | 0;
            const value = permutation[i];
            permutation[i] = permutation[j];
            permutation[j] = value;
        }

        this.permutation = new Uint8Array(512);
        for (let i = 0; i < 512; i++) this.permutation[i] = permutation[i & 255];

        this.offsetX = random() * 256;
        this.offsetY = random() * 256;
        this.offsetZ = random() * 256;
    }

    noise3D(x, y, z) {
        x += this.offsetX;
        y += this.offsetY;
        z += this.offsetZ;

        const floorX = Math.floor(x);
        const floorY = Math.floor(y);
        const floorZ = Math.floor(z);
        x -= floorX;
        y -= floorY;
        z -= floorZ;

        const ix = floorX & 255;
        const iy = floorY & 255;
        const iz = floorZ & 255;
        const fade = value => value * value * value * (value * (value * 6 - 15) + 10);
        const lerp = (amount, start, end) => start + amount * (end - start);
        const gradient = (hash, gx, gy, gz) => {
            hash &= 15;
            const u = hash < 8 ? gx : gy;
            const v = hash < 4 ? gy : (hash === 12 || hash === 14) ? gx : gz;
            return ((hash & 1) ? -u : u) + ((hash & 2) ? -v : v);
        };

        const u = fade(x);
        const v = fade(y);
        const w = fade(z);
        const p = this.permutation;
        const a = p[ix] + iy;
        const aa = p[a] + iz;
        const ab = p[a + 1] + iz;
        const b = p[ix + 1] + iy;
        const ba = p[b] + iz;
        const bb = p[b + 1] + iz;

        return lerp(w,
            lerp(v,
                lerp(u, gradient(p[aa], x, y, z), gradient(p[ba], x - 1, y, z)),
                lerp(u, gradient(p[ab], x, y - 1, z), gradient(p[bb], x - 1, y - 1, z))
            ),
            lerp(v,
                lerp(u, gradient(p[aa + 1], x, y, z - 1), gradient(p[ba + 1], x - 1, y, z - 1)),
                lerp(u, gradient(p[ab + 1], x, y - 1, z - 1), gradient(p[bb + 1], x - 1, y - 1, z - 1))
            )
        );
    }

    noise2D(x, z) {
        return this.noise3D(x, z, 0.5);
    }
}

class Octaves {
    constructor(random, count) {
        this.octaves = [];
        for (let i = 0; i < count; i++) this.octaves.push(new Perlin(random));
    }

    noise2D(x, z) {
        let sum = 0;
        let frequency = 1;
        let amplitude = 1;
        let totalAmplitude = 0;

        for (const octave of this.octaves) {
            sum += octave.noise2D(x * frequency, z * frequency) * amplitude;
            totalAmplitude += amplitude;
            frequency *= 2;
            amplitude *= 0.5;
        }

        return sum / totalAmplitude;
    }

    noise3D(x, y, z) {
        let sum = 0;
        let frequency = 1;
        let amplitude = 1;
        let totalAmplitude = 0;

        for (const octave of this.octaves) {
            sum += octave.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
            totalAmplitude += amplitude;
            frequency *= 2;
            amplitude *= 0.5;
        }

        return sum / totalAmplitude;
    }
}

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

const BIOMES = [
    { base: -1.0, variation: 0.1 },  // ocean
    { base: 0.1, variation: 0.3 },   // plains
    { base: 0.1, variation: 0.2 },   // desert
    { base: 0.3, variation: 1.5 },   // extreme hills
    { base: 0.1, variation: 0.3 },   // forest
    { base: 0.1, variation: 0.4 },   // taiga
    { base: -0.2, variation: 0.1 },  // swampland
    { base: -0.5, variation: 0.0 },  // river
    { base: 0.1, variation: 0.3 },   // ice plains
    { base: 0.2, variation: 0.4 },   // jungle
    { base: -0.5, variation: 0.0 },  // frozen river
    { base: -1.0, variation: 0.1 },  // frozen ocean
    { base: 0.0, variation: 0.05 },  // beach
    { base: -1.8, variation: 0.1 },  // deep ocean
    { base: 0.1, variation: 0.3 },   // birch forest
    { base: 0.1, variation: 0.3 },   // roofed forest
    { base: 0.1, variation: 0.4 },   // flower forest
    { base: 0.125, variation: 0.05 },// savanna
    { base: 0.3, variation: 0.15 },  // mesa
    { base: 0.2, variation: 0.2 }    // mega taiga
];

const BIO = {
    OCEAN: 0,
    PLAINS: 1,
    DESERT: 2,
    HILLS: 3,
    FOREST: 4,
    TAIGA: 5,
    SWAMP: 6,
    RIVER: 7,
    ICE: 8,
    JUNGLE: 9,
    FROZEN_RIVER: 10,
    FROZEN_OCEAN: 11,
    BEACH: 12,
    DEEP_OCEAN: 13,
    BIRCH: 14,
    ROOFED: 15,
    FLOWER: 16,
    SAVANNA: 17,
    MESA: 18,
    MEGA_TAIGA: 19
};

/**
 * Generates the exact coarse density columns used by the supplied project.
 * The returned column has 17 samples at y = 0, 8, ..., 128; callers interpolate
 * those samples into a 16x16x128 chunk.
 */
export default class SirDingusTerrain {
    constructor(seed, { amplified = false, cliffStrength = 1.0 } = {}) {
        this.seed = Number(seed) >>> 0;
        this.amplified = amplified;

        const random = mulberry32(this.seed);
        this.densityNoise = new Octaves(random, 5);
        this.detailNoise = new Octaves(random, 3);
        this.heightNoise = new Octaves(random, 4);
        this.temperatureNoise = new Octaves(random, 3);
        this.rainfallNoise = new Octaves(random, 3);
        this.continentalNoise = new Octaves(random, 4);
        this.riverNoise = new Octaves(random, 4);
        this.mountainNoise = new Octaves(random, 3);
        // Cliff/overhang shaping. `cliffNoise` is the 3D field that lets the
        // surface fold back over itself (overhangs, arches, undercut cliff
        // faces); `cliffRegion` decides where in the world that is allowed to
        // happen so the effect stays a landmark instead of a global texture.
        this.cliffNoise = new Octaves(random, 3);
        this.cliffRegion = new Octaves(random, 2);
        this.cliffStrength = cliffStrength;

        this.columnCache = new Map();
        this.biomeCache = new Map();
    }

    biomeAt(x, z) {
        const key = x + "," + z;
        const cached = this.biomeCache.get(key);
        if (cached !== undefined) return cached;

        const continentalness = this.continentalNoise.noise2D(x / 700, z / 700) + 0.12;
        const temperature = this.temperatureNoise.noise2D(x / 420, z / 420) * 1.6 + this.detailNoise.noise2D(x / 30, z / 30) * 0.05;
        const rainfall = this.rainfallNoise.noise2D(x / 380 + 50, z / 380) * 1.6;
        const variation = this.mountainNoise.noise2D(x / 210 + 100, z / 210 - 50);
        const isCold = temperature < -0.32;

        let biome;
        if (continentalness < -0.11) biome = isCold ? BIO.FROZEN_OCEAN : BIO.DEEP_OCEAN;
        else if (continentalness < 0.02) biome = isCold ? BIO.FROZEN_OCEAN : BIO.OCEAN;
        else if (continentalness < 0.034 && !isCold && this.mountainNoise.noise2D(x / 260, z / 260) <= 0.28) biome = BIO.BEACH;
        else if (Math.abs(this.riverNoise.noise2D(x / 330, z / 330)) < 0.022 && continentalness > 0.05) biome = isCold ? BIO.FROZEN_RIVER : BIO.RIVER;
        else if (this.mountainNoise.noise2D(x / 260, z / 260) > 0.28) biome = BIO.HILLS;
        else if (isCold) biome = rainfall < -0.05 ? BIO.ICE : BIO.TAIGA;
        else if (temperature < -0.18 && rainfall > 0.05 && variation > 0.15) biome = BIO.MEGA_TAIGA;
        else if (temperature > 0.3 && rainfall < -0.05) biome = temperature > 0.45 && variation > 0.05 ? BIO.MESA : BIO.DESERT;
        else if (temperature > 0.3 && rainfall < 0.14) biome = BIO.SAVANNA;
        else if (temperature > 0.22 && rainfall > 0.2) biome = BIO.JUNGLE;
        else if (rainfall > 0.32) biome = BIO.SWAMP;
        else if (rainfall > -0.02) biome = variation > 0.3 ? BIO.ROOFED : variation < -0.3 ? BIO.BIRCH : Math.abs(variation) < 0.03 ? BIO.FLOWER : BIO.FOREST;
        else biome = BIO.PLAINS;

        if (this.biomeCache.size > 60000) this.biomeCache.clear();
        this.biomeCache.set(key, biome);
        return biome;
    }

    column(gridX, gridZ) {
        const key = gridX + "," + gridZ;
        const cached = this.columnCache.get(key);
        if (cached) return cached;

        let baseSum = 0;
        let variationSum = 0;
        let weightSum = 0;

        for (let offsetX = -2; offsetX <= 2; offsetX++) {
            for (let offsetZ = -2; offsetZ <= 2; offsetZ++) {
                const biome = BIOMES[this.biomeAt((gridX + offsetX) * 4, (gridZ + offsetZ) * 4)];
                const weight = 10 / Math.sqrt(offsetX * offsetX + offsetZ * offsetZ + 0.2) / (biome.base + 2);
                baseSum += biome.base * weight;
                variationSum += biome.variation * weight;
                weightSum += weight;
            }
        }

        const base = baseSum / weightSum;
        const variation = variationSum / weightSum;
        const worldX = gridX * 4;
        const worldZ = gridZ * 4;
        const heightVariation = this.heightNoise.noise2D(worldX / 200, worldZ / 200) * 0.25;
        const terrainHeight = this.amplified && base > -0.3
            ? 70 + (base + heightVariation) * 20
            : 67 + (base + heightVariation) * 17;
        const terrainSpread = this.amplified
            ? 1.5 + variation * 22 + Math.max(0, base + 0.2) * 60 * (1 + variation * 2)
            : 1.5 + variation * 22;

        // How much this area is allowed to form cliffs. Rough terrain
        // (hills/mesa, high biome variation) gets the most, flat plains and
        // oceans get essentially none, and a slow region noise keeps it
        // clustered into believable ranges rather than sprinkled everywhere.
        const region = Math.max(0, this.cliffRegion.noise2D(worldX / 520 + 11, worldZ / 520 - 7));
        const roughness = Math.min(1, Math.max(0, (variation - 0.18) / 0.9));
        const cliffAmount = Math.min(1, region * 2.1) * roughness * this.cliffStrength;

        const column = new Float32Array(17);
        for (let gridY = 0; gridY < 17; gridY++) {
            const worldY = gridY * 8;
            const noise = this.densityNoise.noise3D(worldX / 90, worldY / 70, worldZ / 90) * 1.6
                + this.detailNoise.noise3D(worldX / 24, worldY / 18, worldZ / 24) * 0.25;
            let density = (terrainHeight - worldY) / terrainSpread + noise;

            if (cliffAmount > 0.001 && worldY > 40 && worldY < 124) {
                // Concentrate the fold around the local surface: deep
                // underground it would just be cave noise, and high above it
                // would leave floating islands.
                const distance = (worldY - terrainHeight) / 26;
                const nearSurface = Math.exp(-distance * distance);

                // Low vertical frequency relative to horizontal frequency is
                // what produces vertical cliff walls with undercuts and the
                // occasional natural arch, instead of rolling hills.
                const fold = this.cliffNoise.noise3D(worldX / 48, worldY / 90, worldZ / 48) * 1.0
                    + this.cliffNoise.noise3D(worldX / 19, worldY / 46, worldZ / 19) * 0.45;

                // Sharpen it so the field spends its time either clearly solid
                // or clearly open, giving hard cliff edges rather than slopes.
                const sharpened = Math.sign(fold) * Math.min(1, Math.abs(fold) * 1.65);
                density += sharpened * nearSurface * cliffAmount * 1.35;
            }

            if (worldY > 120) density -= (worldY - 120) / 3;
            column[gridY] = density;
        }

        if (this.columnCache.size > 30000) this.columnCache.clear();
        this.columnCache.set(key, column);
        return column;
    }
}
