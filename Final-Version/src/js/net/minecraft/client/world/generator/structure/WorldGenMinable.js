import { BlockRegistry } from "../../block/BlockRegistry.js";
import MathHelper from "../../../../util/MathHelper.js";

export default class WorldGenMinable {
    constructor(minableBlockId) {
        this.minableBlockId = minableBlockId;
    }

    generate(world, random, x, y, z) {
        let f = random.nextFloat() * Math.PI;
        let d = x + 8 + Math.sin(f) * 2.0;
        let d1 = x + 8 - Math.sin(f) * 2.0;
        let d2 = z + 8 + Math.cos(f) * 2.0;
        let d3 = z + 8 - Math.cos(f) * 2.0;
        let d4 = y + random.nextInt(3) + 2;
        let d5 = y + random.nextInt(3) + 2;

        const stoneId = BlockRegistry.STONE.getId();

        for (let i = 0; i <= 16; i++) {
            let d6 = d + (d1 - d) * i / 16.0;
            let d7 = d4 + (d5 - d4) * i / 16.0;
            let d8 = d2 + (d3 - d2) * i / 16.0;
            let d9 = random.nextDouble();
            let d10 = (Math.sin(i * Math.PI / 16.0) + 1.0) * d9 + 1.0;
            let d11 = (Math.sin(i * Math.PI / 16.0) + 1.0) * d9 + 1.0;

            let j = Math.floor(d6 - d10 / 2.0);
            let k = Math.floor(d7 - d11 / 2.0);
            let l = Math.floor(d8 - d10 / 2.0);
            let m = Math.floor(d6 + d10 / 2.0);
            let n = Math.floor(d7 + d11 / 2.0);
            let o = Math.floor(d8 + d10 / 2.0);

            for (let x1 = j; x1 <= m; x1++) {
                let d12 = (x1 + 0.5 - d6) / (d10 / 2.0);
                if (d12 * d12 >= 1.0) continue;

                for (let y1 = k; y1 <= n; y1++) {
                    let d13 = (y1 + 0.5 - d7) / (d11 / 2.0);
                    if (d12 * d12 + d13 * d13 >= 1.0) continue;

                    for (let z1 = l; z1 <= o; z1++) {
                        let d14 = (z1 + 0.5 - d8) / (d10 / 2.0);
                        if (d12 * d12 + d13 * d13 + d14 * d14 < 1.0 && world.getBlockAt(x1, y1, z1) === stoneId) {
                            world.setBlockAt(x1, y1, z1, this.minableBlockId, 0, true);
                        }
                    }
                }
            }
        }
        return true;
    }
}