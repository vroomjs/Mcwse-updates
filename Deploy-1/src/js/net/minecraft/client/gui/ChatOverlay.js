import Gui from "./Gui.js";
import ChatLine from "../../util/ChatLine.js";
import GuiChat from "./screens/GuiChat.js";
import MathHelper from "../../util/MathHelper.js";

export default class ChatOverlay extends Gui {

    constructor(minecraft) {
        super(minecraft);

        this.messages = [];
        this.sentHistory = [];
        
        // Palette from ChatSettings
        this.colors = [
            0xFFFFFF, // White
            0xFF5555, // Red
            0x55FF55, // Green
            0x5555FF, // Blue
            0xFFFF55, // Yellow
            0x55FFFF, // Aqua
            0xFF55FF, // Pink
            0xAAAAAA  // Gray
        ];
    }

    render(stack, mouseX, mouseY, partialTicks) {
        let chatOpen = this.minecraft.currentScreen instanceof GuiChat;
        const s = this.minecraft.settings;

        // Limit visible messages to prevent rendering off-screen
        let count = 0;
        
        // Apply scaling
        stack.save();
        let scale = 1.0; // Force scale to 1.0 as requested
        // Scale from bottom-left corner
        stack.translate(0, this.minecraft.window.height * (1 - scale), 0); // Keep bottom anchor?
        // Actually, just scaling the context is easier, but position needs adjustment.
        // Let's just scale everything and adjust Y coord logic.
        // Or simplified: translate up/down based on scale to keep input bar relative position?
        // Simplest: Just scale 2D context.
        stack.scale(scale, scale);
        
        // Adjust height for scale so messages stack up correctly relative to screen bottom
        let scaledHeight = this.minecraft.window.height / scale;

        for (let i = 0; i < this.messages.length && count < 20; i++) {
            let message = this.messages[i];
            
            // Fade logic based on seconds (default 6s)
            let fadeSeconds = s.chatFadeSpeed || 6.0;
            let maxAge = fadeSeconds * 20; // 20 ticks per second
            
            if (message.updateCounter >= maxAge && !chatOpen) { 
                continue;
            }

            let opacity = MathHelper.clamp((1.0 - message.updateCounter / maxAge) * 10, 0.0, 1.0);
            let baseAlpha = Math.floor(255 * opacity * opacity);
            if (chatOpen) {
                baseAlpha = 255;
            }

            if (baseAlpha > 0) {
                // Background opacity setting
                let bgAlpha = (baseAlpha / 255) * (s.chatOpacity !== undefined ? s.chatOpacity : 0.5);
                
                // Text opacity setting
                let textOpacityScale = (s.chatTextOpacity !== undefined ? s.chatTextOpacity : 1.0);
                let textAlpha = Math.floor(baseAlpha * textOpacityScale);

                // Shift down slightly to be closer to hotbar/input
                let y = scaledHeight - 30 - i * 9;

                this.drawRect(stack, 2, y - 1, 2 + 320, y + 8, '#000000', bgAlpha);
                
                // Parse Name vs Message for colors
                let text = message.message;
                let nameColor = this.colors[s.chatNameColor] || 0xFFFFFF;
                let msgColor = this.colors[s.chatMessageColor] || 0xFFFFFF;
                
                // Check for "<Name> Message" format
                // Try to split on "> " first
                let splitIdx = text.indexOf("> ");
                if (splitIdx !== -1) {
                    let namePart = text.substring(0, splitIdx + 2); // "<Name> "
                    let msgPart = text.substring(splitIdx + 2);
                    
                    let alphaBits = (textAlpha << 24);
                    
                    this.drawString(stack, namePart, 2, y, nameColor + alphaBits);
                    this.drawString(stack, msgPart, 2 + this.getStringWidth(stack, namePart), y, msgColor + alphaBits);
                } else {
                    // Fallback full string
                    this.drawString(stack, text, 2, y, msgColor + (textAlpha << 24));
                }
            }
            count++;
        }
        
        stack.restore();
    }

    onTick() {
        for (let i = 0; i < this.messages.length; i++) {
            let message = this.messages[i];
            message.updateCounter++;
        }
    }

    addMessage(message) {
        this.messages.splice(0, 0, new ChatLine(message));
    }

    addMessageToSentHistory(message) {
        this.sentHistory.splice(0, 0, message);
    }

}