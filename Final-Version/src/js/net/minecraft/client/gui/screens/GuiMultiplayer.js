import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";

export default class GuiMultiplayer extends GuiScreen {

    constructor(previousScreen, linkedCode='', autoJoin=false) {
        super();
        this.previousScreen = previousScreen;
        this.linkedCode=linkedCode;
        this.autoJoin=autoJoin;
    }

    init() {
        super.init();

        let y = this.height / 2 - 70;

        // Username Input
        this.fieldUsername = new GuiTextField(this.width / 2 - 100, y, 200, 20);
        this.fieldUsername.maxLength = 16;
        this.fieldUsername.text = this.minecraft.settings.username;
        this.buttonList.push(this.fieldUsername);

        // LAN Code Input
        this.fieldCode = new GuiTextField(this.width / 2 - 100, y + 40, 200, 20);
        this.fieldCode.maxLength = 10;
        this.fieldCode.text = this.linkedCode || "";
        this.fieldCode.isFocused = true;
        this.buttonList.push(this.fieldCode);

        // Join Button
        this.btnJoin = new GuiButton("Join", this.width / 2 - 100, y + 64, 200, 20, () => {
            if (this.joining) return;
            const code = this.fieldCode.getText().trim();
            const user = this.fieldUsername.getText().trim();
            
            if (user.length > 0) {
                this.minecraft.settings.username = user;
                this.minecraft.settings.save();
                if (this.minecraft.player) this.minecraft.player.username = user;
            }

            if (code.length > 0) {
                this.joining = true;
                this.errorMessage = "";
                this.btnJoin.string = "Requesting...";
                this.btnJoin.setEnabled(false);
                this.fieldCode.setEnabled(false);
                this.fieldUsername.setEnabled(false);

                this.minecraft.multiplayer.join(code).catch(error => {
                    console.error("LAN join failed:", error);
                    this.joining = false;
                    this.btnJoin.string = "Join";
                    this.btnJoin.setEnabled(true);
                    this.fieldCode.setEnabled(true);
                    this.fieldUsername.setEnabled(true);
                    this.errorMessage = "Could not connect to that LAN game.";
                });
            } else {
                this.errorMessage = "Enter a LAN code first.";
            }
        });
        this.buttonList.push(this.btnJoin);

        // Cancel
        this.buttonList.push(new GuiButton("Cancel", this.width / 2 - 100, y + 100, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
        
        // Show virtual keyboard on mobile
        if (this.minecraft.window.isMobile) {
            this.minecraft.window.showVirtualKeyboard("");
        }
        if(this.autoJoin&&this.linkedCode){this.autoJoin=false;setTimeout(()=>this.btnJoin?.onPress(),0);}
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Join LAN Game", this.width / 2, 20);
        
        this.drawString(stack, "Username:", this.width / 2 - 100, this.height / 2 - 82, 0xA0A0A0);
        this.drawString(stack, "Enter LAN Code:", this.width / 2 - 100, this.height / 2 - 42, 0xA0A0A0);
        if (this.errorMessage) {
            this.drawCenteredString(stack, this.errorMessage, this.width / 2, this.height / 2 + 135, 0xFF5555);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
    
    keyTyped(key, character) {
        if (key === "Enter") {
            this.btnJoin.onPress();
            return true;
        }
        return super.keyTyped(key, character);
    }
    
    onClose() {
        if (this.minecraft.window.isMobile) {
            this.minecraft.window.hideVirtualKeyboard();
        }
    }
}

