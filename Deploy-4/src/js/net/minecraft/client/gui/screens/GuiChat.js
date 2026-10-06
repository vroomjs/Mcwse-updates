import GuiScreen from "../GuiScreen.js";
import GuiTextField from "../widgets/GuiTextField.js";

export default class GuiChat extends GuiScreen {

    constructor() {
        super();

        this.inputField = new GuiTextField(0, 0, 0, 0);
        this.inputField.renderBackground = false;

        this.historyIndex = -1;
    }

    init() {
        super.init();

        this.inputField.x = 2;
        this.inputField.y = this.height - 14;
        this.inputField.width = this.width - 4;
        this.inputField.height = 12;
        this.inputField.isFocused = true;

        this.buttonList.push(this.inputField);
    }

    doesGuiPauseGame() {
        return false;
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawRect(stack, 2, this.height - 14, this.width - 2, this.height - 2, '#000000', 0.5);

        // Command suggestions
        let text = this.inputField.getText();
        if (text.startsWith("/")) {
            if (this.minecraft.commandHandler) {
                let suggestions = this.minecraft.commandHandler.getSuggestions(text);
                
                if (suggestions.length > 0) {
                    let entryHeight = 12;
                    let maxVisible = 12;
                    let count = Math.min(suggestions.length, maxVisible);
                    
                    let listWidth = 240;
                    let listHeight = count * entryHeight + 4;
                    let startY = this.height - 14 - listHeight;
                    
                    // Background
                    this.drawRect(stack, 2, startY, 2 + listWidth, this.height - 14, '#000000', 0.8);
                    
                    for (let i = 0; i < count; i++) {
                        let sugg = suggestions[i];
                        let y = startY + 2 + i * entryHeight;
                        
                        // Highlight first match roughly? (Simplified for now)
                        let color = "§f";
                        this.drawString(stack, color + sugg.display, 6, y);
                        
                        if (sugg.info) {
                            let tw = this.getStringWidth(stack, sugg.display);
                            this.drawString(stack, "§8 (" + sugg.info + ")", 6 + tw, y);
                        }
                    }

                    // Show total if truncated
                    if (suggestions.length > maxVisible) {
                        this.drawString(stack, "§7... and " + (suggestions.length - maxVisible) + " more", 6, this.height - 14 - 10);
                    }
                }
            }
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    keyTyped(key, character) {
        if (key === "Tab") {
            let text = this.inputField.getText();
            if (text.startsWith("/") && this.minecraft.commandHandler) {
                let suggestions = this.minecraft.commandHandler.getSuggestions(text);
                if (suggestions.length > 0) {
                    this.inputField.text = suggestions[0].value;
                }
            }
            return;
        }

        if (key === "Enter") {
            let message = this.inputField.getText().trim();
            if (message.length === 0) {
                return;
            }

            // Close screen
            this.minecraft.displayScreen(null);

            // Add message to sent history
            if (this.minecraft.ingameOverlay && this.minecraft.ingameOverlay.chatOverlay && typeof this.minecraft.ingameOverlay.chatOverlay.addMessageToSentHistory === 'function') {
                this.minecraft.ingameOverlay.chatOverlay.addMessageToSentHistory(message);
            }

            // Handle message
            if (message.startsWith("/")) {
                // Command
                let cmd = message.substring(1);
                if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
                    this.minecraft.multiplayer.sendCommand(cmd);
                } else {
                    if (this.minecraft.commandHandler && typeof this.minecraft.commandHandler.handleMessage === 'function') {
                        this.minecraft.commandHandler.handleMessage(cmd);
                    }
                }
            } else {
                // Chat
                if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
                    this.minecraft.multiplayer.sendChat(message);
                } else {
                    if (typeof this.minecraft.addMessageToChat === 'function') {
                        // Chat format: <Username> Message
                        let username = (this.minecraft.player && this.minecraft.player.username) ? this.minecraft.player.username : "Player";
                        if (window.websim && window.websim.user && window.websim.user.username) {
                            username = window.websim.user.username;
                        }
                        this.minecraft.addMessageToChat("<" + username + "> " + message);
                    }
                }
            }
            return;
        }

        if (key === "ArrowUp" || key === "ArrowDown") {
            let up = key === "ArrowUp";
            let history = [];
            if (this.minecraft.ingameOverlay && this.minecraft.ingameOverlay.chatOverlay && Array.isArray(this.minecraft.ingameOverlay.chatOverlay.sentHistory)) {
                history = this.minecraft.ingameOverlay.chatOverlay.sentHistory;
            }

            if (up) {
                if (this.historyIndex + 1 < history.length) {
                    this.historyIndex++;
                }
            } else {
                if (this.historyIndex >= 0) {
                    this.historyIndex--;
                }
            }

            this.inputField.text = this.historyIndex < 0 ? "" : history[this.historyIndex];
            return;
        }

        return super.keyTyped(key, character);
    }

}