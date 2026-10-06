import Block from "./block/Block.js";

export class PathNode {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.totalPathDistance = 0; // g
        this.distanceToTarget = 0;  // h
        this.priority = 0;          // f
        this.parent = null;
    }
    
    key() {
        return this.x + "," + this.y + "," + this.z;
    }
}

export default class PathFinder {
    constructor(world) {
        this.world = world;
    }

    createPath(entity, x, y, z, range) {
        let start = new PathNode(Math.floor(entity.x), Math.floor(entity.y), Math.floor(entity.z));
        let end = new PathNode(Math.floor(x), Math.floor(y), Math.floor(z));
        
        let openSet = [];
        let closedSet = new Set();
        let openMap = new Map();

        openSet.push(start);
        openMap.set(start.key(), start);

        let count = 0;
        let maxIterations = 2000; 
        
        // Ensure destination is within reasonable bounds of the entity's pathing range
        const dx = Math.abs(start.x - end.x);
        const dz = Math.abs(start.z - end.z);
        if (dx > range || dz > range) {
            // If target is too far, pick a point in the target direction that is within range
            const angle = Math.atan2(end.z - start.z, end.x - start.x);
            end.x = start.x + Math.round(Math.cos(angle) * range);
            end.z = start.z + Math.round(Math.sin(angle) * range);
            end.y = this.world.getHighestBlockAt(end.x, end.z);
        }

        while (openSet.length > 0 && count++ < maxIterations) {
            // Sort by priority (lowest f)
            openSet.sort((a, b) => a.priority - b.priority);
            let current = openSet.shift();
            openMap.delete(current.key());
            
            // Reached destination (approximate)
            if (current.distanceToTarget < 1.5) {
                return this.reconstructPath(current);
            }
            
            closedSet.add(current.key());
            
            let neighbors = this.getNeighbors(entity, current);
            for (let neighbor of neighbors) {
                if (closedSet.has(neighbor.key())) continue;
                
                let g = current.totalPathDistance + 1;
                
                let existing = openMap.get(neighbor.key());
                if (!existing || g < existing.totalPathDistance) {
                    neighbor.totalPathDistance = g;
                    // Use Euclidean distance for better heuristic
                    neighbor.distanceToTarget = Math.sqrt((neighbor.x - end.x)**2 + (neighbor.y - end.y)**2 + (neighbor.z - end.z)**2);
                    neighbor.priority = neighbor.totalPathDistance + neighbor.distanceToTarget;
                    neighbor.parent = current;
                    
                    if (!existing) {
                        openSet.push(neighbor);
                        openMap.set(neighbor.key(), neighbor);
                    }
                }
            }
        }
        return null; // No path found
    }
    
    getNeighbors(entity, node) {
        let neighbors = [];
        const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
        
        for (let d of dirs) {
            let nx = node.x + d[0];
            let nz = node.z + d[1];
            
            // 1. Walk straight (same level)
            if (this.isSafe(nx, node.y, nz)) {
                neighbors.push(new PathNode(nx, node.y, nz));
            } 
            // 2. Jump up (step up 1 block)
            // Check if target spot (nx, node.y+1, nz) is safe AND check if there is headroom to jump at current pos
            else if (this.isSafe(nx, node.y + 1, nz) && this.checkHeadroom(node.x, node.y, node.z)) {
                neighbors.push(new PathNode(nx, node.y + 1, nz));
            }
            // 3. Drop down (1 block)
            else if (this.isSafe(nx, node.y - 1, nz)) {
                neighbors.push(new PathNode(nx, node.y - 1, nz));
            }
            // 4. Drop down (2 blocks) - optional for better drops
            else if (this.isSafe(nx, node.y - 2, nz)) {
                neighbors.push(new PathNode(nx, node.y - 2, nz));
            }
        }
        return neighbors;
    }

    checkHeadroom(x, y, z) {
        // Check 2 blocks above current position for jumping clearance (y+2)
        // We need space to move head up into y+2 during jump
        let b = this.world.getBlockAt(x, y + 2, z);
        if (b !== 0) {
            let block = Block.getById(b);
            if (block && block.getCollisionBoundingBox(this.world, x, y + 2, z) !== null) return false;
        }
        return true;
    }

    isSafe(x, y, z) {
        // 1. Check obstruction at body level (y)
        let b1 = this.world.getBlockAt(x, y, z);
        if (b1 !== 0) {
            let block = Block.getById(b1);
            if (block && block.getCollisionBoundingBox(this.world, x, y, z) !== null) return false;
        }
        
        // 2. Check obstruction at head level (y+1)
        let b2 = this.world.getBlockAt(x, y + 1, z);
        if (b2 !== 0) {
            let block = Block.getById(b2);
            if (block && block.getCollisionBoundingBox(this.world, x, y + 1, z) !== null) return false;
        }
        
        // 3. Check floor (y-1) must be solid
        let ground = this.world.getBlockAt(x, y - 1, z);
        if (ground === 0) return false; // Air below -> unsafe (fall)
        
        let groundBlock = Block.getById(ground);
        // Must have collision to stand on
        if (!groundBlock || groundBlock.getCollisionBoundingBox(this.world, x, y - 1, z) === null) {
            return false; // Avoid non-solid floor (flowers, liquids, etc)
        }
        
        // Avoid walking on fences/walls as they are treated as 1.5 height for collision
        if (groundBlock.getRenderType() === 17 || groundBlock.getRenderType() === 18) return false;

        return true;
    }

    reconstructPath(node) {
        let path = [];
        let current = node;
        while (current) {
            path.push({x: current.x + 0.5, y: current.y, z: current.z + 0.5});
            current = current.parent;
        }
        return path.reverse();
    }
}