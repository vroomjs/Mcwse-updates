import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import MathHelper from "../../../util/MathHelper.js";

export default class GuiStats extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.scrollY = 0;
        this.itemHeight = 12;
    }

    init() {
        super.init();

        const centerX = this.width / 2;
        
        // Done button at bottom center
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 30, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));

        this.updateStatsList();
    }

    updateStatsList() {
        const s = this.minecraft.stats;
        
        // Format time played (ticks to readable string)
        const totalSeconds = Math.floor(s.timePlayed / 20);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const timeStr = `${hours}h ${minutes}m ${seconds}s`;

        // Format distance (meters to km if needed)
        let distStr = Math.floor(s.distanceWalked) + " m";
        if (s.distanceWalked >= 1000) {
            distStr = (s.distanceWalked / 1000).toFixed(2) + " km";
        }

        this.displayList = [
            { label: "General Statistics", color: 0xFFFF55, isHeader: true },
            { label: "Time Played:", value: timeStr },
            { label: "Distance Walked:", value: distStr },
            { label: "Jumps:", value: s.jumps },
            { label: "Deaths:", value: s.deaths },
            { label: "", isSpacer: true },
            { label: "Action Statistics", color: 0xFFFF55, isHeader: true },
            { label: "Blocks Broken:", value: s.blocksBroken },
            { label: "Ores Mined:", value: s.oresBroken },
            { label: "Items Crafted:", value: s.itemsCrafted },
            { label: "Items Smelted:", value: s.itemsSmelted },
            { label: "Fish Caught:", value: s.fishCaught },
            { label: "Villagers Traded:", value: s.villagersTraded },
            { label: "Animals Bred:", value: s.animalsBred },
            { label: "Mobs Killed:", value: s.mobsKilled }
        ];

        this.totalListHeight = this.displayList.length * this.itemHeight;
    }

    handleMouseScroll(delta) {
        const listTop = 40;
        const listBottom = this.height - 40;
        const viewH = listBottom - listTop;
        const maxScroll = Math.max(0, this.totalListHeight - viewH);
        
        this.scrollY = MathHelper.clamp(this.scrollY + delta * 20, 0, maxScroll);
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Statistics", this.width / 2, 15);

        const listTop = 40;
        const listBottom = this.height - 40;
        const listX = this.width / 2 - 120;
        const listW = 240;

        stack.save();
        stack.beginPath();
        stack.rect(listX, listTop, listW, listBottom - listTop);
        stack.clip();

        for (let i = 0; i < this.displayList.length; i++) {
            const item = this.displayList[i];
            const y = listTop + i * this.itemHeight - this.scrollY;

            if (y + this.itemHeight < listTop || y > listBottom) continue;

            if (item.isHeader) {
                this.drawString(stack, item.label, listX, y, item.color);
            } else if (!item.isSpacer) {
                this.drawString(stack, item.label, listX + 10, y, 0xAAAAAA);
                this.drawRightString(stack, String(item.value), listX + listW, y, 0xFFFFFF);
            }
        }

        stack.restore();

        // Draw scrollbar if content exceeds view
        const viewH = listBottom - listTop;
        if (this.totalListHeight > viewH) {
            const scrollBarX = listX + listW + 10;
            const scrollBarH = viewH;
            const thumbH = Math.max(10, (viewH / this.totalListHeight) * scrollBarH);
            const thumbY = listTop + (this.scrollY / (this.totalListHeight - viewH)) * (scrollBarH - thumbH);

            this.drawRect(stack, scrollBarX, listTop, scrollBarX + 4, listBottom, "rgba(0,0,0,0.5)");
            this.drawRect(stack, scrollBarX, thumbY, scrollBarX + 4, thumbY + thumbH, "#808080");
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}