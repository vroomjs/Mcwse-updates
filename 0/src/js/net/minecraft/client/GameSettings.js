export default class GameSettings {

    constructor() {
        this.crouching = 'ShiftLeft';
        this.sprinting = 'ControlLeft';
        this.togglePerspective = 'F5';
        
        this.forward = 'KeyW';
        this.back = 'KeyS';
        this.left = 'KeyA';
        this.right = 'KeyD';
        this.jump = 'Space';
        this.inventory = 'KeyE';
        this.drop = 'KeyQ';
        this.chat = 'KeyT';
        this.command = 'Slash';

        this.thirdPersonView = 0;
        this.fov = 85;
        this.viewBobbing = true;
        // Corner AO is disabled in the chunk renderer because its per-vertex
        // darkening made the whole world look muddy. Keep this setting false
        // so newly created worlds use the uniform face-lighting path.
        this.ambientOcclusion = false;
        // Version the preference so saves from before the smooth-lighting
        // toggle was restored do not re-enable the old dark corner behavior.
        this.smoothLightingPreferenceVersion = 1;
        this.brightness = 0.5; // 0 to 1.0 (0.5 is default "Moody" vs "Bright")
        this.sensitivity = 100;
        this.viewDistance = 3;
        this.chunkLoad = 1; // número de chunks a carregar / opção "Carregar Chunks" (1-100)
        
        // Performance Tuning
        this.maxLightUpdatesPerFrame = 500;  // Throttled to prevent driver timeout
        this.lightUpdateBudgetMs = 6;        // Lowered time budget for lighting
        this.chunkRebuildBudgetMs = 1.5;     // Lowered time budget for geometry
        this.maxLightQueueSize = 15000;      // More aggressive cleanup of stale light tasks

        this.vrEnabled = false;

        this.difficulty = 2; // 0: Peaceful, 1: Easy, 2: Normal, 3: Hard
        this.splitscreenMode = 'vertical'; // 'vertical' (top-bottom) or 'horizontal' (side-by-side)
        this.skin = "../../steve (1).png";
        this.fogDensity = 0.2; // Default moderate fog
        this.optimizedLeaves = true;
        this.particles = 1; // 0: Minimal, 1: Normal, 2: Extra
        this.wavingFoliage = false;
        this.realisticWater = false;
        this.realisticClouds = false;
        this.activeResourcePack = null;
        this.foliageColorMode = 'base';
        this.foliageColorIntensity = 100;

        // New: low quality texture mode to improve performance (false = normal, true = low)
        this.lowQualityTextures = false;
        // New: resolution scaling (0.25 to 1.0)
        this.resolutionScale = 1.0;
        // New: remember first-run choice
        this.textureChoiceMade = false;

        this.username = "Player";

        this.cheatsEnabled = false;
        this.showDayCounter = false;

        // 0: 1m, 1: 5m, 2: 10m, 3: 30m, 4: Off
        this.autosaveInterval = 1;

        // Music
        this.musicDelay = 1.0; // Minutes between tracks
        this.enabledMusic = {
            "Blind Spots": true,
            "Wet Hands": true,
            "Haggstrom": true,
            "Moog City": true,
            "Subwoofer Lullaby": true,
            "Sweden": true,
            "Minecraft": true
        };

        // Visuals
        this.bilinearFiltering = false;

        // Accessibility & Chat Settings
        this.fpsCap = 130; // 130 = Unlimited
        this.soundVolume = 1.0;
        this.threeDAudio = true;
        this.musicVolume = 1.0;
        this.mobVolume = 1.0;
        this.sfxVolume = 1.0;
        this.chatOpacity = 0.5; // Default background opacity
        this.chatTextOpacity = 1.0; // Default text opacity
        this.chatFadeSpeed = 6.0; // Default 6 seconds
        this.chatScale = 1.0;
        this.chatNameColor = 0; // 0=Default (White/Team)
        this.chatMessageColor = 0; // 0=Default (White)
        this.highContrast = false; // Fake setting for now
        this.textBackground = true; // Fake setting for now

        // Debug Info Toggles
        this.showCoordinates = true;
        this.showFPS = true;
        this.showLightUpdates = true;
        this.showChunkBorders = false;
        this.showEntityHitboxes = false;

        // Controller Settings
        this.controllerDeadzone = 0.15;
        this.controllerInvertY = false;
        this.controllerCursorSpeed = 6.0;
        this.controllerBinds = {
            "jump": 0,          // A / Cross
            "inventory": 3,     // Y / Triangle
            "drop": 12,         // Dpad Up
            "perspective": 8,   // Back / Share
            "next_item": 5,     // RB / R1
            "prev_item": 4,     // LB / L1
            "mine": 7,          // RT / R2
            "place": 6,         // LT / L2
            "menu": 9,          // Start / Options
            "menu2": 3,         // Y / Triangle
            "chat": 13,         // Dpad Down
            "sneak": 1,         // B / Circle
            "sprint": 10        // LS Click
        };
    }

    load() {
        const stored = localStorage.getItem('mc_wse_settings');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const hasCurrentSmoothLightingPreference =
                    data.smoothLightingPreferenceVersion === 1;
                for (let prop in data) {
                    this[prop] = data[prop];
                }
                if (!hasCurrentSmoothLightingPreference) {
                    this.ambientOcclusion = false;
                }
            } catch (e) {
                console.warn("Failed to parse local settings:", e);
            }
        }
    }

    save() {
        try {
            const data = {};
            for (let prop in this) {
                if (typeof this[prop] !== 'function') {
                    data[prop] = this[prop];
                }
            }
            localStorage.setItem('mc_wse_settings', JSON.stringify(data));
        } catch (e) {
            console.warn("Failed to save settings to localStorage:", e);
        }
    }

    reset() {
        const defaults = new GameSettings();
        for (let prop in defaults) {
            if (typeof defaults[prop] !== 'function') {
                this[prop] = defaults[prop];
            }
        }
        this.save();
    }

}
