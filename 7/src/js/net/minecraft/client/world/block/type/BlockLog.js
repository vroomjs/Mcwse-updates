import Block from "../Block.js";

export default class BlockLog extends Block {

    constructor(id, textureName, sideIndex, topIndex, cols = 14) {
        super(id, 0);
        this.textureName = textureName;
        this.sideIndex = sideIndex;
        this.topIndex = topIndex;
        this.cols = cols;
        this.sound = Block.sounds.wood;
    }

    getTextureForFace(face, meta = 0) {
        const axis = (meta >> 2) & 3; // 0=Y, 1=X, 2=Z, 3=None
        let isTop = false;

        if (axis === 0 && face.isYAxis()) isTop = true;
        else if (axis === 1 && face.isXAxis()) isTop = true;
        else if (axis === 2 && face.isZAxis()) isTop = true;
        else if (axis === 3) isTop = false; // All sides are bark

        return {
            type: 'custom',
            name: this.textureName,
            index: isTop ? this.topIndex : this.sideIndex,
            cols: this.cols
        };
    }

    onBlockPlaced(world, x, y, z, face) {
        let meta = 0;
        if (face.isXAxis()) meta = 1 << 2; // X
        else if (face.isZAxis()) meta = 2 << 2; // Z
        else meta = 0; // Y
        world.setBlockDataAt(x, y, z, meta);
    }

    onBlockActivated(world, x, y, z, player) {
        let heldId = player.inventory.getItemInSelectedSlot();
        const axes = [271, 275, 258, 286, 279];
        
        if (axes.includes(heldId)) {
            const strippedMap = {
                17: 254,  // Oak -> Stripped Oak
                200: 300, // Birch -> Stripped Birch
                209: 301, // Spruce -> Stripped Spruce
                235: 302, // Acacia -> Stripped Acacia
                253: 303  // Dark Oak -> Stripped Dark Oak
            };
            
            let strippedId = strippedMap[this.id];
            if (strippedId) {
                world.setBlockAt(x, y, z, strippedId);
                player.swingArm();
                world.minecraft.soundManager.playSound("step.wood", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
                
                if (player.gameMode !== 1) {
                    let slot = player.inventory.selectedSlotIndex;
                    let stack = player.inventory.items[slot];
                    if (stack) {
                        stack.damage = (stack.damage || 0) + 1;
                        let toolBlock = Block.getById(stack.id);
                        if (toolBlock && toolBlock.maxDamage > 0 && stack.damage >= toolBlock.maxDamage) {
                            player.inventory.setItemInSelectedSlot(0);
                            world.minecraft.soundManager.playSound("random.break_tool", player.x, player.y, player.z, 1.0, 1.0);
                        }
                    }
                }
                return true;
            }
        }
        return false;
    }
}