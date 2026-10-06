import NoiseGenerator from "../NoiseGenerator.js";
import NoiseGeneratorPerlin from "./NoiseGeneratorPerlin.js";

export default class NoiseGeneratorOctaves extends NoiseGenerator {

    constructor(random, octaves) {
        super();

        this.octaves = octaves;
        this.generatorCollection = [];

        for (let i = 0; i < octaves; i++) {
            this.generatorCollection[i] = new NoiseGeneratorPerlin(random);
        }
    }

    perlin(x, z, strengthX = 1.0, strengthZ = 1.0) {
        let total = 0.0;
        let frequency = 1.0;
        for (let i = 0; i < this.octaves; i++) {
            // Match the scaling and amplitude logic from the optimized 'combined' method
            total += this.generatorCollection[i].perlinXYZ(x * strengthX * frequency, 0, z * strengthZ * frequency) / frequency;
            frequency /= 2.0;
        }
        return total;
    }

    generateNoiseOctaves(x1, y1, z1, x2, y2, z2, strengthX, strengthY, strengthZ) {
        let length = x2 * y2 * z2;
        let noise = [];
        for (let i = 0; i < length; i++) {
            noise[i] = 0;
        }

        let frequency = 1.0;
        for (let i = 0; i < this.octaves; i++) {
            this.generatorCollection[i].combined(
                noise,
                x1, y1, z1,
                x2, y2, z2,
                strengthX * frequency,
                strengthY * frequency,
                strengthZ * frequency,
                frequency
            );
            frequency /= 2;
        }

        return noise;
    }

}