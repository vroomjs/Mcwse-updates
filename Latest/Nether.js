import World from "./src/js/net/minecraft/client/world/World.js";
import Generator from "./src/js/net/minecraft/client/world/generator/Generator.js";
import Chunk from "./src/js/net/minecraft/client/world/Chunk.js";
import * as THREE from "three";

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 128;
const LAVA_Y = 31;

const AIR = 0;
const BEDROCK = 7;
const GRAVEL = 13;
const LAVA = 10;
const FIRE = 51;
const NETHERRACK = 87;
const SOUL_SAND = 88;
const GLOWSTONE = 89;

// This project's mushroom block IDs differ from vanilla/SirDingus source IDs
// (vanilla 39/40 are already used by other blocks here), so map decorations to
// the registered local mushroom IDs.
const RED_MUSHROOM = 34;
const BROWN_MUSHROOM = 35;

const idx = (x, y, z) => x | (z << 4) | (y << 8);
const lerp = (a, b, t) => a + (b - a) * t;

function seedHash(seed) {
    if (typeof seed === "number" && Number.isFinite(seed)) return seed >>> 0;
    if (typeof seed === "bigint") return Number(BigInt.asUintN(32, seed));
    if (seed && typeof seed.low === "number" && typeof seed.high === "number") return (seed.low ^ seed.high) >>> 0;
    const s = String(seed ?? 0);
    if (/^-?\d+$/.test(s)) return Number(BigInt.asUintN(32, BigInt(s)));
    let h = 0;
    for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    return h >>> 0;
}

function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function chunkSeed(seed, cx, cz, salt = 0) {
    let h = seed ^ Math.imul(cx, 341873128) ^ Math.imul(cz, 132897987) ^ Math.imul(salt, 2654435761);
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
}

class Perlin {
    constructor(rand) {
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = (rand() * (i + 1)) | 0;
            const t = p[i];
            p[i] = p[j];
            p[j] = t;
        }
        this.p = new Uint8Array(512);
        for (let i = 0; i < 512; i++) this.p[i] = p[i & 255];
        this.ox = rand() * 256;
        this.oy = rand() * 256;
        this.oz = rand() * 256;
    }

    n3(x, y, z) {
        x += this.ox; y += this.oy; z += this.oz;
        const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
        x -= X; y -= Y; z -= Z;
        const xi = X & 255, yi = Y & 255, zi = Z & 255;
        const u = x * x * x * (x * (x * 6 - 15) + 10);
        const v = y * y * y * (y * (y * 6 - 15) + 10);
        const w = z * z * z * (z * (z * 6 - 15) + 10);
        const p = this.p;
        const A = p[xi] + yi, AA = p[A] + zi, AB = p[A + 1] + zi;
        const B = p[xi + 1] + yi, BA = p[B] + zi, BB = p[B + 1] + zi;
        const grad = (h, gx, gy, gz) => {
            h &= 15;
            const gu = h < 8 ? gx : gy;
            const gv = h < 4 ? gy : (h === 12 || h === 14) ? gx : gz;
            return ((h & 1) ? -gu : gu) + ((h & 2) ? -gv : gv);
        };
        const l = (t, a, b) => a + t * (b - a);
        return l(w,
            l(v,
                l(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
                l(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))
            ),
            l(v,
                l(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
                l(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))
            )
        );
    }

    n2(x, y) {
        return this.n3(x, y, 0.5);
    }
}

class Octaves {
    constructor(rand, n) {
        this.o = [];
        for (let i = 0; i < n; i++) this.o.push(new Perlin(rand));
    }

    n2(x, y) {
        let s = 0, f = 1, a = 1, t = 0;
        for (const o of this.o) {
            s += o.n2(x * f, y * f) * a;
            t += a;
            f *= 2;
            a *= 0.5;
        }
        return s / t;
    }

    n3(x, y, z) {
        let s = 0, f = 1, a = 1, t = 0;
        for (const o of this.o) {
            s += o.n3(x * f, y * f, z * f) * a;
            t += a;
            f *= 2;
            a *= 0.5;
        }
        return s / t;
    }
}

export class NetherWorld extends World {
    constructor(minecraft, seed, worldId = null) {
        super(minecraft, seed, worldId, 0);
        this.dimension = -1;
        this.name = "Nether";
        this.generator = new NetherGenerator(this, seed);

        // Remove sky light.
        this.skylightSubtracted = 15;
    }

    getSkyColor(x, z, partialTicks) {
        return new THREE.Vector3(0.3, 0.05, 0.05);
    }

    getFogColor(partialTicks) {
        return new THREE.Vector3(0.3, 0.05, 0.05);
    }

    calculateSkylightSubtracted(partialTicks) {
        return 15;
    }

    isSnowBiome(x, z) { return false; }
}

// Ported from `literally_just_minecraft_by_SirDingus/js/world/nether.js`.
// It uses a coarse 5x17x5 density lattice (interpolated through each 16x128x16
// chunk) for cavernous netherrack terrain, a lava sea, randomized bedrock, and
// local decorations such as glowstone, soul-sand/gravel shores, lava springs,
// fire patches and mushrooms.
export class NetherGenerator extends Generator {
    constructor(world, seed) {
        super(world, seed);
        this.seed32 = (seedHash(seed) ^ 0x5eed4e7) >>> 0;
        const r = mulberry(this.seed32);
        this.dens = new Octaves(r, 4);
        this.shape = new Octaves(r, 3);
        this.patch = new Octaves(r, 3);
    }

    /**
     * Nether density lattice, rebuilt to read like vanilla's Hell dimension.
     *
     * The previous version sampled at x/26 and x/9 with a y/15 and y/7
     * vertical period. At that frequency the solid/air boundary flips every
     * few blocks in every direction, which is why the dimension came out as
     * an endless warren of same-sized tunnels with no sense of space.
     *
     * Vanilla's feel comes from three things, all of which are restored here:
     *  - a low-frequency field (big, open caverns tens of blocks across),
     *  - a vertical period much longer than the horizontal one, so walls are
     *    vertical and floors/ceilings are broad rather than tubular,
     *  - a hard solid roof and a solid floor under the lava sea, so the
     *    playable band is one continuous connected space you fly through,
     *    punctuated by netherrack pillars and hanging formations.
     */
    lattice(chunkX, chunkZ) {
        const L = new Float32Array(5 * 17 * 5);
        for (let gx = 0; gx <= 4; gx++) {
            for (let gz = 0; gz <= 4; gz++) {
                const x = chunkX * 16 + gx * 4;
                const z = chunkZ * 16 + gz * 4;

                // Slow regional fields: where the ceiling hangs low, where the
                // floor piles up, and where the cavern opens out into a hall.
                const roof = 0.5 + 0.5 * this.shape.n2(x / 260 + 50, z / 260);
                const floor = 0.5 + 0.5 * this.shape.n2(x / 220, z / 220 + 50);
                const openness = this.shape.n2(x / 320 - 80, z / 320 + 20);

                // Regional land height. Where this runs low the netherrack
                // surface drops under y=31 and the lava sea is exposed as an
                // open ocean; where it runs high you get netherrack plains and
                // plateaus well above the lava. Vanilla's nether reads as
                // both, and the old generator had neither.
                const landLift = this.shape.n2(x / 300 + 700, z / 300 - 400);
                const shoreTop = 44 + landLift * 46;

                // Vertical netherrack pillars and wall buttresses: a 2D field
                // that is only occasionally strong enough to reach across the
                // open band, so they stand out as features.
                const pillar = Math.max(0, this.patch.n2(x / 40 + 300, z / 40 - 120) - 0.17) * 6.0;

                for (let gy = 0; gy <= 16; gy++) {
                    const y = gy * 8;

                    // Base openness of the playable band. Negative = air.
                    let bias = -0.10 - openness * 0.45;

                    // Solid netherrack bed under the lava sea (surface y=31)
                    // rising into shores, hills and plateaus. The two terms
                    // are additive so the profile falls off smoothly instead
                    // of stepping between branches.
                    const deep = Math.max(0, (24 - y) / 24);
                    const shore = Math.max(0, (shoreTop - y) / 26);
                    bias += Math.pow(deep, 0.85) * (1.60 + floor * 1.40);
                    bias += Math.pow(shore, 2.0) * (0.85 + floor * 1.00);

                    // Ceiling: broad hanging overhangs, fully solid by the
                    // bedrock cap.
                    const underside = Math.max(0, (y - 84) / 26);
                    const cap = Math.max(0, (y - 108) / 20);
                    bias += Math.pow(underside, 1.6) * (0.80 + roof * 1.50);
                    bias += Math.pow(cap, 1.0) * (2.00 + roof * 1.20);

                    // Netherrack pillars and buttresses spanning the open
                    // middle band, so it reads as a cathedral rather than an
                    // empty box.
                    if (y > 30 && y < 106) {
                        const t = (y - 30) / 76;
                        bias += pillar * (0.45 + 0.55 * Math.sin(Math.PI * t));
                    }

                    // Large-scale shape first, one octave of medium detail for
                    // broken edges and hanging netherrack. Note the long
                    // vertical periods (y/110, y/40).
                    L[gx + gz * 5 + gy * 25] =
                        this.dens.n3(x / 140, y / 110, z / 140) * 3.6 +
                        this.dens.n3(x / 52 + 30, y / 40, z / 52) * 1.05 +
                        this.dens.n3(x / 21 + 90, y / 26, z / 21) * 0.30 +
                        bias;
                }
            }
        }
        return L;
    }

    newChunk(world, chunkX, chunkZ) {
        const chunk = new Chunk(world, chunkX, chunkZ);
        const blocks = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT);
        const data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT);
        const L = this.lattice(chunkX, chunkZ);
        const r = mulberry(chunkSeed(this.seed32, chunkX, chunkZ, 3));
        const originX = chunkX * 16;
        const originZ = chunkZ * 16;

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const gx = x >> 2;
                const gz = z >> 2;
                const fx = (x & 3) / 4;
                const fz = (z & 3) / 4;
                const soul = this.patch.n2((originX + x) / 24, (originZ + z) / 24) > 0.18;
                const gravel = this.patch.n2((originX + x) / 20 + 99, (originZ + z) / 20) > 0.25;

                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    const gy = y >> 3;
                    const fy = (y & 7) / 8;
                    const a = gx + gz * 5 + gy * 25;
                    const c0 = lerp(lerp(L[a], L[a + 1], fx), lerp(L[a + 5], L[a + 6], fx), fz);
                    const c1 = lerp(lerp(L[a + 25], L[a + 26], fx), lerp(L[a + 30], L[a + 31], fx), fz);
                    const density = lerp(c0, c1, fy);
                    const i = idx(x, y, z);

                    if (y === 0 || y === WORLD_HEIGHT - 1 ||
                        (y < 5 && r() * 5 > y) ||
                        (y > WORLD_HEIGHT - 6 && r() * 5 > WORLD_HEIGHT - 1 - y)) {
                        blocks[i] = BEDROCK;
                    } else if (density > 0) {
                        blocks[i] = NETHERRACK;
                    } else if (y <= LAVA_Y) {
                        blocks[i] = LAVA;
                    }
                }

                // Surface layers near the lava sea: soul-sand or gravel shores.
                if (soul || gravel) {
                    for (let y = LAVA_Y + 6; y > LAVA_Y - 6; y--) {
                        const i = idx(x, y, z);
                        if (blocks[i] === NETHERRACK && !blocks[i + 256]) {
                            for (let k = 0; k < 3 && y - k > 4; k++) {
                                const below = i - k * 256;
                                if (blocks[below] === NETHERRACK) blocks[below] = soul ? SOUL_SAND : GRAVEL;
                            }
                        }
                    }
                }
            }
        }

        this.decorate(r, blocks, data);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
            for (let z = 0; z < 16; z++) {
                for (let x = 0; x < 16; x++) {
                    const i = idx(x, y, z);
                    const id = blocks[i];
                    if (id) chunk.setBlockId(x, y, z, id, data[i]);
                }
            }
        }

        chunk.generateSkylightMap();
        chunk.generateBlockLightMap();
        return chunk;
    }

    decorate(r, blocks, meta) {
        const get = (x, y, z) => blocks[idx(x, y, z)];
        const set = (x, y, z, id, data = 0) => {
            const i = idx(x, y, z);
            blocks[i] = id;
            meta[i] = data;
        };
        const ri = n => (r() * n) | 0;

        // Glowstone clusters hanging from the ceiling.
        for (let n = ri(ri(10) + 1) + 1; n > 0; n--) {
            const x = 3 + ri(10);
            const z = 3 + ri(10);
            let y = 120;
            while (y > 40 && !(get(x, y, z) === NETHERRACK && get(x, y - 1, z) === AIR)) y--;
            if (y <= 40) continue;
            set(x, y - 1, z, GLOWSTONE);

            for (let k = 0; k < 900; k++) {
                const px = x + ri(6) - ri(6);
                const py = y - 1 - ri(10);
                const pz = z + ri(6) - ri(6);
                if (px < 0 || pz < 0 || px > 15 || pz > 15 || py < 2 || get(px, py, pz)) continue;
                let c = 0;
                for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
                    const qx = px + dx;
                    const qz = pz + dz;
                    if (qx >= 0 && qz >= 0 && qx < 16 && qz < 16 && get(qx, py + dy, qz) === GLOWSTONE) c++;
                }
                if (c === 1) set(px, py, pz, GLOWSTONE);
            }
        }

        // Lava springs in walls.
        for (let n = 0; n < 8; n++) {
            const x = 1 + ri(14);
            const y = 10 + ri(108);
            const z = 1 + ri(14);
            if (get(x, y, z) !== NETHERRACK) continue;
            let air = 0, rock = 0;
            for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]]) {
                const b = get(x + dx, y + dy, z + dz);
                if (b === AIR) air++;
                else if (b === NETHERRACK) rock++;
            }
            if (air === 1 && rock === 4) set(x, y, z, LAVA);
        }

        // Fire patches on netherrack.
        for (let n = ri(ri(10) + 1) + 1; n > 0; n--) {
            const x = ri(16);
            const z = ri(16);
            const y = 4 + ri(120);
            if (get(x, y, z) === AIR && get(x, y - 1, z) === NETHERRACK) set(x, y, z, FIRE);
        }

        // This build does not have a registered nether-wart crop block, so the
        // source generator's rare wart gardens are intentionally omitted.

        // Mushrooms on netherrack, using this project's local mushroom IDs.
        for (const id of [RED_MUSHROOM, BROWN_MUSHROOM]) {
            if (ri(2) === 0) {
                const x = ri(16);
                const z = ri(16);
                const y = ri(128);
                if (y > 1 && y < 127 && get(x, y, z) === AIR && get(x, y - 1, z) === NETHERRACK) set(x, y, z, id);
            }
        }
    }

    // Decoration is performed during newChunk(), matching the source generator.
    populateChunk(chunkX, chunkZ) {}
}
