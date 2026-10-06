import { BlockRegistry } from "./src/js/net/minecraft/client/world/block/BlockRegistry.js";
import EntityVillager from "./src/js/net/minecraft/client/entity/passive/EntityVillager.js";
import EntityIronGolem from "./src/js/net/minecraft/client/entity/passive/EntityIronGolem.js";
import EntityCat from "./src/js/net/minecraft/client/entity/passive/EntityCat.js";

export function buildDungeon(world, x, y, z) {
    const COBBLE = BlockRegistry.COBBLESTONE.getId();
    const MOSSY = BlockRegistry.MOSSY_COBBLESTONE.getId();
    const SPAWNER = BlockRegistry.MOB_SPAWNER.getId();
    const CHEST = BlockRegistry.CHEST.getId();

    // Dungeon 9x7x9 structure from dungeon.json
    for (let dx = 0; dx < 9; dx++) {
        for (let dy = 0; dy < 7; dy++) {
            for (let dz = 0; dz < 9; dz++) {
                const wx = x + dx;
                const wy = y + dy;
                const wz = z + dz;

                // 1. Air Interior
                if (dx > 0 && dx < 8 && dy > 0 && dy < 6 && dz > 0 && dz < 8) {
                    // But don't clear the spawner and chest spots later
                    world.setBlockAt(wx, wy, wz, 0, 0, true);
                    continue;
                }

                // 2. Walls, Floor, Ceiling (Outer shell)
                if (dx === 0 || dx === 8 || dy === 0 || dy === 6 || dz === 0 || dz === 8) {
                    // Mix of Cobble and Mossy Cobble (matching dungeon.json style)
                    const block = Math.random() < 0.2 ? MOSSY : COBBLE;
                    world.setBlockAt(wx, wy, wz, block, 0, true);
                }
            }
        }
    }

    // 3. Specific placements from dungeon.json
    // Spawner at 4,1,4
    world.setBlockAt(x + 4, y + 1, z + 4, SPAWNER);
    world.setTileEntity(x + 4, y + 1, z + 4, {
        mobType: "EntityZombie",
        timer: 10,
        spawnedIds: []
    });

    // Chest at 1,1,4 (meta 3 = facing West?)
    world.setBlockAt(x + 1, y + 1, z + 4, CHEST, 3);
    fillVillageChest(world, x + 1, y + 1, z + 4);

    // Chest at 4,1,7 (meta 2 = facing North?)
    world.setBlockAt(x + 4, y + 1, z + 7, CHEST, 2);
    fillVillageChest(world, x + 4, y + 1, z + 7);
}

export function buildVillage(world, centerX, centerY, centerZ) {
    const isVoid = world._gameType === 'oneblock' || world.getBlockAt(centerX, centerY - 1, centerZ) === 0;

    // Spawn 1 Well at center
    buildVillageWell(world, centerX, centerY, centerZ);
    
    // In void worlds, build a small starting platform around the well
    if (isVoid) {
        const PLATFORM = BlockRegistry.COBBLESTONE.getId();
        for (let dx = -3; dx <= 6; dx++) {
            for (let dz = -3; dz <= 6; dz++) {
                if (world.getBlockAt(centerX + dx, centerY - 1, centerZ + dz) === 0) {
                    world.setBlockAt(centerX + dx, centerY - 1, centerZ + dz, PLATFORM);
                }
            }
        }
    }

    // Keep track of occupied positions to avoid overlap
    // {x, z, radius}
    let occupied = [{x: centerX, z: centerZ, r: 4}]; // Reduced radius for well base

    // NEW: Spawn 2 Random Farms
    const farmTypes = ["wheat", "carrot", "potato", "beetroot"];
    for (let i = 0; i < 2; i++) {
        let attempts = 0;
        while(attempts < 50) {
            attempts++;
            let angle = Math.random() * Math.PI * 2;
            let dist = 8 + Math.random() * 12; // Farms stay closer to center well
            let fx = Math.floor(centerX + Math.cos(angle) * dist);
            let fz = Math.floor(centerZ + Math.sin(angle) * dist);
            
            let collision = false;
            let farmR = 6;
            for (let obs of occupied) {
                let dx = fx - obs.x;
                let dz = fz - obs.z;
                if (Math.sqrt(dx*dx + dz*dz) < (obs.r + farmR + 1)) {
                    collision = true;
                    break;
                }
            }
            if (collision) continue;

            let fy = world.getHeightAt(fx, fz);
            if (fy <= 0) {
                if (isVoid) fy = centerY;
                else continue;
            }
            let surfBlock = world.getBlockAt(fx, fy - 1, fz);
            if (surfBlock === 9 || surfBlock === 0) continue;

            // Align 7x9 area
            buildFarm(world, fx - 3, fy, fz - 4, farmTypes[Math.floor(Math.random() * 4)]);
            occupied.push({x: fx, z: fz, r: farmR});
            break;
        }
    }

    // Spawn 7 Random Houses (Increased from 6 to include Blacksmith chance)
    for (let i = 0; i < 7; i++) {
        let attempts = 0;
        while(attempts < 50) {
            attempts++;
            
            let angle = Math.random() * Math.PI * 2;
            let dist = 10 + Math.random() * 24;
            
            let hx = Math.floor(centerX + Math.cos(angle) * dist);
            let hz = Math.floor(centerZ + Math.sin(angle) * dist);
            
            let collision = false;
            let houseR = 6; 
            
            for (let obs of occupied) {
                let dx = hx - obs.x;
                let dz = hz - obs.z;
                let d = Math.sqrt(dx*dx + dz*dz);
                if (d < (obs.r + houseR + 1)) {
                    collision = true;
                    break;
                }
            }
            
            if (collision) continue;

            // Check for flatness (ensure all 4 corners of a 6x6 area are similar height)
            let h1 = world.getHeightAt(hx - 3, hz - 3);
            let h2 = world.getHeightAt(hx + 3, hz - 3);
            let h3 = world.getHeightAt(hx - 3, hz + 3);
            let h4 = world.getHeightAt(hx + 3, hz + 3);
            let variance = Math.max(h1, h2, h3, h4) - Math.min(h1, h2, h3, h4);
            
            // Stricter flatness check for structures to ensure they go on flattest parts
            if (variance > 2) continue;
            
            let hy = h1;
            if (hy <= 0) hy = centerY; 
            
            let surfBlock = world.getBlockAt(hx, hy - 1, hz);
            if (surfBlock === 9 || surfBlock === 0) continue;

            // In void worlds, create a foundation for the building
            if (isVoid) {
                const COBBLE = BlockRegistry.COBBLESTONE.getId();
                for (let dx = -4; dx <= 4; dx++) {
                    for (let dz = -4; dz <= 4; dz++) {
                        if (world.getBlockAt(hx + dx, hy - 1, hz + dz) === 0) {
                            world.setBlockAt(hx + dx, hy - 1, hz + dz, COBBLE);
                        }
                    }
                }
            }

            // Pick Random House Type
            let r = Math.random();
            if (r < 0.2) buildBlacksmith(world, hx, hy, hz); // Increased to 20% for One Block utility
            else if (r < 0.5) buildVillageHouse1(world, hx, hy, hz);
            else if (r < 0.75) buildVillageHouse2(world, hx, hy, hz);
            else buildVillageHouse3(world, hx, hy, hz);
            
            occupied.push({x: hx, z: hz, r: houseR});
            break; 
        }
    }

    // Spawn Villagers roaming the town (outside houses)
    // Spawn 4-6 villagers in random spots near the center
    const villagerCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < villagerCount; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = 4 + Math.random() * 12; // 4 to 16 blocks from center
        let vx = centerX + Math.cos(angle) * dist;
        let vz = centerZ + Math.sin(angle) * dist;
        
        // Find valid surface
        let vy = world.getHeightAt(Math.floor(vx), Math.floor(vz));
        if (vy > 0) {
            // Check block below is not water or hazardous and air space is clear
            let groundId = world.getBlockAt(Math.floor(vx), vy - 1, Math.floor(vz));
            let isAir = world.getBlockAt(Math.floor(vx), vy, Math.floor(vz)) === 0;
            if (isAir && groundId !== 9 && groundId !== 10 && groundId !== 11 && groundId !== 51) { // Not water/lava/fire
                const villager = new EntityVillager(world.minecraft, world);
                villager.setPosition(vx, vy, vz);
                world.addEntity(villager);
            }
        }
    }

    // Spawn Cats roaming the village
    const catCount = 2 + Math.floor(Math.random() * 3); // 2 to 4 spawn
    for (let i = 0; i < catCount; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = 4 + Math.random() * 10;
        let cx = centerX + Math.cos(angle) * dist;
        let cz = centerZ + Math.sin(angle) * dist;
        let cy = world.getHeightAt(Math.floor(cx), Math.floor(cz));
        if (cy > 0 && world.getBlockAt(Math.floor(cx), cy, Math.floor(cz)) === 0) {
            const cat = new EntityCat(world.minecraft, world);
            // 20% chance for a kitten in a village
            if (Math.random() < 0.2) {
                cat.isChild = true;
                cat.growingAge = -24000;
            }
            cat.setPosition(cx, cy, cz);
            world.addEntity(cat);
        }
    }

    // Spawn 1 Iron Golem to protect the village (Always spawn)
    let angle = Math.random() * Math.PI * 2;
    let dist = 2 + Math.random() * 6;
    let gx = centerX + Math.cos(angle) * dist;
    let gz = centerZ + Math.sin(angle) * dist;
    let gy = world.getHeightAt(Math.floor(gx), Math.floor(gz));
    if (gy > 0) {
        const golem = new EntityIronGolem(world.minecraft, world);
        golem.setPosition(gx, gy, gz);
        world.addEntity(golem);
    }
    
    // Force rebuild once after batch
    if (world.minecraft && world.minecraft.worldRenderer) {
        world.minecraft.worldRenderer.rebuildAll();
    }
}

export function buildVillageHouse1(world, x, y, z) {
    const COBBLE = BlockRegistry.COBBLESTONE.getId();
    const PLANKS = BlockRegistry.WOOD.getId();
    const LOG = BlockRegistry.LOG.getId();
    const GLASS = BlockRegistry.GLASS.getId();
    const DOOR = BlockRegistry.DOOR.getId();
    const TORCH = BlockRegistry.TORCH.getId();
    const STAIRS = BlockRegistry.WOODEN_STAIRS.getId();
    const CHEST = BlockRegistry.CHEST.getId();
    const CRAFTING_TABLE = BlockRegistry.CRAFTING_TABLE.getId();

    // 1. Foundation (5x5 Cobblestone)
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            world.setBlockAt(x + i, y - 1, z + j, COBBLE);
        }
    }

    // 2. Walls & Corners (4 blocks high)
    for (let dy = 0; dy < 4; dy++) {
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                // Outer shell only
                if (i === 0 || i === 4 || j === 0 || j === 4) {
                    let block = PLANKS;
                    
                    // Corners are Logs
                    if ((i === 0 || i === 4) && (j === 0 || j === 4)) {
                        block = LOG;
                    } 
                    // Bottom row of walls is Cobblestone (base)
                    else if (dy === 0) {
                        block = COBBLE;
                    }

                    world.setBlockAt(x + i, y + dy, z + j, block);
                } else {
                    // Air inside
                    world.setBlockAt(x + i, y + dy, z + j, 0);
                }
            }
        }
    }

    // 3. Door (Front side at Z=0, X=2)
    // Clear blocks for door
    world.setBlockAt(x + 2, y, z, DOOR); 
    world.setBlockDataAt(x + 2, y, z, 2); // Bottom half (Face North)
    world.setBlockAt(x + 2, y + 1, z, DOOR); 
    world.setBlockDataAt(x + 2, y + 1, z, 10); // Top half (8 | 2)

    // 4. Windows (Glass Pane/Block)
    // Side windows lowered to Y+1
    world.setBlockAt(x, y + 1, z + 2, GLASS); // Left wall
    world.setBlockAt(x + 4, y + 1, z + 2, GLASS); // Right wall
    world.setBlockAt(x + 2, y + 1, z + 4, GLASS); // Back wall

    // 5. Roof (Stairs gable style along Z axis)
    // Overhang by 1 block (k goes -1 to 5)
    for (let k = -1; k <= 5; k++) {
        // Layer 1 (Y+3)
        world.setBlockAt(x - 1, y + 3, z + k, STAIRS); 
        world.setBlockDataAt(x - 1, y + 3, z + k, 3); // Ascend East
        world.setBlockAt(x + 5, y + 3, z + k, STAIRS); 
        world.setBlockDataAt(x + 5, y + 3, z + k, 1); // Ascend West

        // Layer 2 (Y+4)
        world.setBlockAt(x, y + 4, z + k, STAIRS);
        world.setBlockDataAt(x, y + 4, z + k, 3);
        world.setBlockAt(x + 4, y + 4, z + k, STAIRS);
        world.setBlockDataAt(x + 4, y + 4, z + k, 1);

        // Layer 3 (Y+5)
        world.setBlockAt(x + 1, y + 5, z + k, STAIRS);
        world.setBlockDataAt(x + 1, y + 5, z + k, 3);
        world.setBlockAt(x + 3, y + 5, z + k, STAIRS);
        world.setBlockDataAt(x + 3, y + 5, z + k, 1);

        // Top Ridge (Y+5 center)
        world.setBlockAt(x + 2, y + 5, z + k, PLANKS);

        // Fill gable ends (Walls under roof at Z=0 and Z=4)
        if (k === 0 || k === 4) {
            for (let ix = 1; ix < 4; ix++) {
                world.setBlockAt(x + ix, y + 3, z + k, PLANKS);
            }
            // Fill tip of gable
            world.setBlockAt(x + 1, y + 4, z + k, PLANKS);
            world.setBlockAt(x + 2, y + 4, z + k, PLANKS);
            world.setBlockAt(x + 3, y + 4, z + k, PLANKS);
        }
    }

    // 6. Interior
    // Torch on back wall
    world.setBlockAt(x + 2, y + 2, z + 3, TORCH); 
    world.setBlockDataAt(x + 2, y + 2, z + 3, 4); // South facing (attached to North face of z+4 block)

    // Chest in corner
    world.setBlockAt(x + 3, y, z + 3, CHEST);
    world.setBlockDataAt(x + 3, y, z + 3, 2); // Facing North

    fillVillageChest(world, x + 3, y, z + 3);

    // Crafting Table in corner
    world.setBlockAt(x + 1, y, z + 3, CRAFTING_TABLE);
}

export function buildVillageHouse2(world, x, y, z) {
    const COBBLE = BlockRegistry.COBBLESTONE.getId();
    const PLANKS = BlockRegistry.WOOD.getId();
    const LOG = BlockRegistry.LOG.getId();
    const GLASS = BlockRegistry.GLASS.getId();
    const DOOR = BlockRegistry.DOOR.getId();
    const TORCH = BlockRegistry.TORCH.getId();
    const STAIRS = BlockRegistry.WOODEN_STAIRS.getId();
    const CHEST = BlockRegistry.CHEST.getId();
    const CRAFTING_TABLE = BlockRegistry.CRAFTING_TABLE.getId();
    const FURNACE = BlockRegistry.FURNACE.getId();

    // 1. Foundation & Floor
    // Iterate bounds covering both parts
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 7; j++) {
            let inMain = (i <= 4 && j <= 6);
            let inWing = (i >= 5 && j >= 2 && j <= 6);
            
            if (inMain || inWing) {
                // Foundation
                world.setBlockAt(x + i, y - 1, z + j, COBBLE);
                // Clear air above (just in case)
                for (let dy = 0; dy < 5; dy++) world.setBlockAt(x + i, y + dy, z + j, 0);
            }
        }
    }

    // 2. Walls (Height 4)
    // Draw walls logic
    for (let dy = 0; dy < 4; dy++) {
        // Block type: Bottom row COBBLE, rest PLANKS. Corners LOG.
        let wallBlock = dy === 0 ? COBBLE : PLANKS;
        let cornerBlock = LOG;

        // Main Hall Walls
        for (let i = 0; i <= 4; i++) {
            for (let j = 0; j <= 6; j++) {
                // Edges
                if (i === 0 || i === 4 || j === 0 || j === 6) {
                    // Don't build wall where wing connects (X=4, Z=2..6)
                    if (i === 4 && j >= 2) continue;

                    let isCorner = (i === 0 || i === 4) && (j === 0 || j === 6);
                    world.setBlockAt(x + i, y + dy, z + j, isCorner ? cornerBlock : wallBlock);
                }
            }
        }

        // Wing Walls
        for (let i = 5; i <= 8; i++) {
            for (let j = 2; j <= 6; j++) {
                // Edges
                if (i === 5 || i === 8 || j === 2 || j === 6) {
                    // Don't build wall at connection (X=5 is adjacent to X=4)
                    // BUT we must build the wall at the corners (j=2 and j=6) to close the gap!
                    // Skip i=5 only for interior connection (j=3,4,5)
                    if (i === 5 && (j > 2 && j < 6)) continue; 

                    let isCorner = (i === 8) && (j === 2 || j === 6);
                    world.setBlockAt(x + i, y + dy, z + j, isCorner ? cornerBlock : wallBlock);
                }
            }
        }
        
        // Fix Connection Corner (X=4, Z=2) is a corner for the L
        world.setBlockAt(x + 4, y + dy, z + 2, cornerBlock);
        // Fix Connection Corner (X=4, Z=6) is the back corner for the L
        world.setBlockAt(x + 4, y + dy, z + 6, cornerBlock);
    }

    // 3. Roof (Gable)
    // Main Roof (Z-axis gable)
    // Width 5, Center X=2.
    // Overhangs Z: -1 to 7
    for (let k = -1; k <= 7; k++) {
        // Layer 1 (Y+3)
        world.setBlockAt(x - 1, y + 3, z + k, STAIRS); 
        world.setBlockDataAt(x - 1, y + 3, z + k, 3); // East
        
        // Right overhang (X+5) - Skip if it clips into the Wing (Z 1..7)
        // Wing starts at Z=2, but roof starts Z=1.
        if (k < 1 || k > 7) {
            world.setBlockAt(x + 5, y + 3, z + k, STAIRS); 
            world.setBlockDataAt(x + 5, y + 3, z + k, 1); // West
        }

        // Layer 2 (Y+4)
        world.setBlockAt(x, y + 4, z + k, STAIRS);
        world.setBlockDataAt(x, y + 4, z + k, 3);
        world.setBlockAt(x + 4, y + 4, z + k, STAIRS);
        world.setBlockDataAt(x + 4, y + 4, z + k, 1);

        // Layer 3 (Y+5)
        world.setBlockAt(x + 1, y + 5, z + k, STAIRS);
        world.setBlockDataAt(x + 1, y + 5, z + k, 3);
        world.setBlockAt(x + 3, y + 5, z + k, STAIRS);
        world.setBlockDataAt(x + 3, y + 5, z + k, 1);

        // Ridge
        world.setBlockAt(x + 2, y + 5, z + k, PLANKS);
        
        // Gable Fill Front (Z=0) and Back (Z=6)
        if (k === 0 || k === 6) {
            // Fill row y+3 (width 3: x+1..x+3)
            for(let dx = 1; dx <= 3; dx++) world.setBlockAt(x + dx, y + 3, z + k, PLANKS);
            // Fill row y+4 (width 3: x+1..x+3) - Fixed missing blocks
            for(let dx = 1; dx <= 3; dx++) world.setBlockAt(x + dx, y + 4, z + k, PLANKS);
        }
    }

    // Wing Roof (X-axis gable, merging into Main)
    // Width 4 (Z: 2..6, center Z=4). Peak at Z=4.
    // X span: 5..8. Overhang X: 9.
    // It merges into Main at X=4.
    for (let i = 4; i <= 9; i++) {
        // Layer 1 (Y+3) - Z=1 (South facing) and Z=7 (North facing)
        world.setBlockAt(x + i, y + 3, z + 1, STAIRS); 
        world.setBlockDataAt(x + i, y + 3, z + 1, 0); // South (Ascend South)
        world.setBlockAt(x + i, y + 3, z + 7, STAIRS); 
        world.setBlockDataAt(x + i, y + 3, z + 7, 2); // North (Ascend North)

        // Layer 2 (Y+4) - Z=2 and Z=6
        // At connection (X=4), collision with Main Roof Layer 2. Use Planks to fill connection gap cleanly.
        let blockLayer2 = STAIRS;
        if (i === 4) blockLayer2 = PLANKS; 

        world.setBlockAt(x + i, y + 4, z + 2, blockLayer2);
        if (blockLayer2 === STAIRS) world.setBlockDataAt(x + i, y + 4, z + 2, 0);
        
        world.setBlockAt(x + i, y + 4, z + 6, blockLayer2);
        if (blockLayer2 === STAIRS) world.setBlockDataAt(x + i, y + 4, z + 6, 2);

        // Layer 3 (Y+5) - Z=3 and Z=5
        world.setBlockAt(x + i, y + 5, z + 3, STAIRS);
        world.setBlockDataAt(x + i, y + 5, z + 3, 0);
        world.setBlockAt(x + i, y + 5, z + 5, STAIRS);
        world.setBlockDataAt(x + i, y + 5, z + 5, 2);

        // Ridge (Z=4)
        world.setBlockAt(x + i, y + 5, z + 4, PLANKS);
        
        // Gable Fill at Wing End (X=8)
        if (i === 8) {
            for(let dz = 2; dz <= 6; dz++) world.setBlockAt(x + i, y + 3, z + dz, PLANKS);
            world.setBlockAt(x + i, y + 4, z + 3, PLANKS);
            world.setBlockAt(x + i, y + 4, z + 4, PLANKS);
            world.setBlockAt(x + i, y + 4, z + 5, PLANKS);
        }
    }

    // 4. Doors and Windows
    // Main Door (Front, X=2, Z=0)
    world.setBlockAt(x + 2, y, z, DOOR);
    world.setBlockDataAt(x + 2, y, z, 2); // Bottom (Face North)
    world.setBlockAt(x + 2, y + 1, z, DOOR);
    world.setBlockDataAt(x + 2, y + 1, z, 10); // Top (8 | 2)

    // Windows
    // Main Left
    world.setBlockAt(x, y + 1, z + 3, GLASS);
    // Wing Front
    world.setBlockAt(x + 6, y + 1, z + 2, GLASS);
    // Wing End
    world.setBlockAt(x + 8, y + 1, z + 4, GLASS);

    // 5. Interior
    // Torch
    world.setBlockAt(x + 2, y + 2, z + 5, TORCH); 
    world.setBlockDataAt(x + 2, y + 2, z + 5, 4); // On North face of Z=6 block

    // Crafting/Furnace area in corner of Main
    world.setBlockAt(x + 1, y, z + 5, CRAFTING_TABLE);
    world.setBlockAt(x + 3, y, z + 5, FURNACE);
    world.setBlockDataAt(x + 3, y, z + 5, 2); // Face North

    // Chest in Wing
    world.setBlockAt(x + 7, y, z + 3, CHEST);
    
    fillVillageChest(world, x + 7, y, z + 3);
}

export function buildVillageTower1(world, x, y, z) {
    const COBBLE = BlockRegistry.COBBLESTONE.getId();
    const PLANKS = BlockRegistry.WOOD.getId();
    const LOG = BlockRegistry.LOG.getId();
    const GLASS = BlockRegistry.GLASS.getId();
    const DOOR = BlockRegistry.DOOR.getId();
    const TORCH = BlockRegistry.TORCH.getId();
    const STAIRS = BlockRegistry.COBBLESTONE_STAIRS.getId(); 
    const LADDER = BlockRegistry.LADDER.getId();

    // 1. Foundation (5x5 area)
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            world.setBlockAt(x + i, y - 1, z + j, COBBLE);
        }
    }

    // 2. Tower Walls (Height 12)
    for (let dy = 0; dy < 12; dy++) {
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                // Walls
                if (i === 0 || i === 4 || j === 0 || j === 4) {
                    world.setBlockAt(x + i, y + dy, z + j, COBBLE);
                } else {
                    // Interior Air
                    world.setBlockAt(x + i, y + dy, z + j, 0);
                    // Floor at y+0 is COBBLE
                    if (dy === 0) world.setBlockAt(x + i, y + dy, z + j, COBBLE);
                    // Floor at y+6 (Second level)
                    if (dy === 6) {
                        // Leave hole for ladder at x+2, z+3
                        if (!(i === 2 && j === 3)) {
                            world.setBlockAt(x + i, y + dy, z + j, PLANKS);
                        }
                    }
                }
            }
        }
    }

    // 3. Roofs & Crenellations
    // Tower Roof Floor (at y+12)
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            // Leave hole for ladder at x+2, z+3
            if (!(i === 2 && j === 3)) {
                world.setBlockAt(x + i, y + 12, z + j, COBBLE);
            } else {
                world.setBlockAt(x + i, y + 12, z + j, 0); // Air gap
            }
        }
    }
    // Tower Crenellations (at y+13)
    const crenellations = [
        [0,0], [2,0], [4,0],
        [0,2],        [4,2],
        [0,4], [2,4], [4,4]
    ];
    for (let p of crenellations) {
        world.setBlockAt(x + p[0], y + 13, z + p[1], COBBLE);
    }

    // 4. Features (Door, Windows, Torches)
    
    // Ensure solid block under door at y+0 inside the wall frame
    world.setBlockAt(x + 2, y, z, COBBLE); 
    
    // Door (Tower front, X=2, Z=0)
    world.setBlockAt(x + 2, y + 1, z, DOOR);
    world.setBlockDataAt(x + 2, y + 1, z, 2); // Bottom (Face North)
    world.setBlockAt(x + 2, y + 2, z, DOOR);
    world.setBlockDataAt(x + 2, y + 2, z, 10); // Top (8 | 2)

    // Stairs leading to door (X=2, Y=0, Z=-1)
    world.setBlockAt(x + 2, y, z - 1, STAIRS);
    world.setBlockDataAt(x + 2, y, z - 1, 2); // Ascending South

    // Windows
    // Tower Front (Z=0)
    world.setBlockAt(x + 2, y + 3, z, GLASS);
    world.setBlockAt(x + 2, y + 4, z, GLASS);
    world.setBlockAt(x + 2, y + 8, z, GLASS);
    world.setBlockAt(x + 2, y + 9, z, GLASS);

    // Tower Back (Z=4)
    world.setBlockAt(x + 2, y + 3, z + 4, GLASS);
    world.setBlockAt(x + 2, y + 4, z + 4, GLASS);
    world.setBlockAt(x + 2, y + 8, z + 4, GLASS);
    world.setBlockAt(x + 2, y + 9, z + 4, GLASS);

    // Tower Left (X=0)
    world.setBlockAt(x, y + 3, z + 2, GLASS);
    world.setBlockAt(x, y + 4, z + 2, GLASS);
    world.setBlockAt(x, y + 8, z + 2, GLASS);
    world.setBlockAt(x, y + 9, z + 2, GLASS);

    // Torches
    world.setBlockAt(x + 1, y + 3, z, TORCH);
    world.setBlockDataAt(x + 1, y + 3, z, 4); // North face
    world.setBlockAt(x + 3, y + 3, z, TORCH);
    world.setBlockDataAt(x + 3, y + 3, z, 4);

    // Top of tower (Center)
    world.setBlockAt(x + 2, y + 13, z + 2, TORCH);
    world.setBlockDataAt(x + 2, y + 13, z + 2, 5); // Floor

    // LADDERS
    for (let dy = 1; dy <= 12; dy++) {
        world.setBlockAt(x + 2, y + dy, z + 3, LADDER);
        world.setBlockDataAt(x + 2, y + dy, z + 3, 2); // North facing
    }
}

/**
 * Generic Farm Spawner based on farm JSON assets.
 * size: [7, 2, 9]
 * @param {string} type - 'wheat', 'carrot', 'potato', or 'beetroot'
 */
export function buildFarm(world, x, y, z, type) {
    const LOG = BlockRegistry.LOG.getId();
    const FARMLAND = 62;
    const WATER = 9;
    
    let cropId = 59;
    let cropData = 7;
    if (type === 'carrot') { cropId = 141; cropData = 3; }
    if (type === 'potato') { cropId = 142; cropData = 3; }
    if (type === 'beetroot') { cropId = 420; cropData = 3; }

    // Clear area 7x2x9
    for (let dx = 0; dx < 7; dx++) {
        for (let dy = 0; dy < 2; dy++) {
            for (let dz = 0; dz < 9; dz++) {
                world.setBlockAt(x + dx, y + dy, z + dz, 0, 0, true);
            }
        }
    }

    // Outer border (Logs)
    for (let dx = 0; dx < 7; dx++) {
        world.setBlockAt(x + dx, y, z, LOG, 0, true);
        world.setBlockAt(x + dx, y, z + 8, LOG, 0, true);
    }
    for (let dz = 1; dz < 8; dz++) {
        world.setBlockAt(x, y, z + dz, LOG, 0, true);
        world.setBlockAt(x + 6, y, z + dz, LOG, 0, true);
    }

    // Interior (Crops and Water)
    for (let dx = 1; dx < 6; dx++) {
        for (let dz = 1; dz < 8; dz++) {
            if (dx === 3) {
                // Central water trench
                world.setBlockAt(x + dx, y, z + dz, WATER, 0, true);
            } else {
                // Farmland + Crops
                world.setBlockAt(x + dx, y, z + dz, FARMLAND, 0, true);
                world.setBlockAt(x + dx, y + 1, z + dz, cropId, cropData, true);
            }
        }
    }
}

export function buildBlacksmith(world, x, y, z) {
    const blocks = [[0,5,0,53,3],[0,5,1,53,3],[0,5,2,53,3],[0,5,3,53,3],[0,5,4,53,3],[0,5,5,53,3],[0,5,6,53,3],[0,5,7,53,3],[0,5,8,53,3],[1,0,1,17,0],[1,0,2,4,0],[1,0,3,4,0],[1,0,4,4,0],[1,0,5,4,0],[1,0,6,4,0],[1,0,7,17,0],[1,1,1,17,0],[1,1,2,5,0],[1,1,3,5,0],[1,1,4,5,0],[1,1,5,5,0],[1,1,6,5,0],[1,1,7,17,0],[1,2,1,17,0],[1,2,2,5,0],[1,2,3,20,0],[1,2,4,5,0],[1,2,5,20,0],[1,2,6,5,0],[1,2,7,17,0],[1,3,1,17,0],[1,3,2,5,0],[1,3,3,5,0],[1,3,4,5,0],[1,3,5,5,0],[1,3,6,5,0],[1,3,7,17,0],[1,4,1,17,0],[1,4,2,17,8],[1,4,3,17,8],[1,4,4,17,8],[1,4,5,17,8],[1,4,6,17,8],[1,4,7,17,0],[1,5,1,17,0],[1,5,2,5,0],[1,5,3,5,0],[1,5,4,5,0],[1,5,5,5,0],[1,5,6,5,0],[1,5,7,17,0],[1,6,0,53,3],[1,6,1,53,3],[1,6,2,53,3],[1,6,3,53,3],[1,6,4,53,3],[1,6,5,53,3],[1,6,6,53,3],[1,6,7,53,3],[1,6,8,53,3],[2,0,1,4,0],[2,0,2,4,0],[2,0,3,4,0],[2,0,4,4,0],[2,0,5,4,0],[2,0,6,4,0],[2,0,7,4,0],[2,1,1,5,0],[2,1,5,53,1],[2,1,6,5,0],[2,1,7,5,0],[2,2,1,5,0],[2,2,2,50,1],[2,2,6,50,4],[2,2,7,5,0],[2,3,1,5,0],[2,3,7,5,0],[2,4,1,17,4],[2,4,2,4,0],[2,4,3,4,0],[2,4,4,4,0],[2,4,5,4,0],[2,4,6,4,0],[2,4,7,17,4],[2,5,1,5,0],[2,5,7,5,0],[2,6,1,5,0],[2,6,7,5,0],[2,7,0,53,3],[2,7,1,53,3],[2,7,2,53,3],[2,7,3,53,3],[2,7,4,53,3],[2,7,5,53,3],[2,7,6,53,3],[2,7,7,53,3],[2,7,8,53,3],[3,0,1,4,0],[3,0,2,4,0],[3,0,3,4,0],[3,0,4,4,0],[3,0,5,4,0],[3,0,6,4,0],[3,0,7,4,0],[3,1,1,5,0],[3,1,5,85,0],[3,1,6,53,0],[3,1,7,5,0],[3,2,1,5,0],[3,2,5,72,0],[3,2,7,5,0],[3,3,1,5,0],[3,3,7,5,0],[3,4,1,17,4],[3,4,2,4,0],[3,4,3,4,0],[3,4,4,4,0],[3,4,5,4,0],[3,4,6,4,0],[3,4,7,17,4],[3,5,1,5,0],[3,5,7,5,0],[3,6,1,5,0],[3,6,7,5,0],[3,7,0,53,1],[3,7,1,53,1],[3,7,2,53,1],[3,7,3,53,1],[3,7,4,53,1],[3,7,5,53,1],[3,7,6,53,1],[3,7,7,53,1],[3,7,8,53,1],[4,0,1,17,0],[4,0,2,4,0],[4,0,3,4,0],[4,0,4,4,0],[4,0,5,4,0],[4,0,6,4,0],[4,0,7,17,0],[4,1,1,17,0],[4,1,2,64,1],[4,1,3,5,0],[4,1,7,17,0],[4,2,1,17,0],[4,2,2,64,9],[4,2,3,5,0],[4,2,7,17,0],[4,3,1,17,0],[4,3,2,5,0],[4,3,3,5,0],[4,3,7,17,0],[4,4,1,17,0],[4,4,2,4,0],[4,4,3,4,0],[4,4,4,4,0],[4,4,5,4,0],[4,4,6,4,0],[4,4,7,17,0],[4,5,1,17,0],[4,5,7,17,0],[4,6,0,53,1],[4,6,1,53,1],[4,6,2,53,1],[4,6,3,53,1],[4,6,4,53,1],[4,6,5,53,1],[4,6,6,53,1],[4,6,7,53,1],[4,6,8,53,1],[5,0,1,4,0],[5,0,2,4,0],[5,0,3,4,0],[5,0,4,4,0],[5,0,5,4,0],[5,0,6,4,0],[5,0,7,4,0],[5,1,4,17,0],[5,1,7,4,0],[5,2,3,50,1],[5,2,4,17,0],[5,2,7,17,4],[5,3,4,17,0],[5,3,7,4,0],[5,4,1,4,0],[5,4,2,4,0],[5,4,3,4,0],[5,4,4,4,0],[5,4,5,4,0],[5,4,6,4,0],[5,4,7,4,0],[5,5,0,53,1],[5,5,1,53,1],[5,5,2,53,1],[5,5,3,53,1],[5,5,4,53,1],[5,5,5,53,1],[5,5,6,53,1],[5,5,7,53,1],[5,5,8,53,1],[6,0,1,4,0],[6,0,2,4,0],[6,0,3,4,0],[6,0,4,4,0],[6,0,5,4,0],[6,0,6,4,0],[6,0,7,4,0],[6,1,4,4,0],[6,1,6,54,1],[6,1,7,4,0],[6,2,4,4,0],[6,2,7,20,0],[6,3,4,4,0],[6,3,5,50,2],[6,3,7,4,0],[6,4,1,4,0],[6,4,2,4,0],[6,4,3,4,0],[6,4,4,4,0],[6,4,5,4,0],[6,4,6,4,0],[6,4,7,4,0],[6,5,1,497,0],[6,5,7,497,0],[7,0,1,4,0],[7,0,2,4,0],[7,0,3,4,0],[7,0,4,4,0],[7,0,5,4,0],[7,0,6,4,0],[7,0,7,4,0],[7,1,1,85,0],[7,1,4,4,0],[7,1,5,4,0],[7,1,6,4,0],[7,1,7,4,0],[7,2,1,85,0],[7,2,4,61,2],[7,2,5,4,0],[7,2,6,4,0],[7,2,7,17,4],[7,3,1,85,0],[7,3,4,61,2],[7,3,5,4,0],[7,3,6,4,0],[7,3,7,4,0],[7,4,1,4,0],[7,4,2,4,0],[7,4,3,4,0],[7,4,4,4,0],[7,4,5,4,0],[7,4,6,4,0],[7,4,7,4,0],[7,5,1,497,0],[7,5,4,50,5],[7,5,7,497,0],[8,0,0,148,0],[8,0,1,4,0],[8,0,2,4,0],[8,0,3,4,0],[8,0,4,4,0],[8,0,5,4,0],[8,0,6,4,0],[8,0,7,4,0],[8,1,5,4,0],[8,1,6,10,0],[8,1,7,4,0],[8,2,7,4,0],[8,3,5,4,0],[8,3,6,4,0],[8,3,7,4,0],[8,4,1,4,0],[8,4,2,4,0],[8,4,3,4,0],[8,4,4,4,0],[8,4,5,4,0],[8,4,6,4,0],[8,4,7,4,0],[8,5,1,497,0],[8,5,6,4,0],[8,5,7,497,0],[9,0,0,148,0],[9,0,1,4,0],[9,0,2,4,0],[9,0,3,4,0],[9,0,4,4,0],[9,0,5,4,0],[9,0,6,4,0],[9,0,7,4,0],[9,1,5,4,0],[9,1,6,10,0],[9,1,7,4,0],[9,2,7,4,0],[9,3,5,4,0],[9,3,6,4,0],[9,3,7,4,0],[9,4,1,4,0],[9,4,2,4,0],[9,4,3,4,0],[9,4,4,4,0],[9,4,5,4,0],[9,4,6,4,0],[9,4,7,4,0],[9,5,1,497,0],[9,5,6,4,0],[9,5,7,497,0],[9,6,6,139,0],[10,0,1,4,0],[10,0,2,4,0],[10,0,3,4,0],[10,0,4,4,0],[10,0,5,4,0],[10,0,6,4,0],[10,0,7,4,0],[10,1,1,85,0],[10,1,5,4,0],[10,1,6,4,0],[10,1,7,4,0],[10,2,1,85,0],[10,2,7,4,0],[10,3,1,85,0],[10,3,5,4,0],[10,3,6,4,0],[10,3,7,4,0],[10,4,1,4,0],[10,4,2,4,0],[10,4,3,4,0],[10,4,4,4,0],[10,4,5,4,0],[10,4,6,4,0],[10,4,7,4,0],[10,5,1,497,0],[10,5,2,497,0],[10,5,3,497,0],[10,5,4,497,0],[10,5,5,497,0],[10,5,6,497,0],[10,5,7,497,0]];

    // Clear area: 11x8x9
    for (let dx = 0; dx < 11; dx++) {
        for (let dy = 0; dy < 8; dy++) {
            for (let dz = 0; dz < 9; dz++) {
                world.setBlockAt(x + dx, y + dy, z + dz, 0, 0, true);
            }
        }
    }

    // Place blocks from JSON
    for (let b of blocks) {
        const [bx, by, bz, id, data] = b;
        world.setBlockAt(x + bx, y + by, z + bz, id, data, true);
        
        // Handle chest data specifically if block is a chest (ID 54)
        if (id === 54) {
            fillBlacksmithChest(world, x + bx, y + by, z + bz);
        }
    }

    // Blacksmith Villager
    const smith = new EntityVillager(world.minecraft, world);
    smith.profession = "smith";
    smith.setPosition(x + 5.5, y + 1.1, z + 4.5);
    // Proper block checking for blacksmith spawn
    if (world.getBlockAt(Math.floor(smith.x), Math.floor(smith.y), Math.floor(smith.z)) === 0) {
        world.addEntity(smith);
    }
}

export function buildVillageHouse3(world, x, y, z) {
    const COBBLE = BlockRegistry.COBBLESTONE.getId();
    const PLANKS = BlockRegistry.WOOD.getId();
    const LOG = BlockRegistry.LOG.getId();
    const GLASS = BlockRegistry.GLASS.getId();
    const DOOR = BlockRegistry.DOOR.getId();
    const TORCH = BlockRegistry.TORCH.getId();
    const STAIRS = BlockRegistry.WOODEN_STAIRS.getId();
    const FENCE = BlockRegistry.FENCE.getId();
    const CHEST = BlockRegistry.CHEST.getId();
    const CRAFTING_TABLE = BlockRegistry.CRAFTING_TABLE.getId();
    const FURNACE = BlockRegistry.FURNACE.getId();

    // 1. Foundation
    for (let i = 0; i < 7; i++) {
        for (let k = 0; k < 7; k++) {
            world.setBlockAt(x + i, y - 1, z + k, COBBLE);
            for (let dy = 0; dy < 6; dy++) world.setBlockAt(x + i, y + dy, z + k, 0);
            world.setBlockAt(x + i, y, z + k, COBBLE);
        }
    }
    
    // Yard Foundation
    for (let i = 7; i < 12; i++) { 
        for (let k = 1; k < 7; k++) { 
            world.setBlockAt(x + i, y - 1, z + k, COBBLE);
            world.setBlockAt(x + i, y, z + k, BlockRegistry.GRASS.getId()); 
            for (let dy = 1; dy < 4; dy++) world.setBlockAt(x + i, y + dy, z + k, 0);
        }
    }

    // 2. Walls
    const height = 4;
    for (let dy = 0; dy < height; dy++) {
        for (let i = 0; i < 7; i++) {
            for (let k = 0; k < 7; k++) {
                if (i === 0 || i === 6 || k === 0 || k === 6) {
                    if (dy < 2 && k === 0 && i === 3) continue;
                    if (dy < 2 && i === 6 && k === 4) continue;

                    let isCorner = (i === 0 || i === 6) && (k === 0 || k === 6);
                    let block = PLANKS;
                    if (isCorner) block = LOG;
                    else if (dy < 2) block = COBBLE; 

                    world.setBlockAt(x + i, y + 1 + dy, z + k, block);
                }
            }
        }
    }

    // 3. Roof
    for (let k = -1; k <= 7; k++) {
        world.setBlockAt(x - 1, y + 4, z + k, STAIRS); world.setBlockDataAt(x - 1, y + 4, z + k, 3);
        world.setBlockAt(x + 7, y + 4, z + k, STAIRS); world.setBlockDataAt(x + 7, y + 4, z + k, 1);

        world.setBlockAt(x + 0, y + 5, z + k, STAIRS); world.setBlockDataAt(x + 0, y + 5, z + k, 3);
        world.setBlockAt(x + 6, y + 5, z + k, STAIRS); world.setBlockDataAt(x + 6, y + 5, z + k, 1);

        world.setBlockAt(x + 1, y + 6, z + k, STAIRS); world.setBlockDataAt(x + 1, y + 6, z + k, 3);
        world.setBlockAt(x + 5, y + 6, z + k, STAIRS); world.setBlockDataAt(x + 5, y + 6, z + k, 1);

        world.setBlockAt(x + 2, y + 7, z + k, STAIRS); world.setBlockDataAt(x + 2, y + 7, z + k, 3);
        world.setBlockAt(x + 4, y + 7, z + k, STAIRS); world.setBlockDataAt(x + 4, y + 7, z + k, 1);

        world.setBlockAt(x + 3, y + 8, z + k, PLANKS); 
        
        if (k === 0 || k === 6) {
            for(let ix=0; ix<=6; ix++) {
                let h = 0;
                if (ix===0 || ix===6) h = 4;
                if (ix===1 || ix===5) h = 5;
                if (ix===2 || ix===4) h = 6;
                if (ix===3) h = 7;
                for(let iy=5; iy<=h; iy++) {
                    world.setBlockAt(x + ix, y + iy, z + k, PLANKS);
                }
            }
        }
    }

    // 4. Doors
    world.setBlockAt(x + 3, y + 1, z, DOOR); world.setBlockDataAt(x + 3, y + 1, z, 2); 
    world.setBlockAt(x + 3, y + 2, z, DOOR); world.setBlockDataAt(x + 3, y + 2, z, 10); 
    
    world.setBlockAt(x + 3, y, z - 1, STAIRS); world.setBlockDataAt(x + 3, y, z - 1, 0);

    // 5. Interior Furniture
    // Furnace against back wall
    world.setBlockAt(x + 2, y + 1, z + 5, FURNACE);
    world.setBlockDataAt(x + 2, y + 1, z + 5, 2); // North facing

    // Crafting Table
    world.setBlockAt(x + 3, y + 1, z + 5, CRAFTING_TABLE);

    // Chest
    world.setBlockAt(x + 4, y + 1, z + 5, CHEST);
    world.setBlockDataAt(x + 4, y + 1, z + 5, 2); // North facing
    
    fillVillageChest(world, x + 4, y + 1, z + 5);

    // 6. Yard Fences
    for (let i = 7; i <= 11; i++) {
        for (let k = 1; k <= 6; k++) {
            if (i === 7 || i === 11 || k === 1 || k === 6) {
                if (i === 7 && k === 4) continue; 

                world.setBlockAt(x + i, y + 1, z + k, FENCE);
                
                if ((i===7 || i===11) && (k===1 || k===6)) {
                    world.setBlockAt(x + i, y + 1, z + k, PLANKS); 
                }
            }
        }
    }
    // Yard Door
    world.setBlockAt(x + 6, y + 1, z + 4, DOOR); world.setBlockDataAt(x + 6, y + 1, z + 4, 3); 
    world.setBlockAt(x + 6, y + 2, z + 4, DOOR); world.setBlockDataAt(x + 6, y + 2, z + 4, 11); 

    // 7. Torches
    world.setBlockAt(x + 1, y + 3, z - 1, TORCH); world.setBlockDataAt(x + 1, y + 3, z - 1, 4); 
    world.setBlockAt(x + 5, y + 3, z - 1, TORCH); world.setBlockDataAt(x + 5, y + 3, z - 1, 4); 
    
    world.setBlockAt(x + 11, y + 2, z + 1, TORCH); world.setBlockDataAt(x + 11, y + 2, z + 1, 5);
    world.setBlockAt(x + 11, y + 2, z + 6, TORCH); world.setBlockDataAt(x + 11, y + 2, z + 6, 5);
}

export function buildVillageWell(world, x, y, z) {
    const COBBLE = BlockRegistry.COBBLESTONE.getId();
    const WATER = BlockRegistry.WATER.getId();
    const FENCE = BlockRegistry.FENCE.getId();
    const TORCH = BlockRegistry.TORCH.getId();
    const GRAVEL = BlockRegistry.GRAVEL.getId();

    for (let dy = -3; dy <= 0; dy++) {
        for (let i = 0; i < 4; i++) {
            for (let k = 0; k < 4; k++) {
                if (i === 0 || i === 3 || k === 0 || k === 3) {
                    world.setBlockAt(x + i, y + dy, z + k, COBBLE);
                } else {
                    world.setBlockAt(x + i, y + dy, z + k, WATER);
                    world.setBlockDataAt(x + i, y + dy, z + k, 0); 
                }
            }
        }
    }

    const corners = [[0,0], [3,0], [0,3], [3,3]];
    for (let corner of corners) {
        world.setBlockAt(x + corner[0], y + 1, z + corner[1], FENCE);
        world.setBlockAt(x + corner[0], y + 2, z + corner[1], FENCE);
    }

    for (let i = 0; i < 4; i++) {
        for (let k = 0; k < 4; k++) {
            world.setBlockAt(x + i, y + 3, z + k, COBBLE);
        }
    }

    world.setBlockAt(x + 0, y + 4, z + 0, TORCH); world.setBlockDataAt(x + 0, y + 4, z + 0, 5);
    world.setBlockAt(x + 3, y + 4, z + 0, TORCH); world.setBlockDataAt(x + 3, y + 4, z + 0, 5);
    world.setBlockAt(x + 0, y + 4, z + 3, TORCH); world.setBlockDataAt(x + 0, y + 4, z + 3, 5);
    world.setBlockAt(x + 3, y + 4, z + 3, TORCH); world.setBlockDataAt(x + 3, y + 4, z + 3, 5);

    for (let i = -1; i <= 4; i++) {
        for (let k = -1; k <= 4; k++) {
            if (i >= 0 && i <= 3 && k >= 0 && k <= 3) continue;
            world.setBlockAt(x + i, y - 1, z + k, GRAVEL);
            world.setBlockAt(x + i, y, z + k, 0);
        }
    }
}

export function buildIgloo(world, x, y, z) {
    const SNOW = BlockRegistry.SNOW_BLOCK.getId();
    const ICE = BlockRegistry.ICE.getId();
    const TORCH = BlockRegistry.TORCH.getId();
    const FURNACE = BlockRegistry.FURNACE.getId();
    const CRAFTING_TABLE = BlockRegistry.CRAFTING_TABLE.getId();

    for (let i = -3; i <= 3; i++) {
        for (let k = -3; k <= 3; k++) {
            let d = Math.sqrt(i*i + k*k);
            if (d <= 3.5) {
                world.setBlockAt(x + i, y - 1, z + k, SNOW);
                for(let h=0; h<5; h++) world.setBlockAt(x + i, y + h, z + k, 0);
            }
        }
    }

    const layer012 = [
        "  XXX  ",
        " X   X ",
        "X     X",
        "X     X",
        "X     X",
        " X   X ",
        "  XXX  "
    ];
    
    const layer3 = [
        "       ",
        " XXXXX ",
        "XX   XX",
        "X     X",
        "XX   XX",
        " XXXXX ",
        "       "
    ];
    
    const layer4 = [
        "       ",
        "       ",
        "  XXX  ",
        "  XXX  ",
        "  XXX  ",
        "       ",
        "       "
    ];

    const buildLayer = (layout, dy) => {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                if (layout[r][c] === 'X') {
                    world.setBlockAt(x + c - 3, y + dy, z + r - 3, SNOW);
                }
            }
        }
    };

    buildLayer(layer012, 0);
    buildLayer(layer012, 1);
    buildLayer(layer012, 2);
    buildLayer(layer3, 3);
    buildLayer(layer4, 4);
    
    world.setBlockAt(x, y + 4, z, SNOW);

    for (let k = 3; k <= 3; k++) {
        world.setBlockAt(x - 1, y, z + k, SNOW);
        world.setBlockAt(x + 1, y, z + k, SNOW);
        world.setBlockAt(x - 1, y + 2, z + k, SNOW);
        world.setBlockAt(x, y + 2, z + k, SNOW);
        world.setBlockAt(x + 1, y + 2, z + k, SNOW);
        world.setBlockAt(x, y - 1, z + k, SNOW);
        world.setBlockAt(x - 1, y - 1, z + k, SNOW);
        world.setBlockAt(x + 1, y - 1, z + k, SNOW);
        
        world.setBlockAt(x, y, z + k, 0);
        world.setBlockAt(x, y + 1, z + k, 0);
    }
    
    world.setBlockAt(x - 3, y + 1, z, ICE);
    world.setBlockAt(x + 3, y + 1, z, ICE);

    world.setBlockAt(x, y, z - 2, FURNACE);
    world.setBlockDataAt(x, y, z - 2, 2); 
    
    world.setBlockAt(x - 1, y, z - 2, CRAFTING_TABLE);
    
    world.setBlockAt(x, y + 2, z + 2, TORCH); 
    world.setBlockDataAt(x, y + 2, z + 2, 1); 
    
    world.setBlockAt(x, y + 2, z + 4, TORCH);
    world.setBlockDataAt(x, y + 2, z + 4, 3);
}

export function buildDesertWell(world, x, y, z) {
    const SANDSTONE = BlockRegistry.SANDSTONE.getId();
    const SLAB = BlockRegistry.SANDSTONE_SLAB.getId();
    const WATER = BlockRegistry.WATER.getId();

    // Clear air inside the structure area (to prevent buried wells from being filled)
    for (let dy = 1; dy <= 2; dy++) {
        for (let i = -1; i <= 1; i++) {
            for (let k = -1; k <= 1; k++) {
                // Don't clear pillars positions
                if (Math.abs(i) === 1 && Math.abs(k) === 1) continue;
                world.setBlockAt(x + i, y + dy, z + k, 0);
            }
        }
    }
    
    // Foundation (5x5 Sandstone)
    for (let i = -2; i <= 2; i++) {
        for (let k = -2; k <= 2; k++) {
            world.setBlockAt(x + i, y - 1, z + k, SANDSTONE);
        }
    }

    // Base Ring (3x3 ring of sandstone around water)
    for (let i = -1; i <= 1; i++) {
        for (let k = -1; k <= 1; k++) {
            if (i === 0 && k === 0) {
                // Center Water
                world.setBlockAt(x, y, z, WATER);
                world.setBlockDataAt(x, y, z, 0); // Source block
            } else {
                // Surround
                world.setBlockAt(x + i, y, z + k, SANDSTONE);
            }
        }
    }
    
    // Outer Slabs (Ring around the 3x3 base)
    for (let i = -2; i <= 2; i++) {
        for (let k = -2; k <= 2; k++) {
            // If outside the 3x3 center area
            if (Math.abs(i) === 2 || Math.abs(k) === 2) {
                world.setBlockAt(x + i, y, z + k, SLAB);
            }
        }
    }

    // Pillars (2 blocks high on corners of the 3x3 ring)
    // Positions: (-1,-1), (1,-1), (-1,1), (1,1) relative to center
    const pillars = [
        {dx: -1, dz: -1}, {dx: 1, dz: -1},
        {dx: -1, dz: 1}, {dx: 1, dz: 1}
    ];
    
    for (let p of pillars) {
        world.setBlockAt(x + p.dx, y + 1, z + p.dz, SANDSTONE);
        world.setBlockAt(x + p.dx, y + 2, z + p.dz, SANDSTONE);
    }

    // Roof (3x3 Slabs)
    for (let i = -1; i <= 1; i++) {
        for (let k = -1; k <= 1; k++) {
            // Don't overwrite the pillars themselves if we want them to connect nicely,
            // but slabs on top of pillars is standard.
            world.setBlockAt(x + i, y + 3, z + k, SLAB);
        }
    }

    // Center Cap (Sandstone Block in middle of roof)
    world.setBlockAt(x, y + 3, z, SANDSTONE);
}

export function fillBlacksmithChest(world, x, y, z) {
    const items = new Array(27).fill(null).map(() => ({id:0,count:0,damage:0,tag:{}}));
    let idx = 0;
    
    const put = (id, count) => {
        if (idx < 27) {
            items[idx].id = id;
            items[idx].count = count;
            idx++;
        }
    };

    // Village Blacksmith Chest Loot (Java Accurate)
    // Common Items
    if (Math.random() < 0.6) put(265, 1 + Math.floor(Math.random() * 3)); // Iron Ingot
    if (Math.random() < 0.6) put(297, 1 + Math.floor(Math.random() * 4)); // Bread
    if (Math.random() < 0.6) put(260, 1 + Math.floor(Math.random() * 5)); // Apple
    
    // Iron Armor Pieces (~20% each)
    if (Math.random() < 0.2) put(306, 1); // Helmet
    if (Math.random() < 0.2) put(307, 1); // Chestplate
    if (Math.random() < 0.2) put(308, 1); // Leggings
    if (Math.random() < 0.2) put(309, 1); // Boots

    // Valuable / Rare Items
    if (Math.random() < 0.15) put(264, 1 + Math.floor(Math.random() * 3)); // Diamonds
    if (Math.random() < 0.25) put(49, 1 + Math.floor(Math.random() * 7));  // Obsidian
    if (Math.random() < 0.2) put(266, 1 + Math.floor(Math.random() * 3));  // Gold Ingot
    if (Math.random() < 0.2) put(388, 1 + Math.floor(Math.random() * 3));  // Emerald

    // Extremely Rare
    if (Math.random() < 0.03) put(322, 1); // Golden Apple

    // Rare sapling loot: choose any species.
    if (Math.random() < 0.08) {
        const saplings = [400, 202, 211, 323, 324];
        put(saplings[Math.floor(Math.random() * saplings.length)], 1);
    }

    world.setTileEntity(x, y, z, { items: items });
}

function fillVillageChest(world, x, y, z) {
    const items = new Array(27).fill(null).map(() => ({id:0,count:0,damage:0,tag:{}}));
    let idx = 0;
    
    const put = (id, count) => {
        if (idx < 27) {
            items[idx].id = id;
            items[idx].count = count;
            idx++;
        }
    };

    // Base contents (Bonus Chest style)
    put(280, 2 + Math.floor(Math.random() * 4));
    put(17, 2 + Math.floor(Math.random() * 3));
    put(5, 2 + Math.floor(Math.random() * 6));
    
    // Rare sapling loot: choose any species.
    if (Math.random() < 0.08) {
        const saplings = [400, 202, 211, 323, 324];
        put(saplings[Math.floor(Math.random() * saplings.length)], 1);
    }

    // Village additions
    if (Math.random() < 0.30) put(265, 1);
    if (Math.random() < 0.20) put(265, 2);
    if (Math.random() < 0.08) put(265, 4);
    if (Math.random() < 0.02) put(264, 1);

    // 8% chance for 2-7 carrots
    if (Math.random() < 0.08) {
        put(403, 2 + Math.floor(Math.random() * 6));
    }
    
    // 8% chance for 3-8 potatoes
    if (Math.random() < 0.08) {
        put(405, 3 + Math.floor(Math.random() * 6));
    }
    
    // 10% chance for a Saddle
    if (Math.random() < 0.10) put(BlockRegistry.SADDLE.getId(), 1);

    world.setTileEntity(x, y, z, { items: items });
}

 
