import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiModHowTo extends GuiScreen {
    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.mode = "main"; // main, blocks, items, structures, entities
    }

    init() {
        super.init();
        const centerX = this.width / 2;
        const startY = 32;

        if (this.mode === "main") {
            this.buttonList.push(new GuiButton("Blocks Modding", centerX - 100, startY + 20, 200, 20, () => { this.mode = "blocks"; this.init(); }));
            this.buttonList.push(new GuiButton("Items Modding", centerX - 100, startY + 44, 200, 20, () => { this.mode = "items"; this.init(); }));
            this.buttonList.push(new GuiButton("Structures Modding", centerX - 100, startY + 68, 200, 20, () => { this.mode = "structures"; this.init(); }));
            this.buttonList.push(new GuiButton("Entities Modding", centerX - 100, startY + 92, 200, 20, () => { this.mode = "entities"; this.init(); }));
            this.buttonList.push(new GuiButton("Back", centerX - 100, this.height - 30, 200, 20, () => { this.minecraft.displayScreen(this.previousScreen); }));
        } else {
            this.buttonList.push(new GuiButton("Back to Menu", centerX - 100, this.height - 30, 200, 20, () => { this.mode = "main"; this.init(); }));
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        const title = this.mode === "main" ? "How to Mod - WSE Edition" : `How to Mod: ${this.mode.charAt(0).toUpperCase() + this.mode.slice(1)}`;
        this.drawCenteredString(stack, title, this.width / 2, 10, 0xFFFF55);

        let lines = [];
        if (this.mode === "main") {
            lines = [
                "Minecraft WSE supports modding via ZIP files.",
                "Your ZIP must contain a 'mod.json' file at the root.",
                "",
                "ZIP STRUCTURE:",
                " /mod.json",
                " /textures/my_block.png",
                " /models/my_entity.gltf",
                "",
                "The game will merge your items into the Creative Menu.",
                "Select a category above to see the JSON format."
            ];
        } else if (this.mode === "blocks") {
            lines = [
                "Blocks are defined in the 'blocks' array. Toggles added:",
                " {",
                "  \"id\": 1001, \"name\": \"Ruby Block\",",
                "  \"texture\": \"ruby.png\", \"hardness\": 1.5,",
                "  \"gravity\": true,    // Falls like sand",
                "  \"light\": 15,       // Emits light (0-15)",
                "  \"damage\": 4,      // Hearts of damage when stood on",
                "  \"foliage\": true,   // Renders as a 2D cross (flowers)",
                "  \"climbable\": true, // Act as a ladder/vine",
                "  \"container\": true, // Opens a 27-slot chest menu",
                "  \"containerName\": \"Vault\", // Custom menu title",
                "  \"textures\": {     // Multi-texture support",
                "    \"top\": \"top.png\", \"bottom\": \"bot.png\", \"side\": \"side.png\"",
                "  }",
                " }"
            ];
        } else if (this.mode === "items") {
            lines = [
                "Items are defined in the 'items' array:",
                " {",
                "  \"id\": 2001, \"name\": \"Power Gem\",",
                "  \"texture\": \"gem.png\", \"stackSize\": 16,",
                "  \"damage\": 8,       // Attack damage for weapons",
                "  \"durability\": 500, // Uses before breaking",
                "  \"food\": true,      // Make the item edible",
                "  \"hunger\": 10,      // Hunger points restored",
                "  \"throwable\": true, // Right-click to throw",
                "  \"onThrow\": \"explode\" // 'explode', 'teleport', 'fire',",
                "                         // 'lightning', or a '/command'",
                " }"
            ];
        } else if (this.mode === "structures") {
            lines = [
                "Structures generate during world creation:",
                " {",
                "  \"name\": \"Ruined Portal\",",
                "  \"spawnChance\": 2,      // % chance per chunk",
                "  \"biomes\": [\"plains\", \"desert\"], // Biomes to spawn in",
                "  \"data\": { ... }        // Full JSON data captured from a",
                "                           // Structure Block 'EXPORT' button.",
                " }",
                "Structures can overlap and overwrite existing terrain."
            ];
        } else if (this.mode === "entities") {
            lines = [
                "Entities support GLTF/GLB models with animations:",
                " {",
                "  \"id\": \"ghost\", \"model\": \"ghost.glb\",",
                "  \"aiType\": \"hostile\", // hostile, passive, neutral, stalker",
                "  \"health\": 40, \"damage\": 5, \"speed\": 0.12,",
                "  \"width\": 0.6, \"height\": 1.8,",
                "  \"drops\": [",
                "    { \"id\": \"diamond\", \"chance\": 0.05, \"min\": 1, \"max\": 1 }",
                "  ]",
                " }",
                "AI TYPES:",
                " - hostile: Attacks players on sight.",
                " - passive: Wanders randomly, flees if hit.",
                " - neutral: Passive until hit, then becomes hostile.",
                " - stalker: Follows the player from a distance."
            ];
        }

        let y = 35;
        for (let line of lines) {
            const isCode = (line.trim().startsWith("//") || line.includes("{") || line.includes("}") || line.includes("\""));
            const color = isCode ? 0xAAAAAA : 0xFFFFFF;
            this.drawStringNoShadow(stack, line, this.width / 2 - 145, y, color);
            y += 10;
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}