import Block from "../world/block/Block.js";
import * as THREE from "three";

// The original sound list mixed several one-off uploads with broken relative
// paths. Keep the game audio on the public Minecraft asset mirror so every
// browser gets the same CORS-enabled files.
const MINECRAFT_SOUND_BASE = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds";
const minecraftSound = (path) => `${MINECRAFT_SOUND_BASE}/${path}`;

export default class SoundManager {

    static SOUND_DATA = {
        // Footsteps (Walking Only)
        "step.grass": [
            minecraftSound("step/grass1.ogg"),
            minecraftSound("step/grass2.ogg"),
            minecraftSound("step/grass3.ogg"),
            minecraftSound("step/grass4.ogg")
        ],
        "step.stone": [
            minecraftSound("step/stone1.ogg"),
            minecraftSound("step/stone2.ogg"),
            minecraftSound("step/stone3.ogg"),
            minecraftSound("step/stone4.ogg")
        ],
        "step.wood": [
            minecraftSound("step/wood1.ogg"),
            minecraftSound("step/wood2.ogg"),
            minecraftSound("step/wood3.ogg"),
            minecraftSound("step/wood4.ogg")
        ],
        "step.gravel": [
            minecraftSound("step/gravel1.ogg"),
            minecraftSound("step/gravel2.ogg"),
            minecraftSound("step/gravel3.ogg"),
            minecraftSound("step/gravel4.ogg")
        ],
        "step.sand": [
            minecraftSound("step/sand1.ogg"),
            minecraftSound("step/sand2.ogg"),
            minecraftSound("step/sand3.ogg"),
            minecraftSound("step/sand4.ogg")
        ],
        "step.snow": [
            minecraftSound("step/snow1.ogg"),
            minecraftSound("step/snow2.ogg"),
            minecraftSound("step/snow3.ogg"),
            minecraftSound("step/snow4.ogg")
        ],
        "step.cloth": [
            minecraftSound("step/cloth1.ogg"),
            minecraftSound("step/cloth2.ogg"),
            minecraftSound("step/cloth3.ogg"),
            minecraftSound("step/cloth4.ogg")
        ],
        // 1.12.2 has no separate stone types; use the valid stone steps.
        "step.granite": [
            minecraftSound("step/stone1.ogg"),
            minecraftSound("step/stone2.ogg"),
            minecraftSound("step/stone3.ogg"),
            minecraftSound("step/stone4.ogg")
        ],
        "step.diorite": [
            minecraftSound("step/stone1.ogg"),
            minecraftSound("step/stone2.ogg"),
            minecraftSound("step/stone3.ogg"),
            minecraftSound("step/stone4.ogg")
        ],
        "step.andesite": [
            minecraftSound("step/stone1.ogg"),
            minecraftSound("step/stone2.ogg"),
            minecraftSound("step/stone3.ogg"),
            minecraftSound("step/stone4.ogg")
        ],

        // Break sounds (Non-walking)
        "break.wood": [
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/wood1.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/wood2.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/wood3.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/wood4.ogg"
        ],
        "break.stone": [
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/stone1.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/stone2.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/stone3.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/stone4.ogg"
        ],
        "break.gravel": [
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/gravel1.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/gravel2.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/gravel3.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/gravel4.ogg"
        ],
        "break.grass": [
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/grass1.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/grass2.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/grass3.ogg",
            "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2/assets/minecraft/sounds/dig/grass4.ogg"
        ],
        "break.granite": [
            minecraftSound("dig/stone1.ogg"),
            minecraftSound("dig/stone2.ogg"),
            minecraftSound("dig/stone3.ogg"),
            minecraftSound("dig/stone4.ogg")
        ],
        "break.diorite": [
            minecraftSound("dig/stone1.ogg"),
            minecraftSound("dig/stone2.ogg"),
            minecraftSound("dig/stone3.ogg"),
            minecraftSound("dig/stone4.ogg")
        ],
        "break.andesite": [
            minecraftSound("dig/stone1.ogg"),
            minecraftSound("dig/stone2.ogg"),
            minecraftSound("dig/stone3.ogg"),
            minecraftSound("dig/stone4.ogg")
        ],
        "block.glass.break": ["https://files.catbox.moe/8lbkbr.ogg"],

        // Player/Entity Actions
        "random.eat": ["https://files.catbox.moe/1ttyoa.ogg", "https://files.catbox.moe/cj06h4.ogg", "https://files.catbox.moe/o02gwo.ogg"],
        "random.hit": ["https://files.catbox.moe/o6864w.ogg", "https://files.catbox.moe/56aorm.ogg", "https://files.catbox.moe/yc4ism.ogg"],
        "random.fall.small": ["https://files.catbox.moe/8p28to.ogg"],
        "random.fall.big": ["https://files.catbox.moe/rlq8qo.ogg"],
        "random.break_tool": ["https://files.catbox.moe/tmnqzr.ogg"],
        "random.explode": ["https://files.catbox.moe/pq0igw.ogg", "https://files.catbox.moe/bb14va.ogg"],
        
        // Interactions
        "crop.break": ["https://files.catbox.moe/mr95n1.ogg", "https://files.catbox.moe/cghc4r.ogg", "https://files.catbox.moe/s9o1pd.ogg"],
        "hoe.till": ["https://files.catbox.moe/edzsyr.ogg", "https://files.catbox.moe/lyzd05.ogg"],
        "item.bonemeal": ["https://files.catbox.moe/l4f09o.ogg"],
        "bucket.fill_water": ["https://files.catbox.moe/egop5b.ogg"],
        "bucket.fill_lava": ["https://files.catbox.moe/5audft.ogg"],
        "bucket.empty": ["https://files.catbox.moe/tsbw2y.ogg"],
        "armor.equip_iron": ["https://files.catbox.moe/saoahc.ogg"],
        "armor.equip_gold": ["https://files.catbox.moe/aqlvay.ogg"],
        "armor.equip_diamond": ["https://files.catbox.moe/ycwmhd.ogg"],
        "door.open": ["https://files.catbox.moe/ymqnaw.ogg"],
        "door.close": ["https://files.catbox.moe/psf4il.ogg"],
        "chest.open": ["https://files.catbox.moe/z3dq74.ogg"],
        "chest.close": ["https://files.catbox.moe/gqrolb.ogg"],
        "random.click": ["https://files.catbox.moe/gu6j81.ogg"],
        "random.pop": ["https://files.catbox.moe/9hyb58.ogg"],
        "random.hurt": ["https://files.catbox.moe/o6864w.ogg", "https://files.catbox.moe/56aorm.ogg", "https://files.catbox.moe/yc4ism.ogg"],
        "fire.ignite": ["https://esm.sh/minecraft-assets/data/1.12.2/assets/minecraft/sounds/fire/ignite.ogg"],
        "random.fizz": ["https://esm.sh/minecraft-assets/data/1.12.2/assets/minecraft/sounds/random/fizz.ogg"],
        "random.levelup": ["https://esm.sh/minecraft-assets/data/1.12.2/assets/minecraft/sounds/random/levelup.ogg"],
        "random.bow": ["https://files.catbox.moe/4uqmdk.ogg"],
        "random.shoot": ["https://files.catbox.moe/16oc4o.ogg", "https://files.catbox.moe/i7jma0.ogg", "https://files.catbox.moe/may766.ogg"],
        "random.bowhit": ["https://files.catbox.moe/7gcgns.ogg", "https://files.catbox.moe/4iftd4.ogg", "https://files.catbox.moe/yb1wuw", "https://files.catbox.moe/s7ond2.ogg"],
        "random.break_tool": ["https://files.catbox.moe/tmnqzr.ogg"],

        // New Explosive/Liquid/Minecart sounds
        "random.fuse": ["https://files.catbox.moe/3df2ok.ogg"],
        "random.splash": ["https://files.catbox.moe/d2ljrc.ogg", "https://files.catbox.moe/wgdcy5.ogg"],
        "random.splash_heavy": ["https://files.catbox.moe/je5qoi.ogg"],
        "liquid.water": ["https://files.catbox.moe/k5tpdj.ogg"],
        "liquid.lava": ["https://files.catbox.moe/emgytv.ogg"],
        "minecart.inside": ["https://files.catbox.moe/juaupg.ogg"],
        "minecart.base": ["https://files.catbox.moe/5m5i60.ogg"],
        "random.swim": [
            "https://files.catbox.moe/qffkdh.ogg", "https://files.catbox.moe/ilqxrv.ogg", "https://files.catbox.moe/vu231n.ogg", 
            "https://files.catbox.moe/va0hce.ogg", "https://files.catbox.moe/e8oaxb.ogg", "https://files.catbox.moe/lvwgew.ogg", 
            "https://files.catbox.moe/hzpiss.ogg", "https://files.catbox.moe/6w8ovz.ogg", "https://files.catbox.moe/k4q5y1.ogg", 
            "https://files.catbox.moe/399c0o.ogg", "https://files.catbox.moe/u9l0ky.ogg", "https://files.catbox.moe/bkqglk.ogg", 
            "https://files.catbox.moe/u4k0h9.ogg", "https://files.catbox.moe/2x1ml2.ogg", "https://files.catbox.moe/vtl1sg.ogg", 
            "https://files.catbox.moe/342d3o.ogg", "https://files.catbox.moe/a6md9u.ogg", "https://files.catbox.moe/fob75b.ogg"
        ],

        // Mob Sounds
        "mob.chicken.hurt": [minecraftSound("mob/chicken/hurt1.ogg"), minecraftSound("mob/chicken/hurt2.ogg")],
        "mob.chicken.say": [minecraftSound("mob/chicken/say1.ogg"), minecraftSound("mob/chicken/say2.ogg"), minecraftSound("mob/chicken/say3.ogg")],
        
        "mob.cow.hurt": [minecraftSound("mob/cow/hurt1.ogg"), minecraftSound("mob/cow/hurt2.ogg"), minecraftSound("mob/cow/hurt3.ogg")],
        "mob.cow.say": [minecraftSound("mob/cow/say1.ogg"), minecraftSound("mob/cow/say2.ogg"), minecraftSound("mob/cow/say3.ogg"), minecraftSound("mob/cow/say4.ogg")],
        
        "mob.pig.death": [minecraftSound("mob/pig/death.ogg")],
        "mob.pig.say": [minecraftSound("mob/pig/say1.ogg"), minecraftSound("mob/pig/say2.ogg"), minecraftSound("mob/pig/say3.ogg")],
        
        "mob.sheep.say": [minecraftSound("mob/sheep/say1.ogg"), minecraftSound("mob/sheep/say2.ogg"), minecraftSound("mob/sheep/say3.ogg")],
        "mob.sheep.shear": [minecraftSound("mob/sheep/shear.ogg")],

        // Horse
        "mob.horse.say": ["https://files.catbox.moe/ucphr6.ogg", "https://files.catbox.moe/ujffbt.ogg", "https://files.catbox.moe/8reu74.ogg"],
        "mob.horse.hurt": ["https://files.catbox.moe/a25tbx.ogg", "https://files.catbox.moe/xn6mzl.ogg", "https://files.catbox.moe/xuosy6.ogg", "https://files.catbox.moe/r46vre.ogg"],
        "mob.horse.angry": ["https://files.catbox.moe/zc5aif.ogg"],
        "mob.horse.gallop": ["https://files.catbox.moe/t6plh5.ogg", "https://files.catbox.moe/1kcwai.ogg", "https://files.catbox.moe/bszuwt.ogg", "https://files.catbox.moe/d8rcq8.ogg"],
        "mob.horse.jump": ["https://files.catbox.moe/n9o6wo.ogg"],
        "mob.horse.land": ["https://files.catbox.moe/i79hbs.ogg"],

        // Cat
        "mob.cat.say": ["https://files.catbox.moe/l9wsm7.ogg", "https://files.catbox.moe/8gnc82.ogg", "https://files.catbox.moe/el0wpz.ogg", "https://files.catbox.moe/vdxnxg.ogg"],
        "mob.cat.purr": ["https://files.catbox.moe/9k66aw.ogg", "https://files.catbox.moe/r2jv8o.ogg", "https://files.catbox.moe/hxl5tw.ogg"],
        "mob.cat.purreow": ["https://files.catbox.moe/4yjeyu.ogg", "https://files.catbox.moe/rahuda.ogg"],

        // Villager
        "mob.villager.hurt": ["https://files.catbox.moe/r281k6.ogg", "https://files.catbox.moe/v8dt6g.ogg", "https://files.catbox.moe/b47syf.ogg", "https://files.catbox.moe/ttczoq.ogg"],
        "mob.villager.say": ["https://files.catbox.moe/ijtu5u.ogg", "https://files.catbox.moe/nrzimo.ogg", "https://files.catbox.moe/abdd9v.ogg"],
        "mob.villager.haggle": ["https://files.catbox.moe/clzbd2.ogg", "https://files.catbox.moe/lvb1r0.ogg", "https://files.catbox.moe/ese31o.ogg"],
        "mob.villager.death": ["https://files.catbox.moe/ets5a6.ogg"],

        // Spider
        "mob.spider.say": ["https://files.catbox.moe/9izc8l.ogg", "https://files.catbox.moe/x0ke82.ogg", "https://files.catbox.moe/qplh6m.ogg", "https://files.catbox.moe/tz72uv.ogg"],
        "mob.spider.death": ["https://files.catbox.moe/cfunby.ogg"],

        // Zombie
        "mob.zombie.hurt": ["https://files.catbox.moe/u4jjzz.ogg", "https://files.catbox.moe/34zs5l.ogg"],
        "mob.zombie.say": ["https://files.catbox.moe/g9ouwl.ogg", "https://files.catbox.moe/yhwhho.ogg", "https://files.catbox.moe/e8a7nh.ogg"],
        "mob.zombie.death": ["https://files.catbox.moe/5emczz.ogg"],

        // Creeper
        "mob.creeper.say": ["https://files.catbox.moe/wmuikz.ogg", "https://files.catbox.moe/krmptk.ogg", "https://files.catbox.moe/o1wrlo.ogg", "https://files.catbox.moe/tapt7d.ogg"],
        "mob.creeper.death": ["https://files.catbox.moe/rqmuyk.ogg"],

        // Slime
        "mob.slime.big": ["https://files.catbox.moe/l79e3d.ogg", "https://files.catbox.moe/prap9h", "https://files.catbox.moe/eumrb7.ogg", "https://files.catbox.moe/12jir5.ogg"],
        "mob.slime.small": ["https://files.catbox.moe/42iw4z.ogg", "https://files.catbox.moe/l1cxm7.ogg", "https://files.catbox.moe/rtgwo9.ogg", "https://files.catbox.moe/2s6mlc.ogg", "https://files.catbox.moe/dljxkq.ogg"],
        "mob.slime.attack": ["https://files.catbox.moe/akrjix", "https://files.catbox.moe/mu1hft.ogg"],
        "mob.slime.death": ["https://files.catbox.moe/l46l2w.ogg"],
        "mob.enderman.death": ["https://files.catbox.moe/gk6f5y.ogg"],
        "mob.enderman.portal": ["https://files.catbox.moe/zfxlux.ogg", "https://files.catbox.moe/v3zkyo.ogg"],
        "mob.enderman.hurt": ["https://files.catbox.moe/r85n6n.ogg", "https://files.catbox.moe/15yz4j.ogg", "https://files.catbox.moe/jq9m06.ogg", "https://files.catbox.moe/b47is6.ogg"],
        "mob.enderman.say": ["https://files.catbox.moe/77m2yb.ogg", "https://files.catbox.moe/0d5hwe.ogg", "https://files.catbox.moe/vdd0sc.ogg", "https://files.catbox.moe/gfrlxx.ogg", "https://files.catbox.moe/vadg55.ogg"],
        "mob.enderman.stare": ["https://files.catbox.moe/2s7xwz.ogg", "https://files.catbox.moe/q9yjeg.ogg", "https://files.catbox.moe/0ro4nv.ogg", "https://files.catbox.moe/upfs00.ogg"],
        "instrument.harp": ["https://files.catbox.moe/i7ngrs.ogg", "https://files.catbox.moe/svmkoi.ogg"],
        "instrument.bass": ["https://files.catbox.moe/xk997b.mp3", "https://files.catbox.moe/upssrr.mp3"],
        "instrument.snare": ["https://files.catbox.moe/4fmc2f.ogg"],
        "instrument.hat": ["https://files.catbox.moe/zpf5tp.ogg"],
        "instrument.bd": ["https://files.catbox.moe/htinxa.mp3"],
        "instrument.bell": ["https://files.catbox.moe/dovlac.ogg"],
        "instrument.flute": ["https://files.catbox.moe/st8uyh.ogg"],
        "instrument.icechime": ["https://files.catbox.moe/rjqrsm.ogg"],
        "instrument.guitar": ["https://files.catbox.moe/cj7y0s.ogg"],
        "instrument.xylobone": ["https://files.catbox.moe/zz7rw2.ogg"],
        "instrument.iron_xylophone": ["https://files.catbox.moe/8uiwd8.mp3"],
        "instrument.cow_bell": ["https://files.catbox.moe/c6580d.ogg"],
        "instrument.didgeridoo": ["https://files.catbox.moe/xmvtdr.mp3"],
        "instrument.bit": ["https://files.catbox.moe/rchvn8.ogg"],
        "instrument.banjo": ["https://files.catbox.moe/cosv9x.ogg"],
        "instrument.pling": ["https://files.catbox.moe/qvjtqb.mp3"],
        "ambient.weather.thunder": ["../../thunder.mp3"],
        "crossbow.loading_start": ["https://files.catbox.moe/aaf1dz.ogg"],
        "crossbow.loading_middle": ["https://files.catbox.moe/76bzxn.ogg", "https://files.catbox.moe/zybon7.ogg", "https://files.catbox.moe/tia72u.ogg", "https://files.catbox.moe/m4nae4.ogg"],
        "crossbow.loading_end": ["https://files.catbox.moe/kvbl6y.ogg"],
        "crossbow.shoot": ["https://files.catbox.moe/16oc4o.ogg", "https://files.catbox.moe/i7jma0.ogg", "https://files.catbox.moe/may766.ogg"],
        "fire.idle": ["https://files.catbox.moe/l82h12.ogg"],
        "fire.ignite": ["https://files.catbox.moe/1obyxy.ogg"],
        "random.anvil_use": ["https://esm.sh/minecraft-assets/data/1.12.2/assets/minecraft/sounds/random/anvil_use.ogg"],
        "random.anvil_land": ["../../asset_name.mp3"],
        "block.jukebox.insert": ["../../block.jukebox.insert.mp3"],
        "music.disc.11": ["https://files.catbox.moe/n8ors6.mp3"],
        "music.disc.13": ["https://files.catbox.moe/pxl990.mp3"],
        "music.disc.blocks": ["https://files.catbox.moe/ykhjr3.mp3"],
        "music.disc.cat": ["https://files.catbox.moe/4x3m44.mp3"],
        "music.disc.chirp": ["https://files.catbox.moe/rq2k9p.mp3"],
        "music.disc.far": ["https://files.catbox.moe/hrvoli.mp3"],
        "music.disc.mall": ["https://files.catbox.moe/9enjun.mp3"],
        "music.disc.mellohi": ["https://files.catbox.moe/vrqa07.mp3"],
        "music.disc.stal": ["https://files.catbox.moe/0vt357.mp3"],
        "music.disc.strad": ["https://files.catbox.moe/st88cm.mp3"],
        "music.disc.wait": ["https://files.catbox.moe/z29mf9.mp3"],
        "music.disc.ward": ["https://files.catbox.moe/ibekqc.mp3"]
    };

    static MUSIC_TRACKS = [
        { name: "Blind Spots", url: "https://files.catbox.moe/font2r.mp3", album: "Minecraft - Volume Beta", albumArt: "/album_art/minecraft_volume_beta.jpg" },
        { name: "Wet Hands", url: "https://files.catbox.moe/3k08cu.mp3", album: "Minecraft - Volume Alpha", albumArt: "/album_art/minecraft_volume_alpha.jpg" },
        { name: "Haggstrom", url: "https://files.catbox.moe/yvdvu8.mp3", album: "Minecraft - Volume Alpha", albumArt: "/album_art/minecraft_volume_alpha.jpg" },
        { name: "Moog City", url: "https://files.catbox.moe/gskrpp.mp3", album: "Minecraft - Volume Alpha", albumArt: "/album_art/minecraft_volume_alpha.jpg" },
        { name: "Moog City 3", url: "/moog_city_3.mp3", album: "mojang, please hire me - Single", albumArt: "/album_art/mojang_please_hire_me.jpg" },
        { name: "Subwoofer Lullaby", url: "https://files.catbox.moe/e2y0nb.mp3", album: "Minecraft - Volume Alpha", albumArt: "/album_art/minecraft_volume_alpha.jpg" },
        { name: "Sweden", url: "https://files.catbox.moe/8dk8bs.mp3", album: "Minecraft - Volume Alpha", albumArt: "/album_art/minecraft_volume_alpha.jpg" },
        { name: "Minecraft", url: "https://files.catbox.moe/1plrda.mp3", album: "Minecraft - Volume Alpha", albumArt: "/album_art/minecraft_volume_alpha.jpg" }
    ];

    constructor() {
        this.audioLoader = new THREE.AudioLoader();
        this.audioListener = null;
        this.bufferCache = new Map(); // name -> AudioBuffer[]
        this.loadingGroups = new Map(); // name -> Promise<AudioBuffer[]>
        this.pendingSounds = new Map(); // name -> most recent request while loading
        this.bgm = null;
        this.voicePool = []; // Idle THREE.Audio/PositionalAudio objects
        
        // Track currently playing music discs to manage BGM muting
        this.activeDiscs = new Set();

        // Track sounds triggered in the current frame to prevent "machine gun" effects during catch-up ticks
        this.soundsPlayedThisFrame = new Set();
        this.lastFrameTime = 0;
        
        // Music loop state
        this.musicCooldown = 0;
        this.currentTrackName = null;
        this.currentTrackInfo = null;
        this.currentTrackStartedAt = null;
        this.currentTrackLyrics = [];
        this.backgroundMusicLoading = false;
        this.nowPlayingNotice = null;
        this.nowPlayingTimer = null;

        // User-uploaded music is kept in IndexedDB so real audio files do not
        // overflow localStorage. Object URLs are rebuilt on each page load.
        this.customMusicTracks = [];
        this.customMusicLoaded = false;
        this.customMusicLoading = null;
        // Uploaded songs play through an HTMLAudioElement fallback. Browsers
        // can play more user-uploaded formats this way than through WebAudio's
        // decodeAudioData path, which fixes blob tracks that showed lyrics but
        // produced no audible music.
        this.htmlBgm = null;
        this.htmlBgmVolume = 0.45;

        // Real-time music waveform analyser for the HUD. Built-in THREE.Audio
        // tracks are tapped from their gain node; uploaded HTMLAudio tracks are
        // routed through a MediaElementSource -> Analyser -> destination chain.
        this.musicAnalyserNode = null;
        this.musicAnalyserSource = null;
        this.musicAnalyserData = null;
        this.musicWaveformSmoothed = [];
        // A procedural fluorescent ballast hum replaces background music in
        // Backrooms worlds. It uses the user's normal Music volume slider.
        this.backroomsHum = null;
        this._backroomsMusicActive = false;

        // Add more categories for fallbacks
        SoundManager.SOUND_DATA["mob.creeper.fuse"] = ["https://files.catbox.moe/3df2ok.ogg"];
    }

    async create(worldRenderer) {
        if (this.audioListener) return;

        this.worldRenderer = worldRenderer;
        this.scene = worldRenderer.scene;

        // Load saved custom tracks as soon as the browser unlocks audio. The
        // promise is deliberately not awaited so the first click stays snappy.
        this.loadCustomMusicTracks().catch(error => {
            console.warn("Failed to load custom music library:", error);
        });

        this.audioListener = new THREE.AudioListener();
        worldRenderer.camera.add(this.audioListener);
        this.resumeAudioContext();

        // Make the engine usable immediately. Loading every remote sound
        // before playback made the first sounds arrive late or never play.
        // Common interaction sounds warm in the background; everything else
        // loads on demand when it is first requested.
        [
            "random.click",
            "step.grass",
            "step.stone",
            "step.wood",
            "step.gravel",
            "step.sand",
            "step.snow",
            "step.cloth",
            "step.granite",
            "step.diorite",
            "step.andesite",
            "break.grass",
            "break.stone",
            "break.wood",
            "mob.cow.say",
            "mob.cow.hurt",
            "mob.pig.say",
            "mob.pig.death"
        ].forEach(name => this.preloadSoundGroup(name));

        this.musicCooldown = 200; // Start first song in 10 seconds
    }

    async preloadSoundGroup(name) {
        const urls = SoundManager.SOUND_DATA[name];
        if (!urls) return [];
        // An empty cache can be the result of a transient network failure.
        // Remove it so the next request gets a real retry instead of silently
        // treating the group as permanently unavailable.
        if (this.bufferCache.has(name)) {
            const cached = this.bufferCache.get(name);
            if (cached.length > 0) return cached;
            this.bufferCache.delete(name);
        }
        if (this.loadingGroups.has(name)) return this.loadingGroups.get(name);

        const loadPromise = Promise.all(urls.map(url =>
            this.loadBuffer(url).catch(error => {
                console.warn(`Failed to load sound: ${url}`, error);
                return null;
            })
        )).then(buffers => {
            const loadedBuffers = buffers.filter(Boolean);
            this.bufferCache.set(name, loadedBuffers);

            const pending = this.pendingSounds.get(name);
            this.pendingSounds.delete(name);
            if (pending && loadedBuffers.length > 0) {
                this.playSound(
                    name,
                    pending.x,
                    pending.y,
                    pending.z,
                    pending.volume,
                    pending.pitch
                );
            }

            return loadedBuffers;
        }).finally(() => {
            this.loadingGroups.delete(name);
        });

        this.loadingGroups.set(name, loadPromise);
        return loadPromise;
    }

    loadBuffer(url) {
        return new Promise((resolve, reject) => {
            let settled = false;
            const finish = (callback, value) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                callback(value);
            };
            const timeout = setTimeout(() => {
                finish(reject, new Error(`Sound load timed out: ${url}`));
            }, 10000);

            this.audioLoader.load(
                url,
                buffer => finish(resolve, buffer),
                undefined,
                error => finish(reject, error)
            );
        });
    }

    onTick() {
        if (!this.isCreated() || !this.worldRenderer?.minecraft) return;

        const minecraft = this.worldRenderer.minecraft;
        const world = minecraft.world;
        const inBackrooms = !!(world && world.isBackroomsSeed && world.dimension === 0);

        // A Level 0 world deliberately has no music: the persistent, local
        // fluorescent/ballast hum is the soundtrack instead. It is generated
        // locally, so it needs no network asset and cannot fail to download.
        if (inBackrooms) {
            this._backroomsMusicActive = true;
            if (!minecraft.isPaused()) this.startBackroomsHum();
            return;
        }

        this._backroomsMusicActive = false;
        this.stopBackroomsHum();
        if (minecraft.isPaused()) return;

        const settings = minecraft.settings;

        // Normal-world music loop handler
        if (this.isBackgroundMusicPlaying() || this.backgroundMusicLoading) {
            // Song is currently playing or loading
            this.musicCooldown = Math.floor(settings.musicDelay * 60 * 20); // Reset cooldown to the delay period
        } else {
            // Waiting for next song
            if (this.musicCooldown > 0) {
                this.musicCooldown--;
            } else {
                this.playRandomTrack();
            }
        }
    }

    resumeAudioContext() {
        const context = this.audioListener?.context;
        if (!context || context.state !== "suspended") return Promise.resolve();
        return context.resume().catch(error => {
            console.warn("Failed to resume audio context:", error);
        });
    }

    isHtmlBackgroundMusicPlaying() {
        return !!(this.htmlBgm && !this.htmlBgm.paused && !this.htmlBgm.ended);
    }

    isBackgroundMusicPlaying() {
        return !!((this.bgm && this.bgm.isPlaying) || this.isHtmlBackgroundMusicPlaying());
    }

    resetBackgroundMusicState() {
        this.currentTrackName = null;
        this.currentTrackInfo = null;
        this.currentTrackStartedAt = null;
        this.currentTrackLyrics = [];
    }

    stopCurrentBackgroundMusic(fadeTime = 0.75) {
        if (this.isBackgroundMusicPlaying()) {
            this.fadeOutCurrentBackgroundMusic(fadeTime);
        } else {
            this.clearMusicAnalyser();
            this.resetBackgroundMusicState();
        }
        this.backgroundMusicLoading = false;
    }

    clearMusicAnalyser() {
        if (this.musicAnalyserSource && this.musicAnalyserNode) {
            try { this.musicAnalyserSource.disconnect(this.musicAnalyserNode); } catch (_) { /* already disconnected */ }
        }
        if (this.musicAnalyserNode) {
            try { this.musicAnalyserNode.disconnect(); } catch (_) { /* already disconnected */ }
        }
        this.musicAnalyserNode = null;
        this.musicAnalyserSource = null;
        this.musicAnalyserData = null;
        this.musicWaveformSmoothed = [];
    }

    setupMusicAnalyserForThreeAudio(audio) {
        this.clearMusicAnalyser();
        const context = audio?.context || this.audioListener?.context;
        const output = audio?.getOutput?.() || audio?.gain;
        if (!context || !output?.connect) return;

        try {
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.72;
            output.connect(analyser); // Tap only; the analyser itself is not routed to output.
            this.musicAnalyserNode = analyser;
            this.musicAnalyserSource = output;
            this.musicAnalyserData = new Uint8Array(analyser.fftSize);
        } catch (error) {
            console.warn("Failed to attach music waveform analyser:", error);
            this.clearMusicAnalyser();
        }
    }

    setupMusicAnalyserForHtmlAudio(audio) {
        this.clearMusicAnalyser();
        const context = this.audioListener?.context;
        if (!context || !audio) return;

        try {
            const source = context.createMediaElementSource(audio);
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.72;
            source.connect(analyser);
            analyser.connect(context.destination);
            this.musicAnalyserSource = source;
            this.musicAnalyserNode = analyser;
            this.musicAnalyserData = new Uint8Array(analyser.fftSize);
        } catch (error) {
            // Playback should still work even if the analyser cannot attach.
            console.warn("Failed to attach uploaded music waveform analyser:", error);
            this.clearMusicAnalyser();
        }
    }

    getMusicWaveformLevels(count = 34) {
        const analyser = this.musicAnalyserNode;
        if (!analyser || !this.isBackgroundMusicPlaying()) return null;

        if (!this.musicAnalyserData || this.musicAnalyserData.length !== analyser.fftSize) {
            this.musicAnalyserData = new Uint8Array(analyser.fftSize);
        }

        analyser.getByteTimeDomainData(this.musicAnalyserData);
        const data = this.musicAnalyserData;
        const levels = [];
        const step = Math.max(1, Math.floor(data.length / count));

        for (let i = 0; i < count; i++) {
            const start = i * step;
            const end = Math.min(data.length, start + step);
            let sum = 0;
            let peak = 0;
            for (let j = start; j < end; j++) {
                const value = Math.abs((data[j] - 128) / 128);
                sum += value;
                if (value > peak) peak = value;
            }
            const average = sum / Math.max(1, end - start);
            const raw = Math.min(1, average * 2.4 + peak * 0.65);
            const previous = this.musicWaveformSmoothed[i] ?? raw;
            const smoothed = previous * 0.58 + raw * 0.42;
            this.musicWaveformSmoothed[i] = smoothed;
            levels.push(smoothed);
        }

        this.musicWaveformSmoothed.length = count;
        return levels;
    }

    getAllMusicTracks() {
        return [...SoundManager.MUSIC_TRACKS, ...this.customMusicTracks];
    }

    getMusicTrackByName(name) {
        return this.getAllMusicTracks().find(track => track.name === name) || null;
    }

    openCustomMusicDB() {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === "undefined") {
                reject(new Error("IndexedDB is not available in this browser."));
                return;
            }

            const request = indexedDB.open("mcwse_custom_music", 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains("tracks")) {
                    db.createObjectStore("tracks", {keyPath: "id"});
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Failed to open custom music database."));
            request.onblocked = () => reject(new Error("Custom music database is blocked by another tab."));
        });
    }

    async readCustomMusicRecords() {
        const db = await this.openCustomMusicDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("tracks", "readonly");
            const store = tx.objectStore("tracks");
            const request = store.getAll();
            request.onsuccess = () => {
                const records = (request.result || []).slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                resolve(records);
            };
            request.onerror = () => reject(request.error || new Error("Failed to read custom tracks."));
            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                try { db.close(); } catch (_) { /* already closed */ }
                reject(tx.error || new Error("Custom track read transaction failed."));
            };
        });
    }

    async saveCustomMusicRecord(record) {
        const db = await this.openCustomMusicDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("tracks", "readwrite");
            tx.objectStore("tracks").put(record);
            tx.oncomplete = () => {
                db.close();
                resolve(record);
            };
            tx.onerror = () => {
                try { db.close(); } catch (_) { /* already closed */ }
                reject(tx.error || new Error("Failed to save custom track."));
            };
        });
    }

    async deleteCustomTrack(id) {
        const db = await this.openCustomMusicDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction("tracks", "readwrite");
            tx.objectStore("tracks").delete(id);
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                try { db.close(); } catch (_) { /* already closed */ }
                reject(tx.error || new Error("Failed to delete custom track."));
            };
        });
        await this.reloadCustomMusicTracks();
    }

    async updateCustomTrackLyrics(id, lrcText) {
        const db = await this.openCustomMusicDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction("tracks", "readwrite");
            const store = tx.objectStore("tracks");
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const record = getRequest.result;
                if (!record) {
                    reject(new Error("Uploaded track was not found."));
                    return;
                }
                record.lrc = lrcText || "";
                store.put(record);
            };
            getRequest.onerror = () => reject(getRequest.error || new Error("Failed to read uploaded track."));
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                try { db.close(); } catch (_) { /* already closed */ }
                reject(tx.error || new Error("Failed to update lyrics."));
            };
        });
        await this.reloadCustomMusicTracks();
        const updated = this.customMusicTracks.find(track => track.id === id) || null;
        if (this.currentTrackInfo?.id === id && updated) {
            this.currentTrackInfo = updated;
            this.currentTrackLyrics = updated.lyrics || [];
        }
        return updated;
    }

    async loadCustomMusicTracks(force = false) {
        if (this.customMusicLoaded && !force) return this.customMusicTracks;
        if (this.customMusicLoading && !force) return this.customMusicLoading;

        this.customMusicLoading = (async () => {
            let records = [];
            try {
                records = await this.readCustomMusicRecords();
            } catch (error) {
                console.warn("Custom music storage unavailable:", error);
                this.customMusicLoaded = true;
                this.customMusicTracks = [];
                return this.customMusicTracks;
            }

            for (const track of this.customMusicTracks) {
                if (track.custom && track.url && typeof URL !== "undefined") {
                    try { URL.revokeObjectURL(track.url); } catch (_) { /* no-op */ }
                }
            }

            this.customMusicTracks = records
                .filter(record => record && record.blob)
                .map(record => {
                    const lrc = record.lrc || "";
                    return {
                        id: record.id,
                        name: record.name || record.fileName || "Custom Track",
                        fileName: record.fileName || "",
                        mimeType: record.mimeType || "",
                        size: record.size || record.blob.size || 0,
                        custom: true,
                        url: URL.createObjectURL(record.blob),
                        lrc,
                        lyrics: SoundManager.prepareLyricsFromLrc(lrc)
                    };
                });
            this.customMusicLoaded = true;
            return this.customMusicTracks;
        })().finally(() => {
            this.customMusicLoading = null;
        });

        return this.customMusicLoading;
    }

    async reloadCustomMusicTracks() {
        this.customMusicLoaded = false;
        return this.loadCustomMusicTracks(true);
    }

    makeUniqueTrackName(rawName) {
        const withoutExtension = (rawName || "").replace(/\.[a-z0-9]{2,5}$/i, "").trim();
        const base = withoutExtension || "Custom Track";
        const existing = new Set(this.getAllMusicTracks().map(track => track.name));
        if (!existing.has(base)) return base;

        let index = 2;
        while (existing.has(`${base} (${index})`)) index++;
        return `${base} (${index})`;
    }

    async importCustomMusic(file, options = {}) {
        if (!file) throw new Error("No audio file selected.");
        const onStatus = typeof options.onStatus === "function" ? options.onStatus : () => {};
        const name = this.makeUniqueTrackName(options.name || file.name || "Custom Track");
        let lrcText = options.lrcText || "";

        if (options.generateLyrics && !lrcText) {
            try {
                onStatus("Loading Whisper-like lyric model...");
                lrcText = await this.transcribeAudioToLrc(file, onStatus);
                onStatus("Generated synced .lrc lyrics.");
            } catch (error) {
                console.warn("Whisper-like transcription failed:", error);
                onStatus("Could not generate lyrics automatically.");
                if (typeof options.onTranscriptionError === "function") {
                    try {
                        lrcText = await options.onTranscriptionError(error) || "";
                    } catch (fallbackError) {
                        console.warn("Manual .lrc fallback failed:", fallbackError);
                        lrcText = "";
                    }
                }
                if (!lrcText) onStatus("Importing the song without .lrc lyrics.");
            }
        }

        const record = {
            id: `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name,
            fileName: file.name || name,
            mimeType: file.type || "audio/*",
            size: file.size || 0,
            createdAt: Date.now(),
            blob: file,
            lrc: lrcText
        };

        await this.saveCustomMusicRecord(record);
        await this.reloadCustomMusicTracks();
        return this.customMusicTracks.find(track => track.id === record.id) || {
            name,
            id: record.id,
            custom: true,
            lrc: lrcText,
            lyrics: SoundManager.prepareLyricsFromLrc(lrcText)
        };
    }

    async transcribeAudioToLrc(file, onStatus = () => {}) {
        if (typeof window === "undefined" || typeof URL === "undefined") {
            throw new Error("Browser APIs are required for transcription.");
        }

        // Use a stronger browser transcription model for uploaded songs.
        // Tiny was fast but often produced wrong/frozen lyric lines; Small is
        // noticeably more accurate while still being realistic for client-side
        // Transformers.js. If the device/network cannot load it, fall back one
        // tier instead of failing the whole import.
        const preferredModels = [
            {id: "Xenova/whisper-small", label: "Whisper Small"},
            {id: "Xenova/whisper-base", label: "Whisper Base fallback"},
            {id: "Xenova/whisper-tiny", label: "Whisper Tiny fallback"}
        ];

        onStatus("Loading high-quality Whisper Small model...");
        const transformers = await import("https://esm.sh/@xenova/transformers@2.17.2");
        if (transformers.env) {
            transformers.env.allowLocalModels = false;
            if (transformers.env.backends?.onnx?.wasm) {
                transformers.env.backends.onnx.wasm.numThreads = Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2));
            }
        }

        let transcriber = null;
        let activeModel = null;
        let lastModelError = null;
        for (const model of preferredModels) {
            try {
                onStatus(`Downloading ${model.label}...`);
                transcriber = await transformers.pipeline(
                    "automatic-speech-recognition",
                    model.id,
                    {
                        quantized: true,
                        progress_callback: data => {
                            if (!data) return;
                            if (data.status === "progress" && data.file && Number.isFinite(data.progress)) {
                                onStatus(`${model.label}: ${data.file} ${Math.round(data.progress)}%`);
                            } else if (data.status) {
                                onStatus(`${model.label}: ${data.status}`);
                            }
                        }
                    }
                );
                activeModel = model;
                break;
            } catch (error) {
                lastModelError = error;
                console.warn(`Failed to load ${model.id}; trying a smaller Whisper model.`, error);
            }
        }

        if (!transcriber) {
            throw lastModelError || new Error("No Whisper transcription model could be loaded.");
        }

        const audioUrl = URL.createObjectURL(file);
        try {
            onStatus(`Transcribing vocals with ${activeModel.label}...`);
            const result = await transcriber(audioUrl, {
                chunk_length_s: 20,
                stride_length_s: 4,
                return_timestamps: "word",
                task: "transcribe"
            });
            const lrc = SoundManager.whisperResultToLrc(result);
            if (!lrc.trim()) {
                throw new Error("The model did not return any lyric text.");
            }
            return lrc;
        } finally {
            URL.revokeObjectURL(audioUrl);
        }
    }

    static getChunkTimestamp(chunk) {
        const timestamp = chunk?.timestamp || chunk?.timestamps || chunk?.time;
        let start = Number(chunk?.start ?? 0) || 0;
        let end = Number(chunk?.end ?? 0) || 0;

        if (Array.isArray(timestamp)) {
            start = Number(timestamp[0]) || 0;
            end = Number(timestamp[1]) || 0;
        } else if (typeof timestamp === "object" && timestamp !== null) {
            start = Number(timestamp.start ?? timestamp[0] ?? start) || 0;
            end = Number(timestamp.end ?? timestamp[1] ?? end) || 0;
        } else if (timestamp !== undefined) {
            start = Number(timestamp) || 0;
        }

        if (!Number.isFinite(start)) start = 0;
        if (!Number.isFinite(end) || end < start) end = 0;
        return {start, end};
    }

    static splitLyricText(text, maxWords = 8) {
        const clean = String(text || "").replace(/\s+/g, " ").trim();
        if (!clean) return [];

        const sentenceParts = clean
            .split(/(?<=[.!?])\s+|\s*[|/]\s*/)
            .map(part => part.trim())
            .filter(Boolean);
        const phrases = [];

        for (const part of sentenceParts.length ? sentenceParts : [clean]) {
            const words = part.split(/\s+/).filter(Boolean);
            for (let i = 0; i < words.length; i += maxWords) {
                phrases.push(words.slice(i, i + maxWords).join(" "));
            }
        }

        return phrases;
    }

    static whisperResultToLrc(result) {
        const chunks = Array.isArray(result?.chunks) ? result.chunks : [];
        const lines = [];

        if (chunks.length > 0) {
            // Whisper word timestamps are the best case. Group words into
            // readable LRC lines and stamp each line at the first word's time.
            const wordLike = chunks.filter(chunk => (chunk?.text || "").trim().split(/\s+/).length <= 3);
            if (wordLike.length >= Math.max(3, chunks.length * 0.65)) {
                let currentWords = [];
                let lineStart = null;
                let lastEnd = 0;

                const flush = () => {
                    if (currentWords.length === 0) return;
                    lines.push(`[${SoundManager.formatLrcTime(lineStart ?? 0)}]${currentWords.join(" ")}`);
                    currentWords = [];
                    lineStart = null;
                };

                for (const chunk of chunks) {
                    const wordText = (chunk?.text || "").replace(/\s+/g, " ").trim();
                    if (!wordText) continue;
                    const {start, end} = SoundManager.getChunkTimestamp(chunk);
                    if (lineStart === null) lineStart = start;
                    if (currentWords.length > 0 && start - lastEnd > 1.2) flush();
                    currentWords.push(wordText);
                    lastEnd = end || start;
                    if (currentWords.length >= 7 || /[.!?]$/.test(wordText)) flush();
                }
                flush();
            } else {
                // Chunk timestamps can cover 20-30 seconds, which felt like
                // frozen lyrics. Split long chunks and interpolate inside the
                // chunk so lines visibly advance in-game.
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const text = (chunk?.text || "").trim();
                    if (!text) continue;
                    const {start, end} = SoundManager.getChunkTimestamp(chunk);
                    const nextStart = i + 1 < chunks.length ? SoundManager.getChunkTimestamp(chunks[i + 1]).start : 0;
                    const phrases = SoundManager.splitLyricText(text, 8);
                    if (phrases.length === 0) continue;
                    const spanEnd = end > start ? end : (nextStart > start ? nextStart : start + phrases.length * 3.25);
                    const step = Math.max(1.25, (spanEnd - start) / Math.max(phrases.length, 1));
                    phrases.forEach((phrase, index) => {
                        lines.push(`[${SoundManager.formatLrcTime(start + index * step)}]${phrase}`);
                    });
                }
            }
        } else if (result?.text) {
            const phrases = SoundManager.splitLyricText(String(result.text), 8);
            phrases.forEach((phrase, index) => {
                lines.push(`[${SoundManager.formatLrcTime(index * 3.5)}]${phrase}`);
            });
        }

        return lines.join("\n");
    }

    static formatLrcTime(seconds) {
        const safe = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(safe / 60);
        const wholeSeconds = Math.floor(safe % 60);
        const hundredths = Math.floor((safe - Math.floor(safe)) * 100);
        return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
    }

    static parseLrc(lrcText) {
        if (!lrcText || typeof lrcText !== "string") return [];
        const entries = [];
        const timeTag = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;

        for (const rawLine of lrcText.split(/\r?\n/)) {
            timeTag.lastIndex = 0;
            const timestamps = [];
            let match;
            while ((match = timeTag.exec(rawLine)) !== null) {
                const minutes = Number(match[1]) || 0;
                const seconds = Number(match[2]) || 0;
                const fractionRaw = match[3] || "0";
                const fraction = Number(fractionRaw.padEnd(3, "0").slice(0, 3)) / 1000;
                timestamps.push(minutes * 60 + seconds + fraction);
            }
            if (timestamps.length === 0) continue;
            const lyric = rawLine.replace(timeTag, "").trim();
            for (const time of timestamps) {
                entries.push({time, text: lyric});
            }
        }

        entries.sort((a, b) => a.time - b.time);
        return entries;
    }

    static prepareLyricsFromLrc(lrcText) {
        return SoundManager.repairLyricTimeline(SoundManager.parseLrc(lrcText));
    }

    static repairLyricTimeline(entries) {
        if (!Array.isArray(entries) || entries.length === 0) return [];
        if (entries.length === 1) {
            const only = entries[0];
            const phrases = only?.text ? SoundManager.splitLyricText(only.text, 8) : [];
            if (phrases.length <= 1) return entries;
            return phrases.map((phrase, index) => ({time: (only.time || 0) + index * 3.5, text: phrase}));
        }

        const expanded = [];
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (!entry || !entry.text) continue;
            const next = entries[i + 1];
            const gap = next ? next.time - entry.time : 0;
            const phrases = (gap > 9 || entry.text.split(/\s+/).length > 14)
                ? SoundManager.splitLyricText(entry.text, 8)
                : [entry.text];

            if (phrases.length <= 1) {
                expanded.push({time: entry.time, text: entry.text});
                continue;
            }

            const usableGap = gap > 1 ? Math.min(gap, phrases.length * 3.5) : phrases.length * 3.5;
            const step = Math.max(1.2, usableGap / phrases.length);
            phrases.forEach((phrase, index) => expanded.push({time: entry.time + index * step, text: phrase}));
        }

        const prepared = expanded.sort((a, b) => a.time - b.time);
        if (prepared.length <= 1) return prepared;

        let duplicateOrFrozen = 0;
        let hugeGaps = 0;
        for (let i = 1; i < prepared.length; i++) {
            const diff = prepared[i].time - prepared[i - 1].time;
            if (diff <= 0.08) duplicateOrFrozen++;
            if (diff > 18) hugeGaps++;
        }

        // Bad generated LRC sometimes has every line at 00:00 or one giant
        // timestamp gap. In that case, keep the text but distribute it so the
        // display actually changes while the song plays.
        if (duplicateOrFrozen >= prepared.length * 0.45 || hugeGaps >= prepared.length * 0.35) {
            return prepared.map((entry, index) => ({time: index * 3.5, text: entry.text}));
        }

        return prepared;
    }

    getCurrentMusicTime() {
        if (this.isHtmlBackgroundMusicPlaying()) {
            return Math.max(0, this.htmlBgm.currentTime || 0);
        }

        const context = this.audioListener?.context;
        if (!this.bgm || !this.bgm.isPlaying || !context || this.currentTrackStartedAt === null) return 0;
        if (context.state === "suspended") return 0;
        return Math.max(0, context.currentTime - this.currentTrackStartedAt);
    }

    getCurrentLyricLine() {
        if (!this.isBackgroundMusicPlaying() || !this.currentTrackLyrics || this.currentTrackLyrics.length === 0) return null;
        const context = this.audioListener?.context;
        if (!this.isHtmlBackgroundMusicPlaying() && (!context || context.state === "suspended")) return null;
        const time = this.getCurrentMusicTime() + 0.12;
        let active = null;
        for (const lyric of this.currentTrackLyrics) {
            if (lyric.time <= time) active = lyric;
            else break;
        }
        return active && active.text ? active.text : null;
    }

    playRandomTrack() {
        const settings = this.worldRenderer.minecraft.settings;
        const weightedPool = [];
        for (const track of this.getAllMusicTracks()) {
            if (settings.enabledMusic[track.name] === false) continue;
            const rawWeight = settings.musicTrackFrequency?.[track.name];
            const weight = rawWeight === undefined ? 5 : Math.max(0, Number(rawWeight) || 0);
            if (weight <= 0) continue;
            weightedPool.push({track, weight});
        }
        
        if (weightedPool.length === 0) return;

        const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * totalWeight;
        let track = weightedPool[0].track;
        for (const entry of weightedPool) {
            roll -= entry.weight;
            if (roll <= 0) {
                track = entry.track;
                break;
            }
        }
        this.currentTrackName = track.name;
        this.currentTrackInfo = track;
        
        // Requested 55% lower volume -> 0.45 multiplier
        this.playBackgroundMusic(track.url, 0.45, track);
    }

    showNowPlaying(trackName) {
        const settings = this.worldRenderer?.minecraft?.settings;
        if (settings?.showMusicToast === false) return;
        if (typeof document === "undefined" || !document.body || !trackName) return;

        if (this.nowPlayingTimer) {
            clearTimeout(this.nowPlayingTimer);
            this.nowPlayingTimer = null;
        }
        if (this.nowPlayingNotice) {
            this.nowPlayingNotice.remove();
            this.nowPlayingNotice = null;
        }

        const track = this.currentTrackInfo || this.getMusicTrackByName(trackName) || null;
        const notice = document.createElement("div");
        notice.style.cssText = [
            "position:fixed",
            "right:16px",
            "bottom:16px",
            "z-index:100000",
            "min-width:260px",
            "max-width:390px",
            "box-sizing:border-box",
            "padding:10px 12px",
            "background:rgba(24,24,24,.92)",
            "color:#f5f5f5",
            "border:2px solid #5a5a5a",
            "border-radius:2px",
            "box-shadow:4px 4px 0 rgba(0,0,0,.45)",
            "font:600 13px monospace",
            "pointer-events:none",
            "opacity:0",
            "transform:translate(112%,112%)",
            "transition:transform .32s ease-out,opacity .22s ease-out",
            "display:flex",
            "gap:10px",
            "align-items:center"
        ].join(";");

        if (track?.albumArt) {
            const art = document.createElement("img");
            art.src = track.albumArt;
            art.alt = "";
            art.style.cssText = "width:46px;height:46px;object-fit:cover;border:2px solid #111;image-rendering:auto;background:#333;flex:0 0 auto";
            notice.appendChild(art);
        }

        const textWrap = document.createElement("div");
        textWrap.style.cssText = "min-width:0;flex:1";
        notice.appendChild(textWrap);

        const label = document.createElement("div");
        label.textContent = "Now Playing";
        label.style.cssText = "font-size:12px;color:#cfcfcf;margin-bottom:3px;text-shadow:1px 1px #000";
        textWrap.appendChild(label);

        const title = document.createElement("div");
        title.textContent = trackName;
        title.style.cssText = "font-size:15px;font-weight:800;line-height:1.25;color:#fff;text-shadow:1px 1px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
        textWrap.appendChild(title);

        const sub = document.createElement("div");
        sub.textContent = track?.album || (track?.custom ? "Uploaded Music" : "Music");
        sub.style.cssText = "margin-top:3px;color:#a8a8a8;font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
        textWrap.appendChild(sub);

        document.body.appendChild(notice);
        this.nowPlayingNotice = notice;

        requestAnimationFrame(() => {
            notice.style.opacity = "1";
            notice.style.transform = "translate(0,0)";
        });

        this.nowPlayingTimer = setTimeout(() => {
            notice.style.opacity = "0";
            notice.style.transform = "translate(120%,120%)";
            setTimeout(() => {
                if (this.nowPlayingNotice === notice) {
                    notice.remove();
                    this.nowPlayingNotice = null;
                    this.nowPlayingTimer = null;
                }
            }, 450);
        }, 5600);
    }

    getMusicVolumeScalar(baseVolume = 0.45) {
        const settings = this.worldRenderer?.minecraft?.settings;
        const master = settings?.soundVolume ?? 1.0;
        const musicVol = settings?.musicVolume ?? 1.0;
        return Math.min(1, Math.max(0, baseVolume * master * musicVol));
    }

    fadeHtmlAudio(audio, targetVolume, duration = 0.6, onDone = null) {
        if (!audio) return;
        const startVolume = Number(audio.volume) || 0;
        const startedAt = performance.now();
        const durationMs = Math.max(1, duration * 1000);
        const tick = () => {
            const progress = Math.min(1, (performance.now() - startedAt) / durationMs);
            const eased = 1 - Math.pow(1 - progress, 3);
            audio.volume = startVolume + (targetVolume - startVolume) * eased;
            if (progress < 1 && !audio.paused) {
                requestAnimationFrame(tick);
            } else if (onDone) {
                onDone();
            }
        };
        requestAnimationFrame(tick);
    }

    fadeThreeAudio(audio, targetVolume, duration = 0.6, onDone = null) {
        const context = this.audioListener?.context;
        const gain = audio?.gain?.gain;
        if (!context || !gain) {
            if (audio?.setVolume) audio.setVolume(targetVolume);
            if (onDone) setTimeout(onDone, duration * 1000);
            return;
        }
        const now = context.currentTime;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(Math.max(0.0001, gain.value), now);
        gain.linearRampToValueAtTime(Math.max(0.0001, targetVolume), now + duration);
        if (onDone) setTimeout(onDone, duration * 1000 + 30);
    }

    fadeOutCurrentBackgroundMusic(duration = 0.75) {
        const oldBgm = this.bgm;
        const oldHtml = this.htmlBgm;
        this.bgm = null;
        this.htmlBgm = null;
        this.resetBackgroundMusicState();
        setTimeout(() => this.clearMusicAnalyser(), duration * 1000 + 80);

        if (oldBgm && oldBgm.isPlaying) {
            this.fadeThreeAudio(oldBgm, 0.0001, duration, () => {
                try { if (oldBgm.isPlaying) oldBgm.stop(); } catch (_) { /* already stopped */ }
            });
        }
        if (oldHtml && !oldHtml.paused && !oldHtml.ended) {
            this.fadeHtmlAudio(oldHtml, 0, duration, () => {
                try { oldHtml.pause(); } catch (_) { /* already paused */ }
            });
        }
    }

    transitionToBackgroundMusic(track, volume = 0.45) {
        if (!track) return;
        const hadMusic = this.isBackgroundMusicPlaying();
        if (hadMusic) this.fadeOutCurrentBackgroundMusic(0.85);
        setTimeout(() => {
            this.playBackgroundMusic(track.url, volume, track);
        }, hadMusic ? 180 : 0);
    }

    getCustomMusicTrackFromTag(tag = {}) {
        if (!tag) return null;
        return this.customMusicTracks.find(track => track.id === tag.customMusicTrackId)
            || this.customMusicTracks.find(track => track.name === tag.customMusicTrackName)
            || null;
    }

    playCustomMusicDisc(tag, x = NaN, y = NaN, z = NaN) {
        const track = this.getCustomMusicTrackFromTag(tag);
        if (!track || !track.url || typeof Audio === "undefined") {
            this.worldRenderer?.minecraft?.addMessageToChat?.("§cCustom disc track is not available in this browser.");
            return null;
        }

        this.resumeAudioContext();
        const audio = new Audio();
        audio.preload = "auto";
        audio.loop = false;
        audio.src = track.url;

        const wrapper = {
            customHtmlDisc: true,
            audio,
            isPlaying: false,
            baseVolume: 0.75,
            stop: () => {
                try { audio.pause(); } catch (_) { /* already paused */ }
                wrapper.isPlaying = false;
            }
        };

        const updateDiscVolume = () => {
            const base = wrapper.baseVolume;
            const settings = this.worldRenderer?.minecraft?.settings;
            const master = settings?.soundVolume ?? 1.0;
            const musicVol = settings?.musicVolume ?? 1.0;
            audio.volume = Math.min(1, Math.max(0, base * master * musicVol));
        };

        audio.onended = () => {
            wrapper.isPlaying = false;
            this.activeDiscs.delete(wrapper);
            this.updateVolumes();
        };
        audio.onerror = () => {
            wrapper.isPlaying = false;
            this.activeDiscs.delete(wrapper);
            this.updateVolumes();
            this.worldRenderer?.minecraft?.addMessageToChat?.("§cCould not play that custom music disc.");
        };

        audio.volume = 0;
        const playPromise = audio.play();
        const start = () => {
            wrapper.isPlaying = true;
            this.activeDiscs.add(wrapper);
            this.updateVolumes();
            updateDiscVolume();
            const target = audio.volume;
            audio.volume = 0;
            this.fadeHtmlAudio(audio, target, 0.55);
        };
        if (playPromise && typeof playPromise.then === "function") playPromise.then(start).catch(error => {
            console.warn("Failed to play custom music disc:", error);
            this.worldRenderer?.minecraft?.addMessageToChat?.("§cCould not play that custom music disc.");
        });
        else start();

        return wrapper;
    }

    updateVolumes() {
        const settings = this.worldRenderer?.minecraft?.settings;
        if (!settings) return;

        const master = settings.soundVolume;

        // Update BGM - Mute if a jukebox disc is playing
        if (this.bgm) {
            // Apply the 0.45 volume reduction requested specifically for BG music
            let bgmVol = 0.45 * master * settings.musicVolume;
            if (this.activeDiscs.size > 0) {
                bgmVol = 0;
            }
            this.bgm.setVolume(bgmVol);
        }
        if (this.htmlBgm) {
            const htmlVol = this.activeDiscs.size > 0 ? 0 : Math.min(1, Math.max(0, this.htmlBgmVolume * master * settings.musicVolume));
            this.htmlBgm.volume = htmlVol;
        }
        for (const disc of this.activeDiscs) {
            if (disc?.customHtmlDisc && disc.audio) {
                disc.audio.volume = Math.min(1, Math.max(0, (disc.baseVolume || 0.75) * master * settings.musicVolume));
            }
        }

        // The Backrooms hum belongs to the Music slider because it replaces
        // regular background music rather than adding another SFX channel.
        this.updateBackroomsHumVolume();

        // Update active sounds in the pool based on their categories
        for (let audio of this.voicePool) {
            if (audio.isPlaying) {
                const baseVol = audio.userData.baseRequestedVolume || 1.0;
                let categoryVol = 1.0;
                
                if (audio.minecraftCategory === 'music') categoryVol = settings.musicVolume;
                else if (audio.minecraftCategory === 'mob') categoryVol = settings.mobVolume;
                else categoryVol = settings.sfxVolume;

                audio.setVolume(baseVol * master * categoryVol * 0.7);
            }
        }
    }

    /**
     * Start a quiet, layered fluorescent electrical hum for Backrooms Level 0.
     * The oscillators and filtered noise are deliberately subtle and routed
     * through the existing AudioListener so browser policies and volume
     * controls behave exactly like the rest of the game audio.
     */
    startBackroomsHum() {
        if (!this.audioListener || this.backroomsHum) {
            this.updateBackroomsHumVolume();
            return;
        }

        const context = this.audioListener.context;
        if (!context || !this.audioListener.getInput) return;
        if (context.state === "suspended") context.resume().catch(() => {});

        this.stopBackgroundMusicForBackrooms();

        const master = context.createGain();
        const toneFilter = context.createBiquadFilter();
        toneFilter.type = "lowpass";
        toneFilter.frequency.value = 760;
        toneFilter.Q.value = 0.65;

        const lowTone = context.createOscillator();
        lowTone.type = "sine";
        lowTone.frequency.value = 59.7;
        const harmonic = context.createOscillator();
        harmonic.type = "sine";
        harmonic.frequency.value = 119.4;
        const harmonicGain = context.createGain();
        harmonicGain.gain.value = 0.32;

        // Filtered, extremely quiet electrical texture prevents the tone from
        // feeling like music while giving it an old fluorescent-tube presence.
        const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        let brown = 0;
        for (let i = 0; i < noiseData.length; i++) {
            brown = (brown + (Math.random() * 2 - 1) * 0.035) / 1.035;
            noiseData[i] = brown;
        }
        const noise = context.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const noiseFilter = context.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.value = 980;
        noiseFilter.Q.value = 0.55;
        const noiseGain = context.createGain();
        noiseGain.gain.value = 0.034;

        // A barely perceptible amplitude wobble evokes aging ballast instead
        // of a static drone.
        const flutter = context.createOscillator();
        flutter.type = "sine";
        flutter.frequency.value = 0.16;
        const flutterDepth = context.createGain();
        flutterDepth.gain.value = 0.0028;

        lowTone.connect(toneFilter);
        harmonic.connect(harmonicGain);
        harmonicGain.connect(toneFilter);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(toneFilter);
        toneFilter.connect(master);
        flutter.connect(flutterDepth);
        flutterDepth.connect(master.gain);
        master.connect(this.audioListener.getInput());

        master.gain.value = 0.0001;
        lowTone.start();
        harmonic.start();
        noise.start();
        flutter.start();

        this.backroomsHum = {master, lowTone, harmonic, noise, flutter, toneFilter, noiseFilter, noiseGain, harmonicGain, flutterDepth};
        this.updateBackroomsHumVolume(true);
    }

    updateBackroomsHumVolume(fadeIn = false) {
        if (!this.backroomsHum || !this.audioListener?.context) return;
        const settings = this.worldRenderer?.minecraft?.settings;
        const masterVolume = settings?.soundVolume ?? 1.0;
        const musicVolume = settings?.musicVolume ?? 1.0;
        const target = 0.040 * masterVolume * musicVolume;
        const context = this.audioListener.context;
        const gain = this.backroomsHum.master.gain;
        const now = context.currentTime;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(Math.max(0.0001, gain.value), now);
        gain.linearRampToValueAtTime(target, now + (fadeIn ? 0.45 : 0.08));
    }

    stopBackgroundMusicForBackrooms() {
        if (!this.isBackgroundMusicPlaying()) return;

        this.clearMusicAnalyser();

        if (this.isHtmlBackgroundMusicPlaying()) {
            try { this.htmlBgm.pause(); } catch (_) { /* already paused */ }
            try { this.htmlBgm.currentTime = 0; } catch (_) { /* not seekable */ }
            this.htmlBgm = null;
        }

        if (this.bgm && this.bgm.isPlaying) {
            const context = this.audioListener?.context;
            const gain = this.bgm.gain?.gain;
            if (context && gain) {
                const now = context.currentTime;
                gain.cancelScheduledValues(now);
                gain.setValueAtTime(Math.max(0.0001, gain.value), now);
                gain.linearRampToValueAtTime(0.0001, now + 0.12);
                setTimeout(() => {
                    if (this.bgm?.isPlaying) this.bgm.stop();
                }, 145);
            } else {
                this.bgm.stop();
            }
        }

        this.resetBackgroundMusicState();
    }

    stopBackroomsHum() {
        const hum = this.backroomsHum;
        if (!hum || !this.audioListener?.context) return;
        this.backroomsHum = null;

        const context = this.audioListener.context;
        const now = context.currentTime;
        hum.master.gain.cancelScheduledValues(now);
        hum.master.gain.setValueAtTime(Math.max(0.0001, hum.master.gain.value), now);
        hum.master.gain.linearRampToValueAtTime(0.0001, now + 0.12);
        setTimeout(() => {
            for (const source of [hum.lowTone, hum.harmonic, hum.noise, hum.flutter]) {
                try { source.stop(); } catch (_) { /* already stopped */ }
            }
            for (const node of [hum.lowTone, hum.harmonic, hum.noise, hum.flutter, hum.toneFilter, hum.noiseFilter, hum.noiseGain, hum.harmonicGain, hum.flutterDepth, hum.master]) {
                try { node.disconnect(); } catch (_) { /* already disconnected */ }
            }
        }, 145);
        // Do not start a normal song the instant a player leaves Level 0.
        this.musicCooldown = Math.max(this.musicCooldown, 80);
    }

    playUploadedBackgroundMusic(path, volume, trackInfo) {
        if (this._backroomsMusicActive || !this.audioListener) return;
        if (this.isBackgroundMusicPlaying() || this.backgroundMusicLoading) return;
        if (typeof Audio === "undefined") {
            console.warn("HTMLAudioElement is not available for uploaded music playback.");
            return;
        }

        this.backgroundMusicLoading = true;
        this.resumeAudioContext();

        const audio = new Audio();
        audio.preload = "auto";
        audio.loop = false;
        audio.src = path;
        this.htmlBgmVolume = volume;

        const applyVolume = () => {
            const settings = this.worldRenderer?.minecraft?.settings;
            const master = settings?.soundVolume ?? 1.0;
            const musicVol = settings?.musicVolume ?? 1.0;
            audio.volume = this.activeDiscs.size > 0 ? 0 : Math.min(1, Math.max(0, volume * master * musicVol));
        };

        const failPlayback = error => {
            this.backgroundMusicLoading = false;
            if (this.htmlBgm === audio) this.htmlBgm = null;
            this.clearMusicAnalyser();
            this.resetBackgroundMusicState();
            this.musicCooldown = Math.max(this.musicCooldown, 60);
            console.warn("Failed to play uploaded music:", trackInfo?.name || path, error);
            const message = error?.message ? error.message : String(error || "unknown error");
            this.worldRenderer?.minecraft?.addMessageToChat?.(`§cCould not play uploaded song: ${message}`);
        };

        audio.onended = () => {
            if (this.htmlBgm === audio) {
                this.clearMusicAnalyser();
                this.htmlBgm = null;
                this.resetBackgroundMusicState();
            }
        };
        audio.onerror = () => {
            failPlayback(audio.error || new Error("The browser could not decode this audio file."));
        };

        applyVolume();
        const targetStartVolume = audio.volume;
        audio.volume = 0;

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(() => {
                if (this._backroomsMusicActive) {
                    this.backgroundMusicLoading = false;
                    try { audio.pause(); } catch (_) { /* already paused */ }
                    return;
                }
                this.backgroundMusicLoading = false;
                this.htmlBgm = audio;
                this.setupMusicAnalyserForHtmlAudio(audio);
                this.currentTrackInfo = trackInfo;
                this.currentTrackName = trackInfo?.name || this.currentTrackName || "Uploaded Track";
                this.currentTrackLyrics = trackInfo?.lyrics || SoundManager.prepareLyricsFromLrc(trackInfo?.lrc || "");
                this.currentTrackStartedAt = null;
                this.fadeHtmlAudio(audio, targetStartVolume, 0.85);
                this.showNowPlaying(this.currentTrackName);
            }).catch(failPlayback);
        } else {
            this.backgroundMusicLoading = false;
            this.htmlBgm = audio;
            this.setupMusicAnalyserForHtmlAudio(audio);
            this.currentTrackInfo = trackInfo;
            this.currentTrackName = trackInfo?.name || this.currentTrackName || "Uploaded Track";
            this.currentTrackLyrics = trackInfo?.lyrics || SoundManager.prepareLyricsFromLrc(trackInfo?.lrc || "");
            this.currentTrackStartedAt = null;
            this.fadeHtmlAudio(audio, targetStartVolume, 0.85);
            this.showNowPlaying(this.currentTrackName);
        }
    }

    playBackgroundMusic(path, volume, trackInfo = this.currentTrackInfo || this.currentTrackName) {
        if (this._backroomsMusicActive || !this.audioListener) return;
        // If BGM is already playing or loading, don't interrupt it.
        if (this.isBackgroundMusicPlaying() || this.backgroundMusicLoading) return;

        const resolvedTrack = typeof trackInfo === "object" && trackInfo !== null
            ? trackInfo
            : this.getMusicTrackByName(trackInfo) || {name: trackInfo || this.currentTrackName || "Unknown Track"};

        if (resolvedTrack.custom) {
            this.playUploadedBackgroundMusic(path, volume, resolvedTrack);
            return;
        }

        this.backgroundMusicLoading = true;

        // Create the BGM object if it doesn't exist
        if (!this.bgm) {
            this.bgm = new THREE.Audio(this.audioListener);
        }

        this.audioLoader.load(path, (buffer) => {
            const startPlayback = () => {
                // Do not let a normal track that was loading during a dimension
                // transition start over the Backrooms hum.
                if (this._backroomsMusicActive || this.isBackgroundMusicPlaying()) {
                    this.backgroundMusicLoading = false;
                    return;
                }

                const context = this.audioListener?.context;
                if (context && context.state === "suspended") {
                    this.resumeAudioContext().then(() => {
                        if (this.audioListener?.context?.state !== "suspended") {
                            startPlayback();
                        } else {
                            console.warn("Background music is waiting for the browser to unlock audio.");
                            this.backgroundMusicLoading = false;
                            this.resetBackgroundMusicState();
                            this.musicCooldown = Math.max(this.musicCooldown, 60);
                        }
                    });
                    return;
                }

                this.backgroundMusicLoading = false;
                this.currentTrackInfo = resolvedTrack;
                this.currentTrackName = resolvedTrack.name || this.currentTrackName;
                this.currentTrackLyrics = resolvedTrack.lyrics || SoundManager.prepareLyricsFromLrc(resolvedTrack.lrc || "");
                this.currentTrackStartedAt = null;

                this.bgm.setBuffer(buffer);
                this.bgm.setLoop(false); // Music should play once then cooldown
                const targetVolume = this.getMusicVolumeScalar(volume);
                this.bgm.setVolume(0.0001);
                this.bgm.play();
                this.fadeThreeAudio(this.bgm, targetVolume, 0.85);
                this.setupMusicAnalyserForThreeAudio(this.bgm);
                // currentTime may validly be 0 on the first unlocked frame, so
                // store null for "not started" instead of testing this value as
                // truthy. That fixes lyrics getting stuck on line 1.
                this.currentTrackStartedAt = context ? context.currentTime : 0;
                this.showNowPlaying(this.currentTrackName || "Unknown Track");
            };

            startPlayback();
        }, undefined, error => {
            this.backgroundMusicLoading = false;
            this.clearMusicAnalyser();
            console.warn("Failed to load background music:", path, error);
            this.resetBackgroundMusicState();
            this.musicCooldown = Math.max(this.musicCooldown, 60);
            this.worldRenderer?.minecraft?.addMessageToChat?.("§cCould not load that music track.");
        });
    }

    playSound(name, x, y, z, volume, pitch = 1.0) {
        if (!this.isCreated()) return null;

        const now = Date.now();
        if (now !== this.lastFrameTime) {
            this.soundsPlayedThisFrame.clear();
            this.lastFrameTime = now;
        }
        
        const settings = this.worldRenderer?.minecraft?.settings;
        let masterVol = settings ? settings.soundVolume : 1.0;
        if (masterVol <= 0.001) return null;

        const buffers = this.bufferCache.get(name);
        if (!buffers || buffers.length === 0) {
            if (SoundManager.SOUND_DATA[name]) {
                // Keep the first requested sound so an interaction that
                // happens during loading still produces audio once ready.
                this.pendingSounds.set(name, { x, y, z, volume, pitch });
                this.preloadSoundGroup(name);
            }
            return null;
        }

        if (this.soundsPlayedThisFrame.has(name)) return null;
        this.soundsPlayedThisFrame.add(name);

        const context = this.audioListener?.context;
        if (context && context.state === "suspended") {
            context.resume().catch(() => {});
        }

        // Categorize sound to use correct slider
        let category = 'sfx';
        let categoryVol = settings ? settings.sfxVolume : 1.0;

        if (name.startsWith("music.") || name.startsWith("instrument.")) {
            category = 'music';
            categoryVol = settings ? settings.musicVolume : 1.0;
        } else if (name.startsWith("mob.")) {
            category = 'mob';
            categoryVol = settings ? settings.mobVolume : 1.0;
        }

        const buffer = buffers[Math.floor(Math.random() * buffers.length)];
        let isUI = isNaN(x) || name.includes("click") || name.includes("pop") || name.includes("levelup");
        
        // Force non-positional if disabled in settings
        if (settings && !settings.threeDAudio) {
            isUI = true;
        }

        // Find an idle voice
        let audio = this.voicePool.find(v => !v.isPlaying && (isUI ? !(v instanceof THREE.PositionalAudio) : (v instanceof THREE.PositionalAudio)));

        if (!audio) {
            if (isUI) {
                audio = new THREE.Audio(this.audioListener);
            } else {
                audio = new THREE.PositionalAudio(this.audioListener);
                // Apply Minecraft-like linear distance falloff for 3D positional audio.
                audio.setDistanceModel('linear');
                audio.setRefDistance(1.0);
                audio.setMaxDistance(32.0); // Increased range for better ambient audio
                audio.setRolloffFactor(1.0);
            }
            this.voicePool.push(audio);
            if (!isUI && this.scene) this.scene.add(audio);
        }

        audio.setBuffer(buffer);
        audio.minecraftCategory = category;
        audio.userData.baseRequestedVolume = volume;

        if (audio instanceof THREE.PositionalAudio && !isNaN(x)) {
            audio.position.set(x, y, z);
            audio.updateMatrixWorld();
        }

        const finalPitch = pitch * (0.95 + Math.random() * 0.1);
        let finalVol = volume * masterVol * categoryVol * 0.7;

        // Manual distance falloff for non-3D audio (Stereo Mode)
        // If 3D audio is OFF, we use THREE.Audio but manually calculate volume based on proximity
        if (isUI && !isNaN(x) && this.audioListener) {
            const listenerPos = new THREE.Vector3();
            this.audioListener.getWorldPosition(listenerPos);
            const dist = listenerPos.distanceTo(new THREE.Vector3(x, y, z));
            const maxDistance = 16.0;
            
            if (dist > maxDistance) {
                return null; // Cull sounds outside max distance
            }
            
            // Apply linear falloff
            const falloff = 1.0 - (dist / maxDistance);
            finalVol *= falloff;
        }
        
        // Prevent clicking by starting gain at 0 and ramping up quickly
        if (audio.gain && audio.gain.gain) {
            const ctx = this.audioListener.context;
            const now = ctx.currentTime;
            audio.gain.gain.cancelScheduledValues(now);
            audio.gain.gain.setValueAtTime(0, now);
            audio.gain.gain.linearRampToValueAtTime(finalVol, now + 0.015);
        } else {
            audio.setVolume(finalVol);
        }

        if (audio.setPlaybackRate) {
            audio.setPlaybackRate(finalPitch);
        }

        // Track Jukebox discs
        if (name.startsWith("music.disc.")) {
            this.activeDiscs.add(audio);
            const originalOnEnded = audio.onEnded;
            audio.onEnded = () => {
                if (originalOnEnded) originalOnEnded();
                this.activeDiscs.delete(audio);
                this.updateVolumes();
            };
            this.updateVolumes();
        }

        audio.play();
        return audio;
    }

    /**
     * Stop a sound with a short fade-out to prevent popping/clicking.
     */
    stopSound(audio, fadeTime = 0.05) {
        if (!audio || !audio.isPlaying) return;

        if (audio.customHtmlDisc && audio.audio) {
            this.fadeHtmlAudio(audio.audio, 0, fadeTime, () => {
                try { audio.audio.pause(); } catch (_) { /* already paused */ }
                audio.isPlaying = false;
                if (this.activeDiscs.has(audio)) {
                    this.activeDiscs.delete(audio);
                    this.updateVolumes();
                }
            });
            return;
        }
        
        const ctx = this.audioListener.context;
        if (audio.gain && audio.gain.gain) {
            const now = ctx.currentTime;
            const gain = audio.gain.gain;
            
            // Define current state to anchor the ramp
            gain.cancelScheduledValues(now);
            gain.setValueAtTime(gain.value, now);
            
            // Use exponential ramp to near-zero for natural silencing without pops
            gain.exponentialRampToValueAtTime(0.0001, now + fadeTime);
            
            setTimeout(() => {
                if (audio.isPlaying) {
                    audio.stop();
                    // Cleanup disc tracking if needed
                    if (this.activeDiscs.has(audio)) {
                        this.activeDiscs.delete(audio);
                        this.updateVolumes();
                    }
                }
            }, fadeTime * 1000 + 20);
        } else {
            audio.stop();
        }
    }

    stopAllSounds() {
        this.stopBackroomsHum();
        if (!this.voicePool) return;
        for (let audio of this.voicePool) {
            this.stopSound(audio, 0.05);
        }
    }

    isCreated() {
        return this.audioListener !== null;
    }
}
