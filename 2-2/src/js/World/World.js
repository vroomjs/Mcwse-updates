// ... existing code ...

// Handle fluid interactions (Obsidian, Cobblestone, Stone)
checkFluidInteractions(x, y, z, type, level) {
    // Safe access to BLOCK constants or fallbacks
    const B_WATER = (typeof BLOCK !== 'undefined' && BLOCK.WATER) ? BLOCK.WATER : 9;
    const B_LAVA = (typeof BLOCK !== 'undefined' && BLOCK.LAVA) ? BLOCK.LAVA : 11;
    const B_OBSIDIAN = (typeof BLOCK !== 'undefined' && BLOCK.OBSIDIAN) ? BLOCK.OBSIDIAN : 49;
    const B_COBBLE = (typeof BLOCK !== 'undefined' && BLOCK.COBBLESTONE) ? BLOCK.COBBLESTONE : 4;
    const B_STONE = (typeof BLOCK !== 'undefined' && BLOCK.STONE) ? BLOCK.STONE : 1;

    // Assume level 8 is source (max level)
    const isSource = (lvl) => lvl === 8; 
    const isFlowing = (lvl) => lvl < 8;

    const myIsWater = type === B_WATER;
    const myIsLava = type === B_LAVA;

    if (!myIsWater && !myIsLava) return false;
    if (!isFlowing(level)) return false; // Only flowing blocks trigger interaction when moving

    const neighbors = [
        {x: x+1, y: y, z: z}, {x: x-1, y: y, z: z},
        {x: x, y: y, z: z+1}, {x: x, y: y, z: z-1}
    ];

    for (let n of neighbors) {
        const nType = this.getBlock(n.x, n.y, n.z);
        if (nType === 0) continue;

        const nLevel = this.getLiquidLevel(n.x, n.y, n.z);
        const nIsSource = isSource(nLevel);

        if (myIsWater) {
            // Rule 1: Flowing Water touches Source Lava -> Obsidian
            if (nType === B_LAVA && nIsSource) {
                this.setBlock(n.x, n.y, n.z, B_OBSIDIAN);
                return true;
            }
            // Rule 3: Flowing Water touches Flowing Lava -> Stone (Neighbor Lava becomes Stone)
            if (nType === B_LAVA && !nIsSource) {
                this.setBlock(n.x, n.y, n.z, B_STONE);
                return true;
            }
        } else if (myIsLava) {
            // Rule 2: Flowing Lava touches Source Water -> Cobblestone
            if (nType === B_WATER && nIsSource) {
                this.setBlock(n.x, n.y, n.z, B_COBBLE);
                return true;
            }
            // Rule 3: Flowing Lava touches Flowing Water -> Stone (I become Stone)
            if (nType === B_WATER && !nIsSource) {
                this.setBlock(x, y, z, B_STONE);
                return true;
            }
        }
    }
    return false;
}

updateLiquid(x, y, z) {
    const type = this.getBlock(x, y, z);
    const level = this.getLiquidLevel(x, y, z);

    if (this.checkFluidInteractions(x, y, z, type, level)) return;

// ... existing code ...