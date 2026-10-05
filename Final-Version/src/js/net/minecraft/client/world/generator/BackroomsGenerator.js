/*
 * Infinite seed-only Backrooms generator. It is selected by
 * World.isBackroomsSeed when the player creates a world with the literal
 * seed "backrooms". Every room is derived from its world-grid coordinate, so
 * newly explored chunks continue the same maze forever.
 */

import {BlockRegistry} from "../block/BlockRegistry.js";

const CELL_SIZE = 16;
const FLOOR_Y = 48;
const CARPET_Y = 49;
const WALL_BOTTOM_Y = CARPET_Y;
const CEILING_Y = 56;

const RoomType = Object.freeze({
    START: "start",
    STANDARD: "standard",
    OPEN: "open",
    WATER: "water",
    MAINTENANCE: "maintenance",
    STAIRWELL: "stairwell",
    GENERATOR: "generator",
    SPECIAL: "special"
});

function modulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
}

function hash2D(x, z, salt) {
    let hash = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ salt;
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    return (hash ^ (hash >>> 16)) >>> 0;
}

export default class BackroomsGenerator {
    generateInChunk(chunkX, chunkZ, primer) {
        const ids = this.getBlockIds();

        for (let localX = 0; localX < 16; localX++) {
            const worldX = chunkX * 16 + localX;
            const cellX = Math.floor(worldX / CELL_SIZE);
            const inCellX = modulo(worldX, CELL_SIZE);

            for (let localZ = 0; localZ < 16; localZ++) {
                const worldZ = chunkZ * 16 + localZ;
                const cellZ = Math.floor(worldZ / CELL_SIZE);
                const inCellZ = modulo(worldZ, CELL_SIZE);
                const room = this.roomTypeAt(cellX, cellZ);

                this.buildFoundation(primer, localX, localZ, ids);
                this.paintFloor(primer, localX, localZ, inCellX, inCellZ, room, ids);
                this.paintCeiling(primer, localX, localZ, inCellX, inCellZ, room, cellX, cellZ, ids);
                this.placeRoomDetail(primer, localX, localZ, inCellX, inCellZ, room, cellX, cellZ, ids);

                if (this.isBoundaryWall(worldX, worldZ)) {
                    this.buildBoundaryWall(primer, localX, localZ, room, ids);
                }
            }
        }
    }

    getBlockIds() {
        return {
            air: 0,
            bedrock: BlockRegistry.BEDROCK.getId(),
            stone: BlockRegistry.STONE.getId(),
            stoneBricks: BlockRegistry.STONE_BRICKS.getId(),
            yellowWool: BlockRegistry.YELLOW_WOOL.getId(),
            yellowCarpet: BlockRegistry.YELLOW_CARPET.getId(),
            lightGrayWool: BlockRegistry.LIGHT_GRAY_WOOL.getId(),
            grayWool: BlockRegistry.GRAY_WOOL.getId(),
            blackWool: BlockRegistry.BLACK_WOOL.getId(),
            redWool: BlockRegistry.RED_WOOL.getId(),
            grayCarpet: BlockRegistry.GRAY_CARPET.getId(),
            blackCarpet: BlockRegistry.BLACK_CARPET.getId(),
            water: BlockRegistry.WATER.getId(),
            glowstone: BlockRegistry.GLOWSTONE.getId(),
            redstoneLamp: BlockRegistry.REDSTONE_LAMP_ON.getId(),
            ironBlock: BlockRegistry.IRON_BLOCK.getId(),
            ironBars: BlockRegistry.IRON_BARS.getId(),
            furnace: BlockRegistry.FURNACE.getId(),
            redstoneBlock: BlockRegistry.REDSTONE_BLOCK.getId(),
            backroomsWall: BlockRegistry.BACKROOMS_WALL.getId(),
            backroomsLight: BlockRegistry.BACKROOMS_LIGHT.getId(),
            backroomsBlood: BlockRegistry.BACKROOMS_BLOOD.getId(),
            backroomsCeiling: BlockRegistry.BACKROOMS_CEILING.getId(),
            backroomsCarpet: BlockRegistry.BACKROOMS_CARPET.getId()
        };
    }

    buildFoundation(primer, x, z, ids) {
        // A solid foundation keeps the endless rooms safe even if the player
        // mines through carpet or a themed floor.
        primer.set(x, 0, z, ids.bedrock);
        for (let y = 1; y < FLOOR_Y; y++) primer.set(x, y, z, ids.stone);
    }

    paintFloor(primer, x, z, inCellX, inCellZ, room, ids) {
        let base = ids.yellowWool;
        // A dedicated, worn carpet texture makes the main rooms feel less
        // like a normal Minecraft interior while retaining carpet collision.
        let surface = ids.backroomsCarpet;

        if (room === RoomType.MAINTENANCE || room === RoomType.GENERATOR) {
            base = ids.grayWool;
            surface = ((inCellX + inCellZ) & 1) === 0 ? ids.grayCarpet : ids.blackCarpet;
        } else if (room === RoomType.SPECIAL) {
            base = ids.blackWool;
            surface = ((inCellX + inCellZ) & 1) === 0 ? ids.blackCarpet : ids.grayCarpet;
        }

        primer.set(x, FLOOR_Y, z, base);
        primer.set(x, CARPET_Y, z, surface);

        // A contained shallow pool: its wool rim keeps it from spilling into
        // the surrounding infinite hallways.
        if (room === RoomType.WATER && inCellX >= 4 && inCellX <= 11 && inCellZ >= 4 && inCellZ <= 11) {
            const edge = inCellX === 4 || inCellX === 11 || inCellZ === 4 || inCellZ === 11;
            primer.set(x, CARPET_Y, z, edge ? ids.backroomsWall : ids.water);
        }
    }

    paintCeiling(primer, x, z, inCellX, inCellZ, room, cellX, cellZ, ids) {
        const lamp = this.isLampPosition(inCellX, inCellZ, room);
        // Warm, stained acoustic panels replace the flat wool roof in normal
        // rooms. Utility spaces remain colder and darker by design.
        let ceiling = (room === RoomType.MAINTENANCE || room === RoomType.GENERATOR || room === RoomType.SPECIAL)
            ? ids.grayWool
            : ids.backroomsCeiling;

        // A small deterministic number of tiles have failed or stained. This
        // breaks up long ceiling runs without placing obstacles in the room.
        const tileHash = hash2D(cellX * 31 + inCellX, cellZ * 31 + inCellZ, 0xCE11);
        if (!lamp && room !== RoomType.START && tileHash % 47 === 0) ceiling = ids.grayWool;

        // Use the supplied fluorescent fixture texture everywhere so even dark
        // rooms retain the unmistakable Backrooms ceiling-light look.
        primer.set(x, CEILING_Y, z, lamp ? ids.backroomsLight : ceiling);
    }

    isLampPosition(inCellX, inCellZ, room) {
        if (room === RoomType.OPEN) {
            return (inCellX === 3 || inCellX === 7 || inCellX === 11) && (inCellZ === 3 || inCellZ === 7 || inCellZ === 11);
        }
        if (room === RoomType.MAINTENANCE || room === RoomType.GENERATOR || room === RoomType.SPECIAL) {
            return (inCellX === 4 || inCellX === 11) && (inCellZ === 4 || inCellZ === 11);
        }
        return (inCellX === 4 || inCellX === 11) && (inCellZ === 4 || inCellZ === 11);
    }

    placeRoomDetail(primer, x, z, inCellX, inCellZ, room, cellX, cellZ, ids) {
        // The starting room intentionally stays clear around its safe spawn.
        if (room === RoomType.STANDARD && this.isPillar(inCellX, inCellZ, cellX, cellZ)) {
            this.buildColumn(primer, x, z, ids.backroomsWall);
            return;
        }

        if (room === RoomType.MAINTENANCE) {
            // Thin overhead conduit runs make utility rooms read as a different
            // service level without constricting the player path below.
            const conduit = (inCellX === 2 || inCellX === 13) && inCellZ >= 3 && inCellZ <= 12;
            if (conduit) primer.set(x, CEILING_Y - 1, z, ids.ironBars);

            const shelf = (inCellX === 3 || inCellX === 12) && inCellZ >= 4 && inCellZ <= 11;
            if (shelf) {
                primer.set(x, CARPET_Y, z, ids.ironBlock);
                primer.set(x, CARPET_Y + 1, z, ids.ironBars);
                primer.set(x, CARPET_Y + 2, z, ids.ironBars);
            }
            return;
        }

        if (room === RoomType.GENERATOR) {
            if (inCellX >= 6 && inCellX <= 9 && inCellZ >= 6 && inCellZ <= 9) {
                const edge = inCellX === 6 || inCellX === 9 || inCellZ === 6 || inCellZ === 9;
                primer.set(x, CARPET_Y, z, edge ? ids.ironBlock : ids.furnace);
                primer.set(x, CARPET_Y + 1, z, edge ? ids.ironBars : ids.redstoneLamp);
                if (inCellX === 7 && inCellZ === 7) primer.set(x, CARPET_Y + 2, z, ids.redstoneBlock);
            }
            return;
        }

        if (room === RoomType.STAIRWELL) {
            // A compact staircase climbs to an upper service landing, making
            // occasional rooms feel vertically different without a new world.
            if (inCellZ >= 6 && inCellZ <= 9 && inCellX >= 4 && inCellX <= 10) {
                const height = Math.min(4, inCellX - 4);
                for (let y = CARPET_Y; y < CARPET_Y + height; y++) {
                    primer.set(x, y, z, ids.stoneBricks);
                }
            }
            if (inCellX >= 10 && inCellX <= 13 && inCellZ >= 5 && inCellZ <= 10) {
                primer.set(x, CARPET_Y + 4, z, ids.stoneBricks);
            }
            return;
        }

        if (room === RoomType.SPECIAL) {
            // Sparse floor decals use the supplied blood texture instead of a
            // solid red platform, keeping special rooms unsettling but walkable.
            const bloodSeed = hash2D(cellX, cellZ, 0xB100D);
            const bloodX = 5 + (bloodSeed % 6);
            const bloodZ = 5 + ((bloodSeed >>> 4) % 6);
            const nearbyStain = Math.abs(inCellX - bloodX) <= 1 && Math.abs(inCellZ - bloodZ) <= 1;
            if (nearbyStain) primer.set(x, CARPET_Y, z, ids.backroomsBlood);
            if (inCellX === 8 && inCellZ === 8) primer.set(x, CARPET_Y + 1, z, ids.redstoneBlock);
        }
    }

    isPillar(inCellX, inCellZ, cellX, cellZ) {
        const layout = hash2D(cellX, cellZ, 0xC011) & 3;
        if (layout === 0) return (inCellX === 4 || inCellX === 11) && (inCellZ === 4 || inCellZ === 11);
        if (layout === 1) return (inCellX === 4 || inCellX === 11) && inCellZ === 8;
        if (layout === 2) return inCellX === 8 && (inCellZ === 4 || inCellZ === 11);
        return false;
    }

    buildBoundaryWall(primer, x, z, room, ids) {
        const wall = this.wallBlockFor(room, ids);
        // A dark, scuffed baseboard grounds the wallpaper and makes walls feel
        // deliberately constructed rather than floating coloured blocks.
        primer.set(x, WALL_BOTTOM_Y, z, (room === RoomType.SPECIAL) ? ids.blackWool : ids.grayWool);
        for (let y = WALL_BOTTOM_Y + 1; y < CEILING_Y; y++) primer.set(x, y, z, wall);
    }

    buildColumn(primer, x, z, blockId) {
        // Pillars use the same grounded construction as perimeter walls.
        primer.set(x, WALL_BOTTOM_Y, z, BlockRegistry.GRAY_WOOL.getId());
        for (let y = WALL_BOTTOM_Y + 1; y < CEILING_Y; y++) primer.set(x, y, z, blockId);
    }

    roomTypeAt(cellX, cellZ) {
        if (cellX === 0 && cellZ === 0) return RoomType.START;

        const roll = hash2D(cellX, cellZ, 0xBACC) % 1000;
        if (roll < 18) return RoomType.GENERATOR;       // 1.8%, rare machinery room
        if (roll < 43) return RoomType.STAIRWELL;       // 2.5%, rare vertical room
        if (roll < 88) return RoomType.SPECIAL;         // 4.5%, dark red signal room
        if (roll < 170) return RoomType.WATER;          // 8.2%, contained water room
        if (roll < 285) return RoomType.MAINTENANCE;    // 11.5%, dark utility room
        if (roll < 480) return RoomType.OPEN;           // 19.5%, large bright area
        return RoomType.STANDARD;
    }

    isOpenRoom(room) {
        return room === RoomType.OPEN || room === RoomType.START;
    }

    isBoundaryWall(worldX, worldZ) {
        const cellX = Math.floor(worldX / CELL_SIZE);
        const cellZ = Math.floor(worldZ / CELL_SIZE);
        const inCellX = modulo(worldX, CELL_SIZE);
        const inCellZ = modulo(worldZ, CELL_SIZE);

        let wall = false;
        if (inCellX === 0 && !this.verticalBoundaryOpening(cellX, cellZ, inCellZ)) wall = true;
        if (inCellZ === 0 && !this.horizontalBoundaryOpening(cellX, cellZ, inCellX)) wall = true;
        return wall;
    }

    verticalBoundaryOpening(rightCellX, cellZ, inCellZ) {
        const leftRoom = this.roomTypeAt(rightCellX - 1, cellZ);
        const rightRoom = this.roomTypeAt(rightCellX, cellZ);
        if (this.isOpenRoom(leftRoom) || this.isOpenRoom(rightRoom)) return inCellZ >= 4 && inCellZ <= 11;

        const doorway = 4 + (hash2D(rightCellX, cellZ, 0x51A7) % 6);
        return inCellZ >= doorway && inCellZ <= doorway + 2;
    }

    horizontalBoundaryOpening(cellX, bottomCellZ, inCellX) {
        const topRoom = this.roomTypeAt(cellX, bottomCellZ - 1);
        const bottomRoom = this.roomTypeAt(cellX, bottomCellZ);
        if (this.isOpenRoom(topRoom) || this.isOpenRoom(bottomRoom)) return inCellX >= 4 && inCellX <= 11;

        const doorway = 4 + (hash2D(cellX, bottomCellZ, 0xD007) % 6);
        return inCellX >= doorway && inCellX <= doorway + 2;
    }

    wallBlockFor(room, ids) {
        if (room === RoomType.MAINTENANCE || room === RoomType.GENERATOR) return ids.grayWool;
        if (room === RoomType.SPECIAL) return ids.blackWool;
        return ids.backroomsWall;
    }
}

// Center of the clear starting room. The Player's feet are one block above the
// carpet, leaving a normal 1.8-block-high space beneath the ceiling.
export const BACKROOMS_SPAWN = Object.freeze({x: 8, y: 50, z: 8});
