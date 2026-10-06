export default class GrassColorizer {

    constructor(minecraft) {
        this.texture = minecraft.resources["misc/grasscolor.png"];

        this.bitMap = this.createBitMap(this.texture);
    }

    getColor(temperature, humidity) {
        if (!this.bitMap) return 0x7cbd6b;

        // Clamp to 0..1 range
        temperature = Math.max(0, Math.min(1, temperature));
        humidity = Math.max(0, Math.min(1, humidity));
        
        // Classic grass color lookup logic
        let x = Math.floor((1.0 - temperature) * 255);
        let y = Math.floor((1.0 - temperature * humidity) * 255);
        
        // Correct coords for typical 256x256 grasscolor.png
        let i = (y * 256 + x) * 4;
        
        // Out of bounds check
        if (i < 0 || i >= this.bitMap.length - 2) return 0x7cbd6b;

        const r = this.bitMap[i];
        const g = this.bitMap[i + 1];
        const b = this.bitMap[i + 2];

        // Return as HEX
        return (r << 16) | (g << 8) | b;
    }

    createBitMap(img) {
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        return canvas.getContext('2d').getImageData(0, 0, img.width, img.height).data;
    }

}