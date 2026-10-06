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
        { name: "Blind Spots", url: "https://files.catbox.moe/font2r.mp3" },
        { name: "Wet Hands", url: "https://files.catbox.moe/3k08cu.mp3" },
        { name: "Haggstrom", url: "https://files.catbox.moe/yvdvu8.mp3" },
        { name: "Moog City", url: "https://files.catbox.moe/gskrpp.mp3" },
        { name: "Subwoofer Lullaby", url: "https://files.catbox.moe/e2y0nb.mp3" },
        { name: "Sweden", url: "https://files.catbox.moe/8dk8bs.mp3" },
        { name: "Minecraft", url: "https://files.catbox.moe/1plrda.mp3" }
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

        // Add more categories for fallbacks
        SoundManager.SOUND_DATA["mob.creeper.fuse"] = ["https://files.catbox.moe/3df2ok.ogg"];
    }

    async create(worldRenderer) {
        if (this.audioListener) return;

        this.worldRenderer = worldRenderer;
        this.scene = worldRenderer.scene;

        this.audioListener = new THREE.AudioListener();
        worldRenderer.camera.add(this.audioListener);

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
        if (this.worldRenderer.minecraft.isPaused()) return;

        const settings = this.worldRenderer.minecraft.settings;

        // Music loop handler
        if (this.bgm && this.bgm.isPlaying) {
            // Song is currently playing
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

    playRandomTrack() {
        const settings = this.worldRenderer.minecraft.settings;
        const pool = SoundManager.MUSIC_TRACKS.filter(t => settings.enabledMusic[t.name]);
        
        if (pool.length === 0) return;

        const track = pool[Math.floor(Math.random() * pool.length)];
        this.currentTrackName = track.name;
        
        // Requested 55% lower volume -> 0.45 multiplier
        this.playBackgroundMusic(track.url, 0.45);
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

    playBackgroundMusic(path, volume) {
        if (!this.audioListener) return;
        // If BGM is already playing, don't interrupt it.
        if (this.bgm && this.bgm.isPlaying) return;

        // Create the BGM object if it doesn't exist
        if (!this.bgm) {
            this.bgm = new THREE.Audio(this.audioListener);
        }

        this.audioLoader.load(path, (buffer) => {
            // Re-check playing state after async load
            if (this.bgm.isPlaying) return;

            this.bgm.setBuffer(buffer);
            this.bgm.setLoop(false); // Music should play once then cooldown
            const master = this.worldRenderer?.minecraft?.settings?.soundVolume ?? 1.0;
            const musicVol = this.worldRenderer?.minecraft?.settings?.musicVolume ?? 1.0;
            this.bgm.setVolume(volume * master * musicVol);
            this.bgm.play();
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
        
        // Lightweight environmental occlusion: sample blocks along the sound
        // ray and muffle sounds passing through solid terrain.
        if(this.worldRenderer?.minecraft?.settings?.soundPhysicsRemastered!==false&&!isNaN(x)&&this.worldRenderer?.minecraft?.world){
            const listenerPos=new THREE.Vector3();this.audioListener.getWorldPosition(listenerPos);const dx=x-listenerPos.x,dy=y-listenerPos.y,dz=z-listenerPos.z,steps=Math.min(24,Math.ceil(Math.hypot(dx,dy,dz)));let blocked=0;
            for(let i=1;i<steps;i++){const t=i/steps,id=this.worldRenderer.minecraft.world.getBlockAt(Math.floor(listenerPos.x+dx*t),Math.floor(listenerPos.y+dy*t),Math.floor(listenerPos.z+dz*t));if(id)blocked++;}
            if(blocked)finalVol*=Math.max(.12,1-blocked/Math.max(steps,1)*.85);
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
        if (!this.voicePool) return;
        for (let audio of this.voicePool) {
            this.stopSound(audio, 0.05);
        }
    }

    isCreated() {
        return this.audioListener !== null;
    }
}
