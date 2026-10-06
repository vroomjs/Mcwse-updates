import Block from "./block/Block.js";
import EnumSkyBlock from "../../util/EnumSkyBlock.js";

const SKY = EnumSkyBlock.SKY;
const BLOCK = EnumSkyBlock.BLOCK;

const MAX_Y = 127;

// Neighbor offsets. Index 3 is "down" (important for sky light, which falls
// straight down through transparent blocks without losing strength).
const DX = [1, -1, 0, 0, 0, 0];
const DY = [0, 0, 1, -1, 0, 0];
const DZ = [0, 0, 0, 0, 1, -1];
const DOWN = 3;

// Packing for pending-cell dedupe keys (x/z within +-2M blocks, y 0..127)
const OFF = 2097152;      // 2^21
const SPAN = 4194304;     // 2^22

/**
 * Growable flat int queue storing 4 ints per entry (x, y, z, value).
 */
class IntQueue {
    constructor(capacity = 4096) {
        this.a = new Int32Array(capacity * 4);
        this.head = 0;
        this.tail = 0;
    }

    push(x, y, z, v) {
        if (this.tail + 4 > this.a.length) this._grow();
        const a = this.a;
        const t = this.tail;
        a[t] = x;
        a[t + 1] = y;
        a[t + 2] = z;
        a[t + 3] = v;
        this.tail = t + 4;
    }

    _grow() {
        if (this.head > 0 && this.head >= this.a.length >> 1) {
            // Compact consumed entries instead of growing
            this.a.copyWithin(0, this.head, this.tail);
            this.tail -= this.head;
            this.head = 0;
            return;
        }
        const n = new Int32Array(this.a.length * 2);
        n.set(this.a.subarray(0, this.tail));
        this.a = n;
    }

    get empty() {
        return this.head >= this.tail;
    }

    reset() {
        this.head = 0;
        this.tail = 0;
    }
}

/**
 * Flood-fill (BFS) light engine.
 *
 * Replaces the old region-queue solver, which re-scanned whole 16x128x16
 * volumes per chunk, allocated a task object + string key for every single
 * changed cell and spread its work over hundreds of frames (causing every
 * affected chunk section to be re-meshed again and again while light slowly
 * converged). This engine computes exact results in one pass over only the
 * cells whose light actually changes.
 */
export default class LightEngine {

    constructor(world) {
        this.world = world;

        this.addQueue = new IntQueue(8192);
        this.removeQueue = new IntQueue(4096);
        this.seedQueue = new IntQueue(1024);
        this.cellList = new IntQueue(1024);

        this.pendingCells = [new Set(), new Set()];
        this.pendingBoxes = [];

        this.touched = [];
        this.jobId = 1;

        this._cx = 0; this._cz = 0; this._c = null; this._cValid = false;
        this._ncx = 0; this._ncz = 0; this._nc = null; this._ncValid = false;

        this.opacity = new Uint8Array(65536);
        this.blocksSky = new Uint8Array(65536);
        this.mayEmit = new Uint8Array(65536);
        this._tableBlockCount = -1;
        this._tableLeaves = null;
    }

    // ------------------------------------------------------------------
    // Block property tables
    // ------------------------------------------------------------------

    _ensureTables() {
        const settings = (typeof window !== "undefined" && window.app && window.app.settings) || null;
        const leaves = settings ? !!settings.optimizedLeaves : false;
        const count = Block.blocks.length;
        if (count === this._tableBlockCount && leaves === this._tableLeaves) return;
        this._tableBlockCount = count;
        this._tableLeaves = leaves;

        this.opacity.fill(0);
        this.blocksSky.fill(0);
        this.mayEmit.fill(0);

        const baseGetLight = Block.prototype.getLightValue;
        Block.blocks.forEach((block, id) => {
            if (!block || id === 0 || id >= 65536) return;
            let o = 1;
            try { o = block.getOpacity(); } catch (e) { o = 1; }
            if (!(o >= 0)) o = 0;
            this.blocksSky[id] = o > 0 ? 1 : 0;
            this.opacity[id] = Math.max(0, Math.min(15, Math.round(o * 15)));
            if (block.lightValue > 0 || block.getLightValue !== baseGetLight) {
                this.mayEmit[id] = 1;
            }
        });
    }

    // ------------------------------------------------------------------
    // Chunk access
    // ------------------------------------------------------------------

    _resetCache() {
        this._cValid = false;
        this._ncValid = false;
        this._c = null;
        this._nc = null;
    }

    _chunk(cx, cz) {
        if (this._cValid && cx === this._cx && cz === this._cz) return this._c;
        const c = this.world.chunks.get(cx + "," + cz);
        this._cx = cx; this._cz = cz; this._cValid = true;
        this._c = (c && c.lightReady) ? c : null;
        return this._c;
    }

    _nchunk(cx, cz) {
        if (this._ncValid && cx === this._ncx && cz === this._ncz) return this._nc;
        const c = this.world.chunks.get(cx + "," + cz);
        this._ncx = cx; this._ncz = cz; this._ncValid = true;
        this._nc = (c && c.lightReady) ? c : null;
        return this._nc;
    }

    // ------------------------------------------------------------------
    // Dirty tracking (re-mesh only sections whose light actually changed)
    // ------------------------------------------------------------------

    _touch(section, lx, ly, lz) {
        if (section._lightJob !== this.jobId) {
            section._lightJob = this.jobId;
            section._lightBorder = 0;
            this.touched.push(section);
        }
        let b = 0;
        if (lx === 0) b |= 1; else if (lx === 15) b |= 2;
        if (lz === 0) b |= 4; else if (lz === 15) b |= 8;
        if (ly === 0) b |= 16; else if (ly === 15) b |= 32;
        if (b) section._lightBorder |= b;
    }

    _markSection(cx, sy, cz) {
        if (sy < 0 || sy > 15) return;
        const c = this.world.chunks.get(cx + "," + cz);
        if (c) c.sections[sy].isModified = true;
    }

    _beginJob() {
        this.jobId++;
        this._resetCache();
        this._ensureTables();
    }

    _endJob() {
        const touched = this.touched;
        for (let i = 0; i < touched.length; i++) {
            const s = touched[i];
            s.isModified = true;
            const b = s._lightBorder;
            if (b) {
                if (b & 1) this._markSection(s.x - 1, s.y, s.z);
                if (b & 2) this._markSection(s.x + 1, s.y, s.z);
                if (b & 4) this._markSection(s.x, s.y, s.z - 1);
                if (b & 8) this._markSection(s.x, s.y, s.z + 1);
                if ((b & 16) && s.y > 0) s.chunk.sections[s.y - 1].isModified = true;
                if ((b & 32) && s.y < 15) s.chunk.sections[s.y + 1].isModified = true;
            }
            s._lightBorder = 0;
        }
        touched.length = 0;
        this._resetCache();
    }

    // ------------------------------------------------------------------
    // Sources
    // ------------------------------------------------------------------

    _source(type, chunk, section, idx, x, y, z) {
        if (type === SKY) {
            if (this.world.dimension === -1) return 0;
            return y >= chunk.heightMap[((z & 15) << 4) | (x & 15)] ? 15 : 0;
        }
        const id = section.blocks[idx];
        if (id === 0 || !this.mayEmit[id]) return 0;
        const block = Block.blocks[id];
        if (!block) return 0;
        let v = 0;
        try { v = block.getLightValue(this.world, x, y, z) | 0; } catch (e) { v = 0; }
        return v < 0 ? 0 : (v > 15 ? 15 : v);
    }

    // ------------------------------------------------------------------
    // BFS core
    // ------------------------------------------------------------------

    _flood(type) {
        const q = this.addQueue;
        const sky = type === SKY;
        const opac = this.opacity;

        while (q.head < q.tail) {
            const a = q.a;
            const i = q.head;
            q.head = i + 4;
            const x = a[i], y = a[i + 1], z = a[i + 2];

            const cx = x >> 4, cz = z >> 4;
            const c = this._chunk(cx, cz);
            if (!c) continue;
            const s = c.sections[y >> 4];
            const L = (sky ? s.skyLight : s.blockLight)[((y & 15) << 8) | ((z & 15) << 4) | (x & 15)];
            if (L <= 1) continue;

            for (let d = 0; d < 6; d++) {
                const ny = y + DY[d];
                if (ny < 0 || ny > MAX_Y) continue;
                const nx = x + DX[d];
                const nz = z + DZ[d];
                const ncx = nx >> 4, ncz = nz >> 4;
                let nc = c;
                if (ncx !== cx || ncz !== cz) {
                    nc = this._nchunk(ncx, ncz);
                    if (!nc) continue;
                }
                const ns = nc.sections[ny >> 4];
                const nidx = ((ny & 15) << 8) | ((nz & 15) << 4) | (nx & 15);
                const op = opac[ns.blocks[nidx]];
                let v;
                if (sky && d === DOWN && L === 15 && op === 0) v = 15;
                else v = L - (op > 1 ? op : 1);
                if (v <= 0) continue;
                const narr = sky ? ns.skyLight : ns.blockLight;
                if (narr[nidx] >= v) continue;
                narr[nidx] = v;
                this._touch(ns, nx & 15, ny & 15, nz & 15);
                q.push(nx, ny, nz, 0);
            }
        }
        q.reset();
    }

    _unflood(type) {
        const q = this.removeQueue;
        const add = this.addQueue;
        const seeds = this.seedQueue;
        const sky = type === SKY;

        while (q.head < q.tail) {
            const a = q.a;
            const i = q.head;
            q.head = i + 4;
            const x = a[i], y = a[i + 1], z = a[i + 2], old = a[i + 3];
            const cx = x >> 4, cz = z >> 4;

            for (let d = 0; d < 6; d++) {
                const ny = y + DY[d];
                if (ny < 0 || ny > MAX_Y) continue;
                const nx = x + DX[d];
                const nz = z + DZ[d];
                const ncx = nx >> 4, ncz = nz >> 4;
                const nc = (ncx === cx && ncz === cz) ? this._chunk(cx, cz) : this._nchunk(ncx, ncz);
                if (!nc) continue;
                const ns = nc.sections[ny >> 4];
                const nidx = ((ny & 15) << 8) | ((nz & 15) << 4) | (nx & 15);
                const narr = sky ? ns.skyLight : ns.blockLight;
                const cv = narr[nidx];
                if (cv === 0) continue;

                if (cv < old || (sky && d === DOWN && old === 15 && cv === 15)) {
                    narr[nidx] = 0;
                    this._touch(ns, nx & 15, ny & 15, nz & 15);
                    q.push(nx, ny, nz, cv);
                    const src = this._source(type, nc, ns, nidx, nx, ny, nz);
                    if (src > 0) seeds.push(nx, ny, nz, src);
                } else {
                    add.push(nx, ny, nz, 0);
                }
            }
        }
        q.reset();
    }

    _applySeeds(type) {
        const seeds = this.seedQueue;
        const add = this.addQueue;
        const sky = type === SKY;
        const a = seeds.a;
        for (let i = seeds.head; i < seeds.tail; i += 4) {
            const x = a[i], y = a[i + 1], z = a[i + 2], v = a[i + 3];
            const c = this._chunk(x >> 4, z >> 4);
            if (!c) continue;
            const s = c.sections[y >> 4];
            const idx = ((y & 15) << 8) | ((z & 15) << 4) | (x & 15);
            const arr = sky ? s.skyLight : s.blockLight;
            if (arr[idx] < v) {
                arr[idx] = v;
                this._touch(s, x & 15, y & 15, z & 15);
            }
            add.push(x, y, z, 0);
        }
        seeds.reset();
    }

    /**
     * Recompute light for an arbitrary list of cells (flat x,y,z,_ quads).
     */
    _relightCells(type, list) {
        if (type === SKY && this.world.dimension === -1) return;
        const sky = type === SKY;
        const rem = this.removeQueue;
        const add = this.addQueue;
        const seeds = this.seedQueue;
        const a = list.a;

        // 1. Clear the cells and remember what they used to emit
        for (let i = list.head; i < list.tail; i += 4) {
            const x = a[i], y = a[i + 1], z = a[i + 2];
            if (y < 0 || y > MAX_Y) continue;
            const c = this._chunk(x >> 4, z >> 4);
            if (!c) continue;
            const s = c.sections[y >> 4];
            const idx = ((y & 15) << 8) | ((z & 15) << 4) | (x & 15);
            const arr = sky ? s.skyLight : s.blockLight;
            const old = arr[idx];
            if (old > 0) {
                arr[idx] = 0;
                this._touch(s, x & 15, y & 15, z & 15);
                rem.push(x, y, z, old);
            }
            const src = this._source(type, c, s, idx, x, y, z);
            if (src > 0) seeds.push(x, y, z, src);
        }

        // 2. Remove all light that depended on the cleared cells
        this._unflood(type);

        // 3. Let surrounding light flow back into the cleared cells
        for (let i = list.head; i < list.tail; i += 4) {
            const x = a[i], y = a[i + 1], z = a[i + 2];
            if (y < 0 || y > MAX_Y) continue;
            for (let d = 0; d < 6; d++) {
                const ny = y + DY[d];
                if (ny < 0 || ny > MAX_Y) continue;
                const nx = x + DX[d], nz = z + DZ[d];
                const c = this._nchunk(nx >> 4, nz >> 4);
                if (!c) continue;
                const s = c.sections[ny >> 4];
                const v = (sky ? s.skyLight : s.blockLight)[((ny & 15) << 8) | ((nz & 15) << 4) | (nx & 15)];
                if (v > 1) add.push(nx, ny, nz, 0);
            }
        }

        // 4. Re-emit sources, then flood
        this._applySeeds(type);
        this._flood(type);
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    /**
     * Compute complete light for a freshly generated / loaded chunk and
     * exchange light with already-lit neighbors. Runs synchronously; this is
     * cheap (typically ~1ms) and guarantees a chunk is never meshed with
     * half-finished light.
     */
    initChunk(chunk) {
        this._beginJob();
        chunk.lightReady = true;

        const world = this.world;
        const nether = world.dimension === -1;
        const sections = chunk.sections;
        const heightMap = chunk.heightMap;
        const blocksSky = this.blocksSky;
        const opac = this.opacity;
        const baseX = chunk.x << 4;
        const baseZ = chunk.z << 4;

        for (let i = 0; i < sections.length; i++) {
            sections[i].blockLight.fill(0);
            sections[i].skyLight.fill(0);
        }

        // Height map + direct sky light
        for (let z = 0; z < 16; z++) {
            for (let x = 0; x < 16; x++) {
                const col = (z << 4) | x;
                let h = 0;
                if (nether) {
                    h = 127;
                } else {
                    for (let y = MAX_Y; y >= 0; y--) {
                        const s = sections[y >> 4];
                        if (s.empty) { y &= ~15; continue; }
                        if (blocksSky[s.blocks[((y & 15) << 8) | col]]) { h = y + 1; break; }
                    }
                    for (let y = h; y <= MAX_Y; y++) {
                        sections[y >> 4].skyLight[((y & 15) << 8) | col] = 15;
                    }
                }
                heightMap[col] = h;
            }
        }

        const add = this.addQueue;

        // ---- Sky ----
        if (!nether) {
            const nE = this._nchunk(chunk.x + 1, chunk.z);
            const nW = this._nchunk(chunk.x - 1, chunk.z);
            const nS = this._nchunk(chunk.x, chunk.z + 1);
            const nN = this._nchunk(chunk.x, chunk.z - 1);
            this._ncValid = false;

            for (let z = 0; z < 16; z++) {
                for (let x = 0; x < 16; x++) {
                    const h = heightMap[(z << 4) | x];
                    let maxN = h;
                    let hn;
                    hn = x < 15 ? heightMap[(z << 4) | (x + 1)] : (nE ? nE.heightMap[z << 4] : h); if (hn > maxN) maxN = hn;
                    hn = x > 0 ? heightMap[(z << 4) | (x - 1)] : (nW ? nW.heightMap[(z << 4) | 15] : h); if (hn > maxN) maxN = hn;
                    hn = z < 15 ? heightMap[((z + 1) << 4) | x] : (nS ? nS.heightMap[x] : h); if (hn > maxN) maxN = hn;
                    hn = z > 0 ? heightMap[((z - 1) << 4) | x] : (nN ? nN.heightMap[(15 << 4) | x] : h); if (hn > maxN) maxN = hn;
                    if (maxN > MAX_Y + 1) maxN = MAX_Y + 1;

                    let startY = h;
                    // Light falls into a translucent top block (water, leaves)
                    if (h > 0 && h <= MAX_Y) {
                        const s = sections[(h - 1) >> 4];
                        const topOp = opac[s.blocks[(((h - 1) & 15) << 8) | (z << 4) | x]];
                        if (topOp < 15 && maxN <= h) {
                            add.push(baseX + x, h, baseZ + z, 0);
                        }
                    }
                    for (let y = startY; y < maxN; y++) {
                        add.push(baseX + x, y, baseZ + z, 0);
                    }
                }
            }

            this._pushNeighborBorder(nE, 0, SKY, chunk, 1, 0);
            this._pushNeighborBorder(nW, 15, SKY, chunk, -1, 0);
            this._pushNeighborBorder(nS, 0, SKY, chunk, 0, 1);
            this._pushNeighborBorder(nN, 15, SKY, chunk, 0, -1);

            this._flood(SKY);
        }

        // ---- Block light ----
        const mayEmit = this.mayEmit;
        for (let sy = 0; sy < 8; sy++) {
            const s = sections[sy];
            if (s.empty) continue;
            const blocks = s.blocks;
            const bl = s.blockLight;
            for (let idx = 0; idx < 4096; idx++) {
                const id = blocks[idx];
                if (id === 0 || !mayEmit[id]) continue;
                const x = baseX + (idx & 15);
                const z = baseZ + ((idx >> 4) & 15);
                const y = (sy << 4) + (idx >> 8);
                const v = this._source(BLOCK, chunk, s, idx, x, y, z);
                if (v > 0) {
                    bl[idx] = v;
                    add.push(x, y, z, 0);
                }
            }
        }
        {
            const nE = this._nchunk(chunk.x + 1, chunk.z);
            const nW = this._nchunk(chunk.x - 1, chunk.z);
            const nS = this._nchunk(chunk.x, chunk.z + 1);
            const nN = this._nchunk(chunk.x, chunk.z - 1);
            this._ncValid = false;
            this._pushNeighborBorder(nE, 0, BLOCK, chunk, 1, 0);
            this._pushNeighborBorder(nW, 15, BLOCK, chunk, -1, 0);
            this._pushNeighborBorder(nS, 0, BLOCK, chunk, 0, 1);
            this._pushNeighborBorder(nN, 15, BLOCK, chunk, 0, -1);
        }
        this._flood(BLOCK);

        this._endJob();
        chunk.setModifiedAllSections();
    }

    /**
     * Queue the neighbor's border column cells (facing the new chunk) so their
     * light flows into it.
     */
    _pushNeighborBorder(n, edge, type, chunk, dx, dz) {
        if (!n) return;
        const add = this.addQueue;
        const sky = type === SKY;
        const nbx = n.x << 4, nbz = n.z << 4;
        for (let i = 0; i < 16; i++) {
            const lx = dx !== 0 ? edge : i;
            const lz = dz !== 0 ? edge : i;
            for (let sy = 0; sy < 8; sy++) {
                const s = n.sections[sy];
                const arr = sky ? s.skyLight : s.blockLight;
                for (let ly = 0; ly < 16; ly++) {
                    if (arr[(ly << 8) | (lz << 4) | lx] > 1) {
                        add.push(nbx + lx, (sy << 4) + ly, nbz + lz, 0);
                    }
                }
            }
        }
    }

    /**
     * Schedule light recomputation for a box. Processed by flush().
     */
    queueRegion(type, x1, y1, z1, x2, y2, z2) {
        if (type !== SKY && type !== BLOCK) return;
        if (type === SKY && this.world.dimension === -1) return;
        let minX = Math.floor(Math.min(x1, x2)), maxX = Math.floor(Math.max(x1, x2));
        let minY = Math.floor(Math.min(y1, y2)), maxY = Math.floor(Math.max(y1, y2));
        let minZ = Math.floor(Math.min(z1, z2)), maxZ = Math.floor(Math.max(z1, z2));
        if (minY < 0) minY = 0;
        if (maxY > MAX_Y) maxY = MAX_Y;
        if (maxY < minY) return;
        if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minZ) || !isFinite(maxZ)) return;

        const volume = (maxX - minX + 1) * (maxY - minY + 1) * (maxZ - minZ + 1);
        if (volume <= 256) {
            const set = this.pendingCells[type];
            for (let x = minX; x <= maxX; x++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const base = ((x + OFF) * SPAN + (z + OFF)) * 128;
                    for (let y = minY; y <= maxY; y++) set.add(base + y);
                }
            }
        } else {
            this.pendingBoxes.push({ type, minX, minY, minZ, maxX, maxY, maxZ });
        }
    }

    hasPending() {
        return this.pendingCells[0].size > 0 || this.pendingCells[1].size > 0 || this.pendingBoxes.length > 0;
    }

    get pendingCount() {
        return this.pendingCells[0].size + this.pendingCells[1].size + this.pendingBoxes.length;
    }

    /**
     * Apply all queued light changes. Called once per frame before meshing,
     * so edited sections are re-meshed with final light exactly once.
     */
    flush() {
        if (!this.hasPending()) return;
        const boxes = this.pendingBoxes;
        this.pendingBoxes = [];

        for (let type = 0; type < 2; type++) {
            const set = this.pendingCells[type];
            let hasBox = false;
            for (let i = 0; i < boxes.length; i++) if (boxes[i].type === type) { hasBox = true; break; }
            if (set.size === 0 && !hasBox) continue;

            this._beginJob();
            const list = this.cellList;
            list.reset();
            for (const key of set) {
                const y = key % 128;
                const rest = (key - y) / 128;
                const zz = rest % SPAN;
                const xx = (rest - zz) / SPAN;
                list.push(xx - OFF, y, zz - OFF, 0);
            }
            set.clear();
            for (let i = 0; i < boxes.length; i++) {
                const b = boxes[i];
                if (b.type !== type) continue;
                for (let x = b.minX; x <= b.maxX; x++) {
                    for (let z = b.minZ; z <= b.maxZ; z++) {
                        for (let y = b.minY; y <= b.maxY; y++) list.push(x, y, z, 0);
                    }
                }
            }
            this._relightCells(type, list);
            list.reset();
            this._endJob();
        }
    }

    /**
     * Drop pending work that belongs to a chunk being unloaded.
     */
    clear() {
        this.pendingCells[0].clear();
        this.pendingCells[1].clear();
        this.pendingBoxes = [];
        this.addQueue.reset();
        this.removeQueue.reset();
        this.seedQueue.reset();
        this.cellList.reset();
        this._resetCache();
    }
}
