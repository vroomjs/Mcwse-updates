import BlockRenderer from "./BlockRenderer.js";
import FurnaceDisplayRenderer from "./FurnaceDisplayRenderer.js";
import EntityRenderManager from "./entity/EntityRenderManager.js";
import MathHelper from "../../util/MathHelper.js";
import Block from "../world/block/Block.js";
import Tessellator from "./Tessellator.js";
import ChunkSection from "../world/ChunkSection.js";
import Random from "../../util/Random.js";
import Vector3 from "../../util/Vector3.js";
import * as THREE from "three";
import { BlockRegistry } from "../world/block/BlockRegistry.js";
import { Water } from 'three/addons/objects/Water.js';
import { disposeGroup, disposeObject } from "../../util/dispose.js";
import { cullSodiumRebuildQueue, getSodiumChunkRebuildBudget, isSodiumClientModEnabled } from "../mods/client/SodiumClientMod.js";

export default class WorldRenderer {

    static THIRD_PERSON_DISTANCE = 4;

    constructor(minecraft, window) {
        this.minecraft = minecraft;
        this.window = window;
        this.chunkSectionUpdateQueue = [];

        // expose THREE reference so other modules can reuse if needed
        this.THREE = THREE;

        this.tessellator = new Tessellator();

        // Load terrain texture
        this.textureTerrain = minecraft.getThreeTexture('../../blocks.png');
        this.textureTerrain.magFilter = THREE.NearestFilter;
        this.textureTerrain.minFilter = THREE.NearestFilter;
        // Fix: blocks.png spritesheet is upside-down, disable automatic vertical flip so UVs match sprite layout
        if (this.textureTerrain) this.textureTerrain.flipY = false;

        // Load sun texture
        this.textureSun = minecraft.getThreeTexture('terrain/sun.png');
        this.textureSun.magFilter = THREE.NearestFilter;
        this.textureSun.minFilter = THREE.NearestFilter;

        // Load moon texture
        this.textureMoon = minecraft.getThreeTexture('terrain/moon.png');
        this.textureMoon.magFilter = THREE.NearestFilter;
        this.textureMoon.minFilter = THREE.NearestFilter;

        // Load break animation texture
        this.textureBreakAnimation = minecraft.getThreeTexture('../../breakanimation.png');
        this.textureBreakAnimation.magFilter = THREE.NearestFilter;
        this.textureBreakAnimation.minFilter = THREE.NearestFilter;
        this.textureBreakAnimation.wrapS = THREE.RepeatWrapping;
        
        // The break animation sheet contains 6 frames. Pre-configure repeat so
        // we only need to update offset.x per frame. Use the stored frame count.
        this._breakAnimationFrameCount = 6;
        this.textureBreakAnimation.repeat.set(1 / this._breakAnimationFrameCount, 1);

        // Load water flow texture (standardized asset name from project_assets)
        this.textureWaterFlow = minecraft.getThreeTexture('../../water_flow (4).png');
        if (this.textureWaterFlow) {
            this.textureWaterFlow.magFilter = THREE.NearestFilter;
            this.textureWaterFlow.minFilter = THREE.NearestFilter;
            this.textureWaterFlow.wrapS = THREE.RepeatWrapping;
            this.textureWaterFlow.wrapT = THREE.RepeatWrapping;
            this.textureWaterFlow.flipY = false;
            // 32 frames vertical strip
            this.textureWaterFlow.repeat.set(1, 1 / 32);
        }

        // Load glint texture for enchantments
        this.textureGlint = minecraft.getThreeTexture('../../enchanted_glint_item.png');
        if (this.textureGlint) {
            this.textureGlint.wrapS = THREE.RepeatWrapping;
            this.textureGlint.wrapT = THREE.RepeatWrapping;
            this.textureGlint.magFilter = THREE.NearestFilter;
            this.textureGlint.minFilter = THREE.NearestFilter;
        }

        // Glint Animation Uniforms
        this.glintMatrix1 = { value: new THREE.Matrix3() };
        this.glintMatrix2 = { value: new THREE.Matrix3() };

        // Load cloud texture
        this.textureClouds = minecraft.getThreeTexture('../../clouds.png');
        if (this.textureClouds) {
            this.textureClouds.magFilter = THREE.NearestFilter;
            this.textureClouds.minFilter = THREE.NearestFilter;
            this.textureClouds.wrapS = THREE.RepeatWrapping;
            this.textureClouds.wrapT = THREE.RepeatWrapping;
        }

        // Load portal texture
        this.texturePortal = minecraft.getThreeTexture('../../nether_portal.png');
        if (this.texturePortal) {
            this.texturePortal.magFilter = THREE.NearestFilter;
            this.texturePortal.minFilter = THREE.NearestFilter;
            this.texturePortal.wrapS = THREE.RepeatWrapping;
            this.texturePortal.wrapT = THREE.RepeatWrapping;
            // 32 frames vertical
            this.texturePortal.repeat.set(1, 1/32);
        }

        // Cloud state
        this.cloudWidth = 1;

        // Map for active spawner internal mobs
        this.spawnerMobEntities = new Map();

        // Cache for sign meshes to prevent per-frame texture allocation
        this.signCache = new Map();

        // Block Renderer
        this.blockRenderer = new BlockRenderer(this);
        this.furnaceDisplayRenderer = new FurnaceDisplayRenderer(this);

        // Entity render manager
        this.entityRenderManager = new EntityRenderManager(this);

        this.equippedProgress = 0;
        this.prevEquippedProgress = 0;
        this.itemToRender = 0;

        this.prevFogBrightness = 0;
        this.fogBrightness = 0;

        this.flushRebuild = false;

        this.rainParams = {
            count: 20000,
            speed: 1.44,
            windX: 0.1,
            windZ: 0.05,
            areaX: 80,
            areaZ: 80,
            height: 40
        };
        this.rainVelocities = [];

        this.initialize();
    }

    createRainTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(14, 0, 4, 32);
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        return tex;
    }

    createWaterNormals() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#8080ff'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const r = Math.random() * 40 + 10;
            const red = 128 + (Math.random() * 100 - 50);
            const green = 128 + (Math.random() * 100 - 50);
            ctx.fillStyle = `rgba(${Math.floor(red)}, ${Math.floor(green)}, 255, 0.1)`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    initialize() {
        // Create world camera
        this.camera = new THREE.PerspectiveCamera(0, 1, 0.001, 1000);
        this.camera.rotation.order = 'ZYX';
        this.camera.up = new THREE.Vector3(0, 0, 1);

        // Frustum
        this.frustum = new THREE.Frustum();

        // Create background scene
        this.background = new THREE.Scene();
        this.background.matrixAutoUpdate = false;

        // Create world scene
        this.scene = new THREE.Scene();
        this.scene.matrixAutoUpdate = false;

        // Create overlay for first person model rendering
        this.overlay = new THREE.Scene();
        this.overlay.matrixAutoUpdate = false;

        // Create web renderer
        this.webRenderer = new THREE.WebGLRenderer({
            canvas: this.window.canvas,
            antialias: false,
            alpha: true,
            preserveDrawingBuffer: true
        });
        
        // Oculus Quest 2 / WebXR Support
        this.webRenderer.xr.enabled = true;

        // Settings
        this.webRenderer.setSize(this.window.width, this.window.height);
        // No scene lights cast shadows in the voxel renderer. Keeping a shadow
        // framebuffer allocated only increases GPU memory and bandwidth.
        this.webRenderer.shadowMap.enabled = false;
        this.webRenderer.autoClear = false;
        this.webRenderer.sortObjects = false;
        this.webRenderer.setClearColor(0x000000, 0);
        this.webRenderer.clear();

        // Create break animation mesh
        let geometryBreak = new THREE.BoxGeometry(1.002, 1.002, 1.002);
        this.breakAnimationMaterial = new THREE.MeshBasicMaterial({
            map: this.textureBreakAnimation,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        this.breakAnimationMesh = new THREE.Mesh(geometryBreak, this.breakAnimationMaterial);
        this.breakAnimationMesh.visible = false;
        this.scene.add(this.breakAnimationMesh);

        // Create sky
        this.generateSky();

        // Create block hit box
        let geometry = new THREE.BoxGeometry(1, 1, 1);
        let edges = new THREE.EdgesGeometry(geometry);
        this.blockHitBox = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: 0x000000
        }));
        this.scene.add(this.blockHitBox);

        // Debug geometry helpers
        this.debugGroup = new THREE.Group();
        this.scene.add(this.debugGroup);
        this.chunkBorderMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        this.hitboxMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });

        // Initialize Snow System
        this.initSnow();

        // Structure Outline
        this.structureOutlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        this.structureOutlines = new THREE.Group();
        this.scene.add(this.structureOutlines);

        // Fishing Line
        const lineMat = new THREE.LineBasicMaterial({ color: 0x222222 });
        const lineGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0,0,0,0,0,0], 3));
        this.fishingLine = new THREE.Line(lineGeo, lineMat);
        this.fishingLine.visible = false;
        this.fishingLine.frustumCulled = false;
        this.scene.add(this.fishingLine);

        // Realistic Cloud Shader Plane
        const cloudGeo = new THREE.PlaneGeometry(4000, 4000, 32, 32);
        this.realisticCloudMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(1, 1, 1) },
                nightFactor: { value: 0.0 },
                rainFactor: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float nightFactor;
                uniform float rainFactor;
                varying vec2 vUv;

                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
                }

                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), f.x),
                               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
                }

                float fbm(vec2 p) {
                    float v = 0.0;
                    float a = 0.5;
                    for (int i = 0; i < 6; i++) {
                        v += a * noise(p);
                        p *= 2.0;
                        a *= 0.5;
                    }
                    return v;
                }

                void main() {
                    vec2 uv = vUv * (25.0 + 10.0 * rainFactor);
                    uv.x += time * (0.01 + 0.03 * rainFactor);
                    uv.y += time * 0.006;
                    
                    float n = fbm(uv + fbm(uv * 0.6 + time * 0.04));
                    
                    // Create puffy 3D shadow effect using derivatives
                    float dX = dFdx(n) * 10.0;
                    float dY = dFdy(n) * 10.0;
                    float shadow = clamp(1.0 - (dX + dY), 0.5, 1.0);
                    
                    float threshold = 0.4 - (0.1 * rainFactor);
                    float alpha = smoothstep(threshold, threshold + 0.25, n) * (0.8 + 0.2 * rainFactor);
                    
                    // Dynamic coloring based on time and weather
                    vec3 finalColor = color;
                    finalColor *= mix(1.0, 0.15, nightFactor); // Darken at night
                    finalColor *= mix(1.0, 0.4, rainFactor);  // Heavier look during rain
                    finalColor *= (0.7 + 0.3 * shadow);       // Puffy internal shadows
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `
        });
        this.realisticCloudMesh = new THREE.Mesh(cloudGeo, this.realisticCloudMaterial);
        this.realisticCloudMesh.rotation.x = Math.PI / 2;
        this.realisticCloudMesh.position.y = 350; // Raised from 280
        this.realisticCloudMesh.visible = false;
        this.scene.add(this.realisticCloudMesh);

        // Realistic Water Setup
        const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 16, 16);
        this.realisticWaterMesh = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: this.createWaterNormals(),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x004d99,
                distortionScale: 3.7,
                fog: true
            }
        );
        this.realisticWaterMesh.rotation.x = - Math.PI / 2;
        this.realisticWaterMesh.position.y = 63.8; // seaLevel (64) - 0.2
        this.realisticWaterMesh.visible = false;
        this.scene.add(this.realisticWaterMesh);

        // Setup Lightning Bolt Mesh
        const lightningMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true });
        this.lightningBolt = new THREE.Line(new THREE.BufferGeometry(), lightningMat);
        this.lightningBolt.visible = false;
        this.lightningBolt.frustumCulled = false;
        this.scene.add(this.lightningBolt);
        this.lightningFlashTimer = 0;

        // Setup Rain System
        this.initRain();
    }

    setRealismMode(enabled){this.minecraft.realismMode=!!enabled;Tessellator.realismUniform.value=enabled?1:0;}

    initRain() {
        const tex = this.minecraft.getThreeTexture('../../rainweathe.png');
        if (tex) {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
        }

        this.rainGridSize = 48; // Increased grid for better coverage in nearby chunks
        const count = this.rainGridSize * this.rainGridSize;
        
        // Single unit quad (0..1)
        const geometry = new THREE.PlaneGeometry(1, 1);
        
        this.rainMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            uniforms: {
                map: { value: tex },
                time: { value: 0 },
                nightFactor: { value: 0 },
                playerPos: { value: new THREE.Vector3() },
                viewDistance: { value: 24.0 }
            },
            vertexShader: `
                attribute vec4 instanceData; // x: uOffset, y: vOffset, z: speed, w: light
                varying vec2 vUv;
                varying float vAlpha;
                varying float vLight;
                uniform float time;
                uniform vec3 playerPos;
                uniform float viewDistance;

                void main() {
                    // Extract position and scale from instance matrix
                    vec4 worldPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                    float hScale = length(vec3(instanceMatrix[1][0], instanceMatrix[1][1], instanceMatrix[1][2]));
                    
                    // Billboarding: Quad always faces camera horizontally
                    vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
                    vec3 cameraUp = vec3(0.0, 1.0, 0.0);
                    
                    vec3 billboardPos = worldPos.xyz 
                        + cameraRight * position.x
                        + cameraUp * (position.y * hScale);

                    // UV animation: scroll downward over time with per-instance speed and offset
                    vUv = uv;
                    vUv.x += instanceData.x;
                    
                    // Higher tiling factor for better density
                    vUv.y *= 3.0; 

                    // Apply scrolling offset after tiling to decouple speed from density
                    // Multiplier increased by 20% (0.65 -> 0.78) for faster falling motion
                    // Use addition so texture pixels descend relative to the geometry
                    vUv.y += (time * 0.78 * instanceData.z) + instanceData.y;

                    // Distance fade
                    float dist = distance(worldPos.xz, playerPos.xz);
                    vAlpha = 1.0 - clamp(dist / viewDistance, 0.0, 1.0);
                    vLight = instanceData.w;

                    gl_Position = projectionMatrix * viewMatrix * vec4(billboardPos, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D map;
                uniform float nightFactor;
                varying vec2 vUv;
                varying float vAlpha;
                varying float vLight;

                void main() {
                    vec4 texColor = texture2D(map, vUv);
                    // Standard black-to-alpha conversion for the specific asset provided
                    if (texColor.r + texColor.g + texColor.b < 0.05) discard;
                    
                    // Light level modulation + nighttime darkening
                    float brightness = mix(vLight, vLight * 0.25, nightFactor);
                    
                    // Apply a blue tint to the rain texture
                    vec3 blueTint = vec3(0.7, 0.85, 1.25);
                    
                    gl_FragColor = vec4(texColor.rgb * blueTint * brightness, texColor.a * vAlpha * 0.7);
                }
            `
        });

        this.rainSystem = new THREE.InstancedMesh(geometry, this.rainMaterial, count);
        this.rainSystem.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.rainSystem.visible = false;
        this.rainSystem.frustumCulled = false;
        
        // Custom attribute for instance-specific randomness
        const dataArray = new Float32Array(count * 4);
        for(let i=0; i<count; i++) {
            dataArray[i*4 + 0] = Math.random(); // uOffset
            dataArray[i*4 + 1] = Math.random(); // vOffset
            dataArray[i*4 + 2] = 0.9 + Math.random() * 0.4; // Speed var
            dataArray[i*4 + 3] = 1.0; // Light (placeholder)
        }
        this.rainSystem.geometry.setAttribute('instanceData', new THREE.InstancedBufferAttribute(dataArray, 4));
        
        this.scene.add(this.rainSystem);
    }

    spawnLightning(x, z) {
        const world = this.minecraft.world;
        const groundY = world.getHeightAt(x, z);
        const skyY = 128;
        
        const segments = 12;
        const points = [];
        let curX = x;
        let curZ = z;
        let curY = skyY;
        
        const stepY = (skyY - groundY) / segments;
        
        points.push(new THREE.Vector3(x, skyY, z));
        
        for (let i = 1; i < segments; i++) {
            curY -= stepY;
            // Add jagged jitter
            curX += (Math.random() - 0.5) * 4.5;
            curZ += (Math.random() - 0.5) * 4.5;
            points.push(new THREE.Vector3(curX, curY, curZ));
        }
        
        points.push(new THREE.Vector3(x, groundY, z));
        
        this.lightningBolt.geometry.setFromPoints(points);
        this.lightningBolt.visible = true;
        this.lightningFlashTimer = 5; // 5 ticks of flash

        // Thunder sound delay based on distance
        const p = this.minecraft.player;
        const dist = Math.sqrt((p.x - x)**2 + (p.z - z)**2);
        const delay = (dist / 340) * 1000; // Speed of sound approx

        setTimeout(() => {
            this.minecraft.soundManager.playSound("ambient.weather.thunder", x, groundY, z, 10.0, 0.8 + Math.random() * 0.4);
        }, delay);

        // Chance to strike fire
        if (Math.random() < 0.3) {
            world.setBlockAt(Math.floor(x), groundY, Math.floor(z), BlockRegistry.FIRE.getId());
        }
    }

    updateRain(partialTicks) {
        if (!this.rainSystem || !this.minecraft.world || !this.minecraft.player) return;
        if (this.minecraft.isPaused()) return;

        const player = this.minecraft.player;
        const world = this.minecraft.world;
        const px = Math.floor(player.x);
        const pz = Math.floor(player.z);

        // Weather check
        const { isRaining } = this.getWeatherFactors(player);

        this.rainSystem.visible = isRaining;
        if (!isRaining) return;

        // Update Uniforms
        const angle = world.getCelestialAngle(partialTicks);
        const nightFactor = MathHelper.clamp(Math.sin((angle - 0.2) * Math.PI * 1.5) * 2.0, 0.0, 1.0);
        this.rainMaterial.uniforms.time.value = (performance.now() / 1000.0);
        this.rainMaterial.uniforms.nightFactor.value = nightFactor;
        this.rainMaterial.uniforms.playerPos.value.set(player.x, player.y, player.z);
        this.rainMaterial.uniforms.viewDistance.value = (this.rainGridSize / 2.0);

        // Update Instances
        const matrix = new THREE.Matrix4();
        const dataAttr = this.rainSystem.geometry.getAttribute('instanceData');
        const grid = this.rainGridSize;
        const half = grid / 2;
        const rainHeight = 25.0;

        for (let i = 0; i < grid; i++) {
            for (let j = 0; j < grid; j++) {
                const idx = i * grid + j;
                const wx = px + i - half;
                const wz = pz + j - half;
                
                // Find top level at this column
                const topY = world.getHeightAt(wx, wz);
                
                // Position at the top, stretch vertically to cover player's view
                // Ensure rain quads cover player's height but stop at ground
                let baseLow = topY;
                let baseHigh = Math.max(topY + rainHeight, player.y + 15);
                let actualHeight = baseHigh - baseLow;
                let quadY = baseLow + actualHeight / 2;
                
                matrix.makeTranslation(wx + 0.5, quadY, wz + 0.5);
                matrix.scale(new THREE.Vector3(1, actualHeight, 1));
                this.rainSystem.setMatrixAt(idx, matrix);
                
                // Update light level for this column
                dataAttr.setW(idx, world.getLightBrightness(wx, topY + 1, wz));
            }
        }
        
        this.rainSystem.instanceMatrix.needsUpdate = true;
        dataAttr.needsUpdate = true;
    }

    initSnow() {
        // Create textures for snow particles
        const size = 4; // 4x4 pixel texture is enough for 3x3 patterns
        
        // Type 1: Plus (+) with no center
        // . # .
        // # . #
        // . # .
        const canvas1 = document.createElement('canvas');
        canvas1.width = size; canvas1.height = size;
        const ctx1 = canvas1.getContext('2d');
        ctx1.fillStyle = 'white';
        ctx1.fillRect(1, 0, 1, 1); // Top
        ctx1.fillRect(0, 1, 1, 1); // Left
        ctx1.fillRect(2, 1, 1, 1); // Right
        ctx1.fillRect(1, 2, 1, 1); // Bottom
        const tex1 = new THREE.CanvasTexture(canvas1);
        tex1.magFilter = THREE.NearestFilter;
        tex1.minFilter = THREE.NearestFilter;

        // Type 2: X shape
        // # . #
        // . # .
        // # . #
        const canvas2 = document.createElement('canvas');
        canvas2.width = size; canvas2.height = size;
        const ctx2 = canvas2.getContext('2d');
        ctx2.fillStyle = 'white';
        ctx2.fillRect(0, 0, 1, 1); // TL
        ctx2.fillRect(2, 0, 1, 1); // TR
        ctx2.fillRect(1, 1, 1, 1); // Center
        ctx2.fillRect(0, 2, 1, 1); // BL
        ctx2.fillRect(2, 2, 1, 1); // BR
        const tex2 = new THREE.CanvasTexture(canvas2);
        tex2.magFilter = THREE.NearestFilter;
        tex2.minFilter = THREE.NearestFilter;

        // Create particle systems
        const particleCount = 1500;
        this.snowSystems = [];

        // Helper to create system
        const createSystem = (texture) => {
            const geo = new THREE.BufferGeometry();
            const positions = [];
            const velocities = [];
            
            for (let i = 0; i < particleCount / 2; i++) {
                // Random positions in a box around 0,0,0
                positions.push(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                );
                velocities.push(0.02 + Math.random() * 0.08); // Falling speed
            }
            
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            
            const mat = new THREE.PointsMaterial({
                map: texture,
                size: 0.15, // Small size
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                sizeAttenuation: true,
                alphaTest: 0.5
            });
            
            const points = new THREE.Points(geo, mat);
            points.userData = { velocities: velocities };
            points.visible = false; // Hidden by default
            points.frustumCulled = false; // Fix disappearance when looking away from origin
            this.scene.add(points);
            return points;
        };

        this.snowSystems.push(createSystem(tex1));
        this.snowSystems.push(createSystem(tex2));
    }

    updateSnow(partialTicks) {
        if (!this.minecraft.world || !this.minecraft.player) return;
        if (this.minecraft.isPaused()) return; // Freeze weather

        const player = this.minecraft.player;
        const px = player.x;
        const py = player.y;
        const pz = player.z;

        // Check biome using world generator logic
        let isSnowing = this.minecraft.world.isSnowBiome(px, pz);
        
        // Apply weather override
        if (this.minecraft.world.weather === "snow") isSnowing = true;
        else if (this.minecraft.world.weather === "clear") isSnowing = false;

        // Update particles
        const range = 16; // 16 block radius box
        const height = 16;

        for (const points of this.snowSystems) {
            if (!isSnowing) {
                points.visible = false;
                continue;
            }
            points.visible = true;

            const positions = points.geometry.attributes.position.array;
            const velocities = points.userData.velocities;

            for (let i = 0; i < velocities.length; i++) {
                let y = positions[i * 3 + 1];
                
                // Fall down
                y -= velocities[i];

                // Wrap around player
                // Calculate relative pos
                let dx = positions[i * 3] - px;
                let dz = positions[i * 3 + 2] - pz;
                let dy = y - py;

                // Wrap X - Use loop to handle distant teleports or fast movement
                while (positions[i * 3] - px > range) positions[i * 3] -= range * 2;
                while (positions[i * 3] - px < -range) positions[i * 3] += range * 2;
                
                // Wrap Z
                while (positions[i * 3 + 2] - pz > range) positions[i * 3 + 2] -= range * 2;
                while (positions[i * 3 + 2] - pz < -range) positions[i * 3 + 2] += range * 2;

                // Wrap Y
                if (dy < -5) { // Reset if too far below
                    y = py + height;
                    positions[i * 3] = px + (Math.random() - 0.5) * range * 2;
                    positions[i * 3 + 2] = pz + (Math.random() - 0.5) * range * 2;
                }

                positions[i * 3 + 1] = y;
            }
            points.geometry.attributes.position.needsUpdate = true;
        }
    }

    getWeatherFactors(player) {
        const world = this.minecraft.world;
        if (!world) return { isSnowing: false, isRaining: false };
        const px = Math.floor(player.x);
        const pz = Math.floor(player.z);

        let isSnowing = world.isSnowBiome(px, pz);
        if (world.weather === "snow") isSnowing = true;
        else if (world.weather === "clear" || world.weather === "rain") isSnowing = false;

        let isRaining = !isSnowing && !world.isDesertBiome(px, pz);
        if (world.weather === "rain") isRaining = true;
        else if (world.weather === "clear" || world.weather === "snow") isRaining = false;

        return { isSnowing, isRaining };
    }

    /**
     * Rebuild queued chunk section meshes within a per-frame time budget.
     * The queue is sorted farthest-first, so pop() yields the nearest.
     */
    processRebuildQueue() {
        const queue = this.chunkSectionUpdateQueue;
        if (queue.length === 0) return;

        const isLoading = !!this.minecraft.loadingScreen;
        const s = this.minecraft.settings;
        const perf = this.minecraft.performanceFactor || 1.0;
        if (isSodiumClientModEnabled()) cullSodiumRebuildQueue(queue, this);
        const budget = getSodiumChunkRebuildBudget(s, perf, isLoading, queue.length);
        const start = performance.now();
        let priorityBuilt = 0;

        while (queue.length > 0) {
            const section = queue[queue.length - 1];
            if (!section) { queue.pop(); continue; }
            const isPriority = section.priority && priorityBuilt < 12;
            if (!isPriority && performance.now() - start > budget) break;

            queue.pop();
            section.inUpdateQueue = false;
            section.priority = false;
            if (!section.chunk.loaded) continue;
            try {
                section.rebuild(this);
            } catch (e) {
                console.error("Chunk rebuild failed at " + section.x + "," + section.y + "," + section.z, e);
            }
            if (isPriority) priorityBuilt++;
        }
    }

    render(partialTicks) {
        this.webRenderer.clear();

        // Apply pending light edits, then re-mesh (nearest first, budgeted)
        if (this.minecraft.world) this.minecraft.world.updateLights();
        this.processRebuildQueue();

        const isPaused = this.minecraft.isPaused();

        // Calculate delta once per full render pass (shared by all players)
        const now = performance.now();
        if (!this._lastFrameTime) this._lastFrameTime = now;
        const delta = (now - this._lastFrameTime) / 1000;
        this._lastFrameTime = now;
        this.animationDelta = isPaused ? 0 : delta;
        
        // Use getSize to get actual internal render resolution
        const size = new THREE.Vector2();
        this.webRenderer.getSize(size);
        const fullWidth = size.x;
        const fullHeight = size.y;

        if (this.minecraft.player2) {
            this.webRenderer.setScissorTest(true);
            const mode = this.minecraft.settings.splitscreenMode;

            if (mode === 'horizontal') {
                // Side by Side
                // Player 1 (Left half)
                this.webRenderer.setViewport(0, 0, fullWidth / 2, fullHeight);
                this.webRenderer.setScissor(0, 0, fullWidth / 2, fullHeight);
                this.renderSceneForPlayer(this.minecraft.player, partialTicks, (fullWidth / 2) / fullHeight);

                // Player 2 (Right half)
                this.webRenderer.setViewport(fullWidth / 2, 0, fullWidth / 2, fullHeight);
                this.webRenderer.setScissor(fullWidth / 2, 0, fullWidth / 2, fullHeight);
                this.renderSceneForPlayer(this.minecraft.player2, partialTicks, (fullWidth / 2) / fullHeight);
            } else {
                // Top - Bottom
                // Player 1 (Top half - ThreeJS viewport 0,0 is bottom-left)
                this.webRenderer.setViewport(0, fullHeight / 2, fullWidth, fullHeight / 2);
                this.webRenderer.setScissor(0, fullHeight / 2, fullWidth, fullHeight / 2);
                this.renderSceneForPlayer(this.minecraft.player, partialTicks, fullWidth / (fullHeight / 2));

                // Player 2 (Bottom half)
                this.webRenderer.setViewport(0, 0, fullWidth, fullHeight / 2);
                this.webRenderer.setScissor(0, 0, fullWidth, fullHeight / 2);
                this.renderSceneForPlayer(this.minecraft.player2, partialTicks, fullWidth / (fullHeight / 2));
            }
            
            this.webRenderer.setScissorTest(false);
            // Restore full viewport for potential shared passes
            this.webRenderer.setViewport(0, 0, fullWidth, fullHeight);
        } else {
            this.webRenderer.setViewport(0, 0, fullWidth, fullHeight);
            this.renderSceneForPlayer(this.minecraft.player, partialTicks, fullWidth / fullHeight);
        }
    }

    renderSceneForPlayer(player, partialTicks, aspect) {
        this.activeViewer = player;
        
        // Hide all first-person hands in overlay before rendering for the current viewer
        this.overlay.children.forEach(c => {
            if (c.name === "firstPersonGroup" || c.name === "firstPersonOffhandGroup") {
                c.visible = false;
            }
        });
        const isPaused = this.minecraft.isPaused();

        const { isSnowing, isRaining } = this.getWeatherFactors(player);
        this.currentRainFactor = isRaining ? 1.0 : 0.0;

        // Update Global Shader Uniforms and texture animations only if not paused
        if (!isPaused) {
            Tessellator.timeUniform.value = (performance.now() / 1000.0);

            // Update Water Texture Animation (Spritesheet)
            let waterTess = this.blockRenderer.textureTessellators.get("../../water_flow (4).png");
            if (waterTess && waterTess.material.map) {
                let tex = waterTess.material.map;
                let frameCount = 32;
                let frameHeight = 1.0 / frameCount;
                let currentFrame = Math.floor(Date.now() / 40) % frameCount;
                // Offset is applied through the UV transform uniform; no
                // texture re-upload needed.
                tex.offset.y = (frameCount - 1 - currentFrame) * frameHeight;
            }

            // Update Fire Animation
            if (this.fireTexture) {
                let frameCount = this.fireTexture.userData.frameCount || 31;
                let frameHeight = 1.0 / frameCount;
                let currentFrame = Math.floor(Date.now() / 40) % frameCount;
                this.fireTexture.offset.y = (frameCount - 1 - currentFrame) * frameHeight;
            }

            // Update Magma Animation
            let magmaTess = this.blockRenderer.textureTessellators.get("../../magma3sheet.png");
            if (magmaTess && magmaTess.material.map && magmaTess.material.map.image) {
                let tex = magmaTess.material.map;
                let img = tex.image;
                let frameCount = 3;
                
                if (img.width > 0 && img.height > 0) {
                    let isVertical = img.height > img.width;
                    let step = 1.0 / frameCount;
                    let currentFrame = Math.floor(Date.now() / 250) % frameCount;

                    const wrapS = isVertical ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
                    const wrapT = isVertical ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
                    if (isVertical) {
                        tex.repeat.set(1, step);
                        tex.offset.set(0, (frameCount - 1 - currentFrame) * step);
                    } else {
                        tex.repeat.set(step, 1);
                        tex.offset.set(currentFrame * step, 0);
                    }
                    // Only re-upload when the wrap mode actually changes
                    if (tex.wrapS !== wrapS || tex.wrapT !== wrapT) {
                        tex.wrapS = wrapS;
                        tex.wrapT = wrapT;
                        tex.needsUpdate = true;
                    }
                }
            }

            // Update Portal Animation
            if (this.texturePortal) {
                let frameCount = 32;
                let frameHeight = 1.0 / frameCount;
                let currentFrame = Math.floor(Date.now() / 50) % frameCount;
                this.texturePortal.offset.y = (frameCount - 1 - currentFrame) * frameHeight;
            }

            // Update Command Block Animation. All four faces share one frame
            // index so the block reads as a single animation rather than four
            // textures drifting out of step.
            {
                let frameCount = 4;
                let frameHeight = 1.0 / frameCount;
                let currentFrame = Math.floor(Date.now() / 100) % frameCount;
                let offsetY = (frameCount - 1 - currentFrame) * frameHeight;
                for (let name of [
                    "../../command_block_front.png",
                    "../../command_block_back.png",
                    "../../command_block_side.png",
                    "../../command_block_conditional.png"
                ]) {
                    let tess = this.blockRenderer.textureTessellators.get(name);
                    if (tess && tess.material.map) tess.material.map.offset.y = offsetY;
                }
            }
        }
        
        Tessellator.wavingEnabledUniform.value = this.minecraft.settings.wavingFoliage ? 1.0 : 0.0;

        // Update Weather
        this.updateSnow(partialTicks);
        this.updateRain(partialTicks);



        // Setup camera
        this.orientCamera(player, partialTicks, aspect);

        // Render chunks
        let cameraChunkX = Math.floor(player.x) >> 4;
        let cameraChunkZ = Math.floor(player.z) >> 4;
        this.renderChunks(cameraChunkX, cameraChunkZ);

        // Render sky
        this.renderSky(partialTicks);

        // Render target block
        this.renderBlockHitBox(player, partialTicks);

        // Render Spawner Mobs
        this.renderSpawnerMobs(partialTicks);

        // Render Structure Outlines
        this.renderStructureOutlines(partialTicks);

        // Render Fishing Line
        this.renderFishingLine(partialTicks);

        // Render tech block billboards
        this.renderTechBillboards(player, partialTicks);

        // Render breaking animation
        this.renderBreakingAnimation(partialTicks);

        // Render sign texts
        this.renderSignTexts(partialTicks);

        // Floating smelting readouts above active furnaces
        this.furnaceDisplayRenderer.render(partialTicks);

        // Animate dropped items (bob + slow yaw)
        try {
            if (this.minecraft.world && Array.isArray(this.minecraft.world.droppedItems)) {
                let time = performance.now() / 1000;
                for (let i = this.minecraft.world.droppedItems.length - 1; i >= 0; i--) {
                    let item = this.minecraft.world.droppedItems[i];
                    let mesh = item.mesh;
                    if (!mesh || !mesh.userData) continue;

                    let interpolatedX = item.prevX + (item.x - item.prevX) * partialTicks;
                    let interpolatedY = item.prevY + (item.y - item.prevY) * partialTicks;
                    let interpolatedZ = item.prevZ + (item.z - item.prevZ) * partialTicks;

                    // bobbing motion
                    let hoverOffset = 0.25;
                    mesh.position.y = interpolatedY + hoverOffset + Math.sin(time * mesh.userData.bobSpeed + mesh.userData.bobOffset) * mesh.userData.bobHeight;
                    mesh.position.x = interpolatedX;
                    mesh.position.z = interpolatedZ;
                    
                    // Spin 3D items
                    if (mesh.userData.is3D) {
                        mesh.rotation.y = time * mesh.userData.rotateSpeed;
                    }

                    // Apply Dynamic Lighting
                    let light = item.world.getLightBrightness(Math.floor(item.x), Math.floor(item.y + 0.2), Math.floor(item.z));
                    if (player && player.activeEffects.has("night_vision")) {
                        light = 1.0;
                    }
                    let globalBrightness = this.minecraft.settings.brightness;
                    const dev = this.minecraft.devTools.lighting;

                    // Match synchronized shadow depth and brightness logic
                    let brightness = Math.pow(light, dev.gamma);
                    brightness = brightness + (1.0 - brightness) * globalBrightness;
                    brightness = Math.max(0.1, brightness);

                    mesh.traverse(child => {
                        if ((child.isMesh || child.isSprite) && child.material) {
                            if (child.material.color.r !== brightness) {
                                child.material.color.setScalar(brightness);
                            }
                        }
                    });
                }
            }
        } catch (e) {
            // ignore animation errors
        }

        // Hide all entities and make them visible during rendering
        for (let entity of this.minecraft.world.entities) {
            entity.renderer.group.visible = false;
        }

        // Render entities
        let showHitboxes = this.minecraft.settings.showEntityHitboxes;
        if (showHitboxes) disposeGroup(this.debugGroup);
        for (let entity of this.minecraft.world.entities) {
            // Do not render entities that are currently in unloaded chunks
            if (entity.unloadedTicks > 0) {
                continue;
            }

            if (entity === player && this.minecraft.settings.thirdPersonView === 0) {
                // Still show hitbox for local player in first person if enabled
                if (showHitboxes) {
                    let bb = entity.boundingBox;
                    let helper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(bb.maxX - bb.minX, bb.maxY - bb.minY, bb.maxZ - bb.minZ)), 0xFFFFFF);
                    helper.position.set(entity.x, entity.y + (bb.maxY - bb.minY) / 2, entity.z);
                    this.debugGroup.add(helper);
                }
                continue;
            }

            // Render entity
            entity.renderer.render(entity, partialTicks);
            
            // Respect invisibility effect (handled inside individual renderers or via effect check)
            const isInvisible = (entity.activeEffects && entity.activeEffects.has("invisibility")) || (entity.gameMode === 3);
            const isLocalFirstPerson = (entity === this.activeViewer) && this.minecraft.settings.thirdPersonView === 0;

            if (isInvisible && !isLocalFirstPerson) {
                entity.renderer.group.visible = false;
            } else {
                entity.renderer.group.visible = true;
            }

            if (showHitboxes) {
                let bb = entity.boundingBox;
                let helper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(bb.maxX - bb.minX, bb.maxY - bb.minY, bb.maxZ - bb.minZ)), 0xFFFFFF);
                helper.position.set(entity.x, entity.y + (bb.maxY - bb.minY) / 2, entity.z);
                this.debugGroup.add(helper);
            }
        }

        // Render particles
        if (this.minecraft.particleManager) {
            this.minecraft.particleManager.render(this.camera, partialTicks);
        }

        // Render hand
        this.renderHand(player, partialTicks);

        // Apply dynamic lighting to the hand/item groups for the current player
        let handBrightness = Math.max(0.4, player.getEntityBrightness());
        [player.renderer.firstPersonGroup, player.renderer.firstPersonOffhandGroup].forEach(g => {
            g.traverse(child => {
                if (child.isMesh && child.material && child.material.color) {
                    // Update the color scalar to reflect current world light level
                    child.material.color.setScalar(handBrightness);
                }
            });
        });

        // Render background scene
        this.webRenderer.render(this.background, this.camera);

        // Render actual scene
        this.webRenderer.render(this.scene, this.camera);

        // Render overlay with a static FOV
        const prevFov = this.camera.fov;
        this.camera.fov = 70;
        this.camera.updateProjectionMatrix();
        this.webRenderer.clearDepth(); 
        this.webRenderer.render(this.overlay, this.camera);
        // Restore fov for potential subsequent passes
        this.camera.fov = prevFov;
    }

    // General camera-source entry point. Player gameplay continues through the
    // original renderSceneForPlayer path; non-player views use the clean path.
    renderScene(view, partialTicks = 0, options = {}) {
        if (view && view.entity) return this.renderSceneForPlayer(view.entity, partialTicks, options.aspect);
        return this.renderCleanView(view, options.target, options.width, options.height);
    }

    renderCleanView(view, target, width, height, partialTicks = 0) {
        if (!view || !target || !this.minecraft.world) return;
        const cam = this.camera;
        cam.aspect = width / height;
        cam.fov = Math.max(20, Math.min(120, view.fov || 70));
        cam.position.set(view.position.x, view.position.y, view.position.z);
        cam.rotation.order = 'YXZ';
        cam.rotation.set(-MathHelper.toRadians(view.pitch || 0), -MathHelper.toRadians((view.yaw || 0) + 180), MathHelper.toRadians(view.roll || 0));
        cam.updateProjectionMatrix(); cam.updateMatrixWorld();
        this.frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));

        // Camera passes must never call renderChunks(): that method owns chunk
        // loading/unloading for the gameplay viewer. Instead, temporarily adjust
        // visibility only among chunks already loaded for the world owner, then
        // restore every flag after the offscreen pass.
        const chunkVisibilityState=[];
        const player=this.minecraft.player;
        const playerCX=Math.floor(player.x)>>4, playerCZ=Math.floor(player.z)>>4;
        const cameraCX=Math.floor(view.position.x)>>4, cameraCZ=Math.floor(view.position.z)>>4;
        const normalDistance=this.minecraft.settings.viewDistance;
        const renderDistance=this.minecraft.settings.lodRendering===false?normalDistance:Math.max(normalDistance,Math.ceil((this.minecraft.settings.lodRenderDistance||64)/16));
        for(const chunk of this.minecraft.world.chunks.values()){
            const sectionStates=chunk.sections.map(section=>section?.group?.visible??false);
            chunkVisibilityState.push({chunk,chunkVisible:chunk.group.visible,sectionStates});
            const inPlayerWorld=chunk.loaded&&Math.abs(chunk.x-playerCX)<renderDistance&&Math.abs(chunk.z-playerCZ)<renderDistance;
            const inCameraRange=Math.abs(chunk.x-cameraCX)<renderDistance&&Math.abs(chunk.z-cameraCZ)<renderDistance;
            chunk.group.visible=inPlayerWorld&&inCameraRange;
            for(const section of chunk.sections){
                if(!section?.group)continue;
                section.group.visible=chunk.group.visible&&!section.isEmpty()&&this.frustum.intersectsBox(section.boundingBox);
            }
        }

        const hidden = [this.blockHitBox, this.breakAnimationMesh, this.debugGroup, this.structureOutlines, this.overlay];
        const states = hidden.map(o => o ? o.visible : false);
        hidden.forEach(o => { if (o) o.visible = false; });
        const sourceModel = this.minecraft.cameraManager?.models?.get(view.id);
        const sourceVisible = sourceModel?.visible; if (sourceModel) sourceModel.visible = false;
        let sourcePlayerGroup=null, sourcePlayerVisible=false;
        if (view.type === "player" || view.type === "cameraman") {
            let sourcePlayer = view.id === "player:local" ? this.minecraft.player : this.minecraft.multiplayer?.remotePlayers?.get(String(view.id).replace(/^player:/,""));
            sourcePlayerGroup=sourcePlayer?.renderer?.group||null;
            if(sourcePlayerGroup){sourcePlayerVisible=sourcePlayerGroup.visible;sourcePlayerGroup.visible=false;}
        }

        // The normal first-person pass intentionally skips the local player's
        // body. A world camera must render that player so they are visible when
        // standing in front of a static production camera.
        const localPlayer = this.minecraft.player;
        // The host's local body is skipped by the normal first-person gameplay
        // pass. Render it for static cameras and for another player's POV, but
        // never for the host's own POV.
        const showLocalPlayer = view.id !== "player:local" && localPlayer?.renderer?.group;
        const localGroupVisible = showLocalPlayer ? localPlayer.renderer.group.visible : false;
        const previousViewer = this.activeViewer;
        if (showLocalPlayer) {
            this.activeViewer = null;
            localPlayer.renderer.render(localPlayer, partialTicks);
            localPlayer.renderer.group.visible = true;
        }

        const oldTarget = this.webRenderer.getRenderTarget();
        this.webRenderer.setScissorTest(false); this.webRenderer.setViewport(0, 0, width, height);
        this.webRenderer.setRenderTarget(target); this.webRenderer.clear();
        this.webRenderer.render(this.background, cam); this.webRenderer.render(this.scene, cam);
        this.webRenderer.setRenderTarget(oldTarget);
        if (showLocalPlayer) localPlayer.renderer.group.visible = localGroupVisible;
        if(sourcePlayerGroup)sourcePlayerGroup.visible=sourcePlayerVisible;
        this.activeViewer = previousViewer;
        for(const state of chunkVisibilityState){state.chunk.group.visible=state.chunkVisible;state.chunk.sections.forEach((section,i)=>{if(section?.group)section.group.visible=state.sectionStates[i];});}
        hidden.forEach((o,i)=>{if(o)o.visible=states[i];}); if(sourceModel)sourceModel.visible=sourceVisible;
    }

    renderBroadcastView(view, canvas, partialTicks = 0, readbackKind = 'broadcast') {
        const width = canvas.width || 640, height = canvas.height || 360;

        // The world owner's normal Player POV intentionally mirrors their
        // complete game presentation, including first-person hands and UI.
        // Static cameras and all cameraman sources continue through the clean
        // render-target path below.
        if (view.id === "player:local" && view.type === "player") {
            const ctx = canvas.getContext('2d', {alpha:false});
            const layers = [
                this.window.canvas,
                this.window.canvas2d,
                this.window.canvasItems,
                this.window.canvasCounts
            ];
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);
            for (const layer of layers) {
                if (layer && layer.width > 0 && layer.height > 0) {
                    ctx.drawImage(layer, 0, 0, width, height);
                }
            }

            // The browser's native pointer is not part of any canvas. Draw a
            // small cursor into the owner-POV composite whenever pointer lock
            // is released (menus/inventory) or a controller cursor is active.
            if (!this.window.actualMouseLocked || this.minecraft.usingControllerCursor) {
                const sx = width / Math.max(1, this.window.width);
                const sy = height / Math.max(1, this.window.height);
                const x = this.window.mouseX * sx;
                const y = this.window.mouseY * sy;
                const size = Math.max(10, Math.round(14 * Math.min(sx, sy)));
                ctx.save();
                ctx.translate(x, y);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(size * 0.34, size * 0.7);
                ctx.lineTo(size * 0.58, size);
                ctx.lineTo(size * 0.76, size * 0.9);
                ctx.lineTo(size * 0.52, size * 0.62);
                ctx.lineTo(size * 0.9, size * 0.58);
                ctx.closePath();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#111111';
                ctx.lineWidth = Math.max(1, Math.min(sx, sy) * 1.5);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
            return;
        }

        const stateKey=readbackKind==='monitor'?'monitorReadback':'broadcastReadback';let state=this[stateKey];
        if(!state||state.width!==width||state.height!==height){state?.target?.dispose();state=this[stateKey]={width,height,target:new THREE.WebGLRenderTarget(width,height,{depthBuffer:true}),pixels:new Uint8Array(width*height*4),image:new ImageData(width,height)};}
        this.renderCleanView(view,state.target,width,height,partialTicks);
        this.webRenderer.readRenderTargetPixels(state.target,0,0,width,height,state.pixels);
        const dst=state.image.data,src=state.pixels;
        for(let y=0;y<height;y++)dst.set(src.subarray((height-1-y)*width*4,(height-y)*width*4),y*width*4);
        canvas.getContext('2d',{alpha:false}).putImageData(state.image,0,0);
        const size=new THREE.Vector2(); this.webRenderer.getSize(size);
        this.webRenderer.setViewport(0,0,size.x,size.y);
    }

    renderTechBillboards(player, partialTicks) {
        if (!this.minecraft.world) return;

        if (!this.techBillboardGroup) {
            this.techBillboardGroup = new THREE.Group();
            this.scene.add(this.techBillboardGroup);
        }
        disposeGroup(this.techBillboardGroup);

        const heldId = player.inventory.getItemInSelectedSlot();
        const heldBlock = Block.getById(heldId);
        
        const isHoldingTech = (heldBlock instanceof (Block.getById(800).constructor)) || (heldId === 816);
        if (!isHoldingTech) return;

        const world = this.minecraft.world;
        const cx = Math.floor(player.x) >> 4;
        const cz = Math.floor(player.z) >> 4;
        const radius = 2;

        const tex = this.minecraft.getThreeTexture('../../techstuff.png');
        if (!tex) return;

        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                const chunk = world.chunks.get((cx + x) + "," + (cz + z));
                if (!chunk || !chunk.loaded) continue;

                for (let section of chunk.sections) {
                    if (section.empty) continue;
                    if (Math.abs(section.y * 16 - player.y) > 32) continue;

                    for (let i = 0; i < 4096; i++) {
                        const id = section.blocks[i];
                        if (id >= 800 && id <= 816) {
                            const relX = i & 15, relZ = (i >> 4) & 15, relY = (i >> 8) & 15;
                            const wx = (section.x << 4) + relX, wy = (section.y << 4) + relY, wz = (section.z << 4) + relZ;

                            const block = Block.getById(id);
                            const brightness = world.getLightBrightness(wx, wy, wz);
                            
                            const spriteMat = new THREE.SpriteMaterial({
                                map: tex.clone(),
                                transparent: true,
                                opacity: 0.8,
                                color: new THREE.Color(brightness, brightness, brightness),
                                depthTest: true,
                                depthWrite: false
                            });
                            
                            const uBase = (block.textureIndex / 17);
                            spriteMat.map.repeat.set(1/17, 1);
                            spriteMat.map.offset.set(uBase, 0);
                            
                            const sprite = new THREE.Sprite(spriteMat);
                            sprite.position.set(wx + 0.5, wy + 0.5, wz + 0.5);
                            // Increased scale from 0.5 to 0.65 (30% larger)
                            sprite.scale.set(0.65, 0.65, 1);
                            this.techBillboardGroup.add(sprite);
                        }
                    }
                }
            }
        }
    }

    renderSignTexts(partialTicks) {
        if (!this.minecraft.world) return;
        const world = this.minecraft.world;
        const camera = this.camera;

        if (!this.signGroup) {
            this.signGroup = new THREE.Group();
            this.scene.add(this.signGroup);
        }

        // Check if font is ready
        if (!this.minecraft.fontRenderer) return;

        const currentVisibleKeys = new Set();
        const maxDistSq = 1024; // 32 blocks

        for (const [key,te] of world.loadedTileEntities()) {
            if (te.lines) {
                const coords = key.split(",");
                const x = parseInt(coords[0]), y = parseInt(coords[1]), z = parseInt(coords[2]);

                // Check if block exists at these coords before rendering sign
                const id = world.getBlockAt(x, y, z);
                if (id === 0) return; // Skip if chunk not loaded or block is air

                const distSq = (x + 0.5 - camera.position.x)**2 + (y + 0.5 - camera.position.y)**2 + (z + 0.5 - camera.position.z)**2;
                
                if (distSq < maxDistSq) {
                    currentVisibleKeys.add(key);
                    
                    let cached = this.signCache.get(key);
                    if (!cached) {
                        const blockId = world.getBlockAt(x, y, z);
                        const isWall = (blockId === 68 || blockId >= 488);
                        const meta = world.getBlockDataAt(x, y, z);
                        const mesh = this.blockRenderer.liquidRenderer.renderSignText(this.signGroup, x, y, z, te.lines, meta, isWall);
                        
                        cached = { mesh, lines: JSON.stringify(te.lines), lastBrightness: -1 };
                        this.signCache.set(key, cached);
                    }

                    // Update existing sign: check for text change or lighting change
                    const linesStr = JSON.stringify(te.lines);
                    const brightness = world.getLightBrightness(x, y, z);

                    if (cached.lines !== linesStr) {
                        // Text changed, fully rebuild
                        disposeObject(cached.mesh);
                        this.signGroup.remove(cached.mesh);

                        const blockId = world.getBlockAt(x, y, z);
                        const isWall = (blockId === 68 || blockId >= 488);
                        const meta = world.getBlockDataAt(x, y, z);
                        cached.mesh = this.blockRenderer.liquidRenderer.renderSignText(this.signGroup, x, y, z, te.lines, meta, isWall);
                        cached.lines = linesStr;
                    }

                    // Smooth brightness update
                    if (Math.abs(cached.lastBrightness - brightness) > 0.05) {
                        cached.mesh.material.color.setScalar(brightness);
                        cached.lastBrightness = brightness;
                    }
                }
            }
        }

        // Cleanup stale signs
        for (let [key, cached] of this.signCache) {
            if (!currentVisibleKeys.has(key)) {
                disposeObject(cached.mesh);
                this.signGroup.remove(cached.mesh);
                this.signCache.delete(key);
            }
        }
    }

    renderBreakingAnimation(partialTicks) {
        let targetPos = this.minecraft.currentBreakingBlockPos;
        let targetProgress = this.minecraft.breakingProgress;

        // Check remote players for breaking progress if local is idle
        if (!targetPos || targetProgress <= 0) {
            if (this.minecraft.multiplayer && this.minecraft.multiplayer.remotePlayers) {
                for (let rp of this.minecraft.multiplayer.remotePlayers.values()) {
                    if (rp.currentBreakingPos && rp.breakingProgress > 0) {
                        targetPos = rp.currentBreakingPos;
                        targetProgress = rp.breakingProgress;
                        break;
                    }
                }
            }
        }

        if (targetPos && targetProgress > 0) {
            this.breakAnimationMesh.visible = true;

            let pos = targetPos;
            // Expand slightly to prevent z-fighting
            this.breakAnimationMesh.scale.set(1.002, 1.002, 1.002);
            this.breakAnimationMesh.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);

            let progress = targetProgress;

            // Correct frame handling: sheet contains 6 frames.
            let frameCount = this._breakAnimationFrameCount || 6;

            // Compute frame from progress
            let frame = Math.floor(progress * frameCount);
            if (frame < 0) frame = 0;
            if (frame >= frameCount) frame = frameCount - 1;

            // Map frame to sprite sheet offset
            // Assuming 0 is left, count-1 is right.
            // If textures are backward, flip indexing. Usually progress 0 -> frame 0.
            let frameU = 1 / frameCount;
            
            this.textureBreakAnimation.offset.x = frame * frameU;
            this.textureBreakAnimation.repeat.x = frameU;
            
            if (this.breakAnimationMaterial && this.breakAnimationMaterial.map) {
                this.breakAnimationMaterial.map.needsUpdate = true;
            }

        } else {
            this.breakAnimationMesh.visible = false;
        }
    }

    onTick() {
        // Update Glint Matrices and Uniforms from Dev Tools
        const time = performance.now() / 1000;
        const g = this.minecraft.devTools.glint;

        // Sync colors to materials if modified in dev tools
        const syncGlintParams = (tess) => {
            if (tess && tess.material && tess.material.uniforms) {
                tess.material.uniforms.glintColor.value.setRGB(g.r, g.g, g.b);
                tess.material.uniforms.glintAlpha.value = g.alpha;
            }
        };
        syncGlintParams(this.blockRenderer.glintTessellator1);
        syncGlintParams(this.blockRenderer.glintTessellator2);

        const updateGlintMatrix = (matrix, speed, rotation, scale) => {
            const m = new THREE.Matrix3();
            const offset = time * speed;
            
            // Use high scale (8.0) to reveal fine pattern detail from the high-res glint texture
            m.set(
                scale, 0, 0,
                0, scale, 0,
                0, 0, 1
            );
            
            // 2. Rotate UVs
            const cos = Math.cos(rotation), sin = Math.sin(rotation);
            const rotM = new THREE.Matrix3().set(
                cos, -sin, 0,
                sin, cos, 0,
                0, 0, 1
            );
            m.multiply(rotM);
            
            // 3. Translate UVs over time
            const transM = new THREE.Matrix3().set(
                1, 0, offset,
                0, 1, offset,
                0, 0, 1
            );
            m.multiply(transM);
            
            matrix.value.copy(m);
        };

        // Use dev settings for animation
        updateGlintMatrix(this.glintMatrix1, g.speed, g.rotation, g.zoom);
        updateGlintMatrix(this.glintMatrix2, -g.speed, -g.rotation, g.zoom);

        if (this.lightningFlashTimer > 0) {
            this.lightningFlashTimer--;
            if (this.lightningFlashTimer <= 0) {
                this.lightningBolt.visible = false;
            }
        }

        const world = this.minecraft.world;
        if (world && world.weather === "thunder" && !this.minecraft.isPaused()) {
            // ~1% chance per tick to spawn lightning near player
            if (Math.random() < 0.01) {
                const p = this.minecraft.player;
                const lx = p.x + (Math.random() - 0.5) * 128;
                const lz = p.z + (Math.random() - 0.5) * 128;
                this.spawnLightning(lx, lz);
            }
        }

        // Chunk section rebuilds happen once per rendered frame (see
        // processRebuildQueue) instead of per tick, so catch-up ticks can't
        // pile several rebuild budgets into a single frame.

        this.prevFogBrightness = this.fogBrightness;
        this.prevEquippedProgress = this.equippedProgress;

        let player = this.minecraft.player;
        let itemStack = player.inventory.getItemInSelectedSlot();

        let showHand = false;
        if (this.itemToRender != null && itemStack != null) {
            if (this.itemToRender !== itemStack) {
                showHand = true;
            }
        } else if (this.itemToRender == null && itemStack == null) {
            showHand = false;
        } else {
            showHand = true;
        }

        // Update equip progress
        this.equippedProgress += MathHelper.clamp((showHand ? 0.0 : 1.0) - this.equippedProgress, -0.4, 0.4);

        if (this.equippedProgress < 0.1) {
            this.itemToRender = itemStack;
        }

        // Update fog brightness
        let brightnessAtPosition = this.minecraft.world.getLightBrightnessForEntity(player);
        
        if (player.activeEffects.has("night_vision")) {
            brightnessAtPosition = 1.0;
        }

        let renderDistance = this.minecraft.settings.viewDistance / 32.0;
        let fogBrightness = brightnessAtPosition * (1.0 - renderDistance) + renderDistance;
        this.fogBrightness += (fogBrightness - this.fogBrightness) * 0.1;
    }

    orientCamera(player, partialTicks, aspect) {
        // Reset rotation stack
        let stack = this.camera;
        if (aspect) stack.aspect = aspect;

        // Position
        let x = player.prevX + (player.x - player.prevX) * partialTicks;
        let y = player.prevY + (player.y - player.prevY) * partialTicks + player.getEyeHeight();
        let z = player.prevZ + (player.z - player.prevZ) * partialTicks;

        // Rotation
        let yaw = player.prevRotationYaw + (player.rotationYaw - player.prevRotationYaw) * partialTicks;
        let pitch = player.prevRotationPitch + (player.rotationPitch - player.prevRotationPitch) * partialTicks;

        // Add camera offset
        let mode = this.minecraft.settings.thirdPersonView;
        if (mode !== 0) {
            let distance = WorldRenderer.THIRD_PERSON_DISTANCE;
            let frontView = mode === 2;

            // Calculate vector of yaw and pitch
            let vector = player.getVectorForRotation(pitch, yaw);

            // Calculate max possible position of the third person camera
            let maxX = x - vector.x * distance * (frontView ? -1 : 1);
            let maxY = y - vector.y * distance * (frontView ? -1 : 1);
            let maxZ = z - vector.z * distance * (frontView ? -1 : 1);

            // Make 8 different ray traces to make sure we don't get stuck in walls
            for (let i = 0; i < 8; i++) {
                // Calculate all possible offset variations (Basically a binary counter)
                let offsetX = ((i & 1) * 2 - 1) * 0.1;
                let offsetY = ((i >> 1 & 1) * 2 - 1) * 0.1;
                let offsetZ = ((i >> 2 & 1) * 2 - 1) * 0.1;

                // Calculate ray trace from and to position
                let from = new Vector3(x, y, z);
                let to = new Vector3(maxX, maxY, maxZ);

                // Add offset of this variation
                from = from.addVector(offsetX, offsetY, offsetZ);
                to = to.addVector(offsetX, offsetY, offsetZ);

                // Make ray trace
                let target = this.minecraft.world.rayTraceBlocks(from, to);
                if (target === null) {
                    continue;
                }

                // Calculate distance to collision
                let distanceToCollision = target.vector.distanceTo(new Vector3(x, y, z));
                if (distanceToCollision < distance) {
                    distance = distanceToCollision;
                }
            }

            // Move camera to third person sphere
            x -= vector.x * distance * (frontView ? -1 : 1);
            y -= vector.y * distance * (frontView ? -1 : 1);
            z -= vector.z * distance * (frontView ? -1 : 1);

            // Flip camera around if front view is enabled
            if (frontView) {
                pitch *= -1;
                yaw += 180;
            }
        }

        // Update camera rotation
        stack.rotation.x = -MathHelper.toRadians(pitch);
        stack.rotation.y = -MathHelper.toRadians(yaw + 180);
        stack.rotation.z = player.isCameraman ? MathHelper.toRadians(player.cameraRoll || 0) : 0;

        if (player.isCameraman && player.cameraMode === "operator" && this.minecraft.settings.viewBobbing) {
            const bob = (player.prevCameraYaw + (player.cameraYaw - player.prevCameraYaw) * partialTicks) || 0;
            y += Math.sin((player.limbSwingProgress || 0) * Math.PI) * bob * 0.12;
        }

        // Update camera position
        if (isFinite(x) && isFinite(y) && isFinite(z)) {
            stack.position.set(x, y, z);
        }

        // Apply hurt tilt (Reduced by 90% as requested)
        if (player.hurtTime > 0) {
            let hurtFactor = (player.hurtTime - partialTicks) / 10.0;
            let tilt = Math.sin(hurtFactor * hurtFactor * hurtFactor * hurtFactor * Math.PI) * 0.14;
            stack.rotateZ(MathHelper.toRadians(tilt));
        }

        // Apply bobbing animation
        if (mode === 0 && this.minecraft.settings.viewBobbing) {
            // Camera tilt/bob removed — only hand/item should bob when walking.
        }

        // Update FOV
        this.camera.fov = player.isCameraman ? (player.cameraFov || this.minecraft.settings.fov) : this.minecraft.settings.fov + player.getFOVModifier();
        this.camera.updateProjectionMatrix();

        // Update frustum
        this.camera.updateMatrixWorld();
        this.frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));

        // Setup fog
        this.setupFog(x, z, player.isHeadInWater(), partialTicks);
    }

    generateSky() {
        // Create background center group
        this.backgroundCenter = new THREE.Object3D();
        this.background.add(this.backgroundCenter);

        let size = 64;
        let scale = 256 / size + 2;

        // Generate sky color
        {
            let y = 16;
            this.listSky = new THREE.Object3D();
            this.tessellator.startDrawing();
            this.tessellator.setColor(1, 1, 1);
            for (let x = -size * scale; x <= size * scale; x += size) {
                for (let z = -size * scale; z <= size * scale; z += size) {
                    this.tessellator.addVertex(x + size, y, z);
                    this.tessellator.addVertex(x, y, z);
                    this.tessellator.addVertex(x, y, z + size);
                    this.tessellator.addVertex(x + size, y, z + size);
                }
            }
            let mesh = this.tessellator.draw(this.listSky);
            mesh.material.depthTest = false;
            this.backgroundCenter.add(this.listSky);
        }

        // Generate sunrise/sunset color
        {
            this.listSunset = new THREE.Object3D();
            this.tessellator.startDrawing();

            let amount = 16;
            let width = (Math.PI * 2.0) / amount;

            for (let index = 0; index < amount; index++) {
                let rotation = (index * Math.PI * 2.0) / amount;

                let x1 = Math.sin(rotation);
                let y1 = Math.cos(rotation);

                let x2 = Math.sin(rotation + width);
                let y2 = Math.cos(rotation + width);

                this.tessellator.setColor(1, 1, 1, 1);
                this.tessellator.addVertex(0.0, 100, 0.0);
                this.tessellator.addVertex(0.0, 100, 0.0);

                this.tessellator.setColor(1, 1, 1, 0);
                this.tessellator.addVertex(x1 * 120, y1 * 120, -y1 * 40);
                this.tessellator.addVertex(x2 * 120, y2 * 120, -y2 * 40);
            }

            let mesh = this.tessellator.draw(this.listSunset);
            mesh.material = mesh.material.clone();
            mesh.material.depthTest = false;
            mesh.material.opacity = 0.6;
            mesh.material.side = THREE.DoubleSide;
            this.backgroundCenter.add(this.listSunset);
        }

        // Realism sky dome adapted from the supplied cdlyWr ShaderToy export.
        // It remains tied to Minecraft's celestial clock rather than iMouse/iTime.
        this.realismSkyMaterial = new THREE.ShaderMaterial({
            side: THREE.BackSide, depthWrite: false, depthTest: false,
            uniforms:{time:{value:0},celestial:{value:0},rain:{value:0}},
            vertexShader:`varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
            fragmentShader:`
                precision highp float;varying vec3 vDir;uniform float time;uniform float celestial;uniform float rain;
                #define PI 3.14159265359
                float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
                float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
                float fbm(vec2 p){float v=0.0,a=.5;for(int i=0;i<6;i++){v+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return v;}
                float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float n=i.x+i.y*157.0+i.z*113.0;return mix(mix(mix(hash(vec2(n,0.0)),hash(vec2(n+1.0,0.0)),f.x),mix(hash(vec2(n+157.0,0.0)),hash(vec2(n+158.0,0.0)),f.x),f.y),mix(mix(hash(vec2(n+113.0,0.0)),hash(vec2(n+114.0,0.0)),f.x),mix(hash(vec2(n+270.0,0.0)),hash(vec2(n+271.0,0.0)),f.x),f.y),f.z);}
                // Cloud density follows the supplied export's fnoise2/cloud
                // octave ratios, thresholds and squared density response.
                float exportFnoise2(vec3 p){p*=.25;float f=.5*noise3(p);p*=3.02;p.y-=time*.02;f+=.25*noise3(p);p*=3.03;p.y+=time*.06;f+=.125*noise3(p);p*=3.01;f+=.0625*noise3(p);p*=3.03;f+=.03125*noise3(p);p*=3.02;f+=.015625*noise3(p);return f;}
                float exportCloud(vec3 p){float d=exportFnoise2(p)+.03;d=smoothstep(.44,.64,d);return d*d*1.5+.01;}
                void main(){
                    vec3 rd=normalize(vDir);float up=max(rd.y,0.0);float a=celestial*PI*2.0;
                    vec3 sd=normalize(vec3(sin(a),cos(a),.22));vec3 md=-sd;
                    float sunHeight=sd.y;float daylight=smoothstep(-.13,.12,sunHeight);float night=1.0-daylight;
                    vec3 horizon=mix(vec3(.018,.027,.075),vec3(.48,.70,.98),daylight);
                    vec3 zenith=mix(vec3(.004,.008,.035),vec3(.055,.28,.68),daylight);
                    vec3 col=mix(horizon,zenith,pow(up,.42));
                    float dusk=(1.0-smoothstep(.02,.34,abs(sunHeight)))*smoothstep(-.18,.08,sunHeight);
                    col+=vec3(1.0,.22,.045)*dusk*pow(1.0-up,3.0)*.85;
                    float sunDot=max(dot(rd,sd),0.0);float disc=smoothstep(.99955,.99982,sunDot);
                    float rays=pow(sunDot,18.0)*(.55+.45*noise(rd.xz*18.0+time*.025));
                    col+=vec3(1.0,.72,.30)*(disc*4.0+rays*.32)*daylight*(1.0-rain*.75);
                    float moonDot=max(dot(rd,md),0.0);float moon=smoothstep(.99915,.99965,moonDot);float cut=smoothstep(.99905,.99955,dot(rd,normalize(md+vec3(.012,.008,0.0))));
                    col+=vec3(.68,.78,1.0)*max(moon-cut*.82,0.0)*2.1*night;
                    vec2 starUv=vec2(atan(rd.z,rd.x)/PI,asin(clamp(rd.y,-1.0,1.0))/PI)*420.0;float stars=step(.9965,hash(floor(starUv)))*pow(up,.35)*night;
                    col+=vec3(.72,.82,1.0)*stars;
                    // Volumetric cloud march adapted directly from the export's
                    // 5–8 km shell density model, with Minecraft-scale units.
                    float c=0.0,trans=1.0;vec3 cloudLit=vec3(0.0);float horizonMask=smoothstep(-.08,.16,rd.y);
                    for(int ci=0;ci<12;ci++){
                        float ft=(float(ci)+.5)/12.0;vec3 cp=rd*(2.5+ft*7.0);
                        cp+=vec3(-time*.10,time*.10,time*.25);
                        float shell=sin(PI*clamp(ft,0.0,1.0));float den=exportCloud(cp*3.2)*shell*horizonMask;
                        den*=mix(.30,.72,rain);float alpha=clamp(den*.18,0.0,.28)*trans;
                        float lightSample=exportCloud((cp+sd*.28)*3.2);float shade=clamp(1.12-lightSample*.55,.42,1.0);
                        vec3 dayCloud=mix(vec3(.34,.39,.50),vec3(1.0,.96,.90),shade);vec3 nightCloud=vec3(.025,.04,.085)*(.65+.35*shade);
                        cloudLit+=mix(nightCloud,dayCloud,daylight)*alpha;trans*=1.0-clamp(den*.18,0.0,.28);
                    }
                    col=col*trans+cloudLit;
                    float aurMask=night*smoothstep(.04,.28,rd.y)*smoothstep(.92,.35,rd.y)*(1.0-rain*.7);
                    float curtain=fbm(vec2(atan(rd.z,rd.x)*2.2+time*.025,rd.y*8.0-time*.018));
                    float bands=pow(max(0.0,sin(rd.y*34.0+curtain*8.0+sin(atan(rd.z,rd.x)*5.0))),7.0);
                    vec3 aur=mix(vec3(.05,1.0,.42),vec3(.28,.25,1.0),smoothstep(.15,.75,curtain));
                    col+=aur*bands*aurMask*.72;
                    col=mix(col,col*.58,rain*.55);col=1.0-exp(-col*1.25);gl_FragColor=vec4(pow(col,vec3(.86)),1.0);
                }`
        });
        this.realismSky = new THREE.Mesh(new THREE.SphereGeometry(140,48,24),this.realismSkyMaterial);
        this.realismSky.renderOrder=-1000;this.realismSky.visible=false;this.backgroundCenter.add(this.realismSky);

        // Create cycle group
        this.cycleGroup = new THREE.Object3D();

        // Generate stars
        {
            this.listStars = new THREE.Object3D();
            this.tessellator.startDrawing();
            this.tessellator.setColor(1, 1, 1);

            // Generate 1500 stars
            let random = new Random(10842);
            for (let i = 0; i < 1500; i++) {
                // Random vector
                let vectorX = random.nextFloat() * 2.0 - 1.0;
                let vectorY = random.nextFloat() * 2.0 - 1.0;
                let vectorZ = random.nextFloat() * 2.0 - 1.0;

                // Skip invalid vectors
                let distance = vectorX * vectorX + vectorY * vectorY + vectorZ * vectorZ;
                if (distance >= 1.0 || distance <= 0.01) {
                    continue;
                }

                // Create sphere
                distance = 1.0 / Math.sqrt(distance);
                vectorX *= distance;
                vectorY *= distance;
                vectorZ *= distance;

                // Increase sphere size
                let x = vectorX * 100;
                let y = vectorY * 100;
                let z = vectorZ * 100;

                // Rotate the stars on the sphere
                let rotationX = Math.atan2(vectorX, vectorZ);
                let sinX = Math.sin(rotationX);
                let cosX = Math.cos(rotationX);

                // Face the stars to the middle of the sphere
                let rotationY = Math.atan2(Math.sqrt(vectorX * vectorX + vectorZ * vectorZ), vectorY);
                let sinY = Math.sin(rotationY);
                let cosY = Math.cos(rotationY);

                // Tilt the stars randomly
                let rotationZ = random.nextFloat() * Math.PI * 2;
                let sinZ = Math.sin(rotationZ);
                let cosZ = Math.cos(rotationZ);

                // Random size of the star - made smaller for better look
                let size = 0.05 + random.nextFloat() * 0.08;

                // Add vertices for each edge of the star
                for (let edge = 0; edge < 4; edge++) {
                    // Calculate the position of the edge on a 2D plane
                    let tileX = ((edge & 2) - 1) * size;
                    let tileZ = ((edge + 1 & 2) - 1) * size;

                    // Project tile position onto the sphere
                    let sphereX = tileX * cosZ - tileZ * sinZ;
                    let sphereY = tileZ * cosZ + tileX * sinZ;
                    let sphereZ = -sphereX * cosY;

                    // Calculate offset of the edge on the sphere
                    let offsetX = sphereZ * sinX - sphereY * cosX;
                    let offsetY = sphereX * sinY;
                    let offsetZ = sphereY * sinX + sphereZ * cosX;

                    // Add vertex for the edge of the star
                    this.tessellator.addVertex(x + offsetX, y + offsetY, z + offsetZ);
                }
            }

            let mesh = this.tessellator.draw(this.listStars);
            mesh.material = mesh.material.clone();
            mesh.material.depthTest = true;
            mesh.material.side = THREE.BackSide;
            this.cycleGroup.add(this.listStars);
        }

        // Create sun
        let geometry = new THREE.PlaneGeometry(1, 1);
        let materialSun = new THREE.MeshBasicMaterial({
            side: THREE.FrontSide,
            map: this.textureSun,
            alphaMap: this.textureSun,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        this.sun = new THREE.Mesh(geometry, materialSun);
        this.sun.translateZ(-2);
        this.sun.material.depthTest = false;
        this.cycleGroup.add(this.sun);

        // Create moon
        let materialMoon = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            map: this.textureMoon,
            alphaMap: this.textureMoon,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        this.moon = new THREE.Mesh(geometry, materialMoon);
        this.moon.translateZ(2);
        this.moon.material.depthTest = false;
        this.cycleGroup.add(this.moon);

        // Add cycle group before the void to hide the cycling elements behind the void
        this.backgroundCenter.add(this.cycleGroup);

        // Cloud group
        this.cloudGroup = new THREE.Group();
        this.scene.add(this.cloudGroup);

        // Generate void color
        {
            let y = -16;
            this.listVoid = new THREE.Object3D();
            this.tessellator.startDrawing();
            this.tessellator.setColor(1, 1, 1);
            for (let x = -size * scale; x <= size * scale; x += size) {
                for (let z = -size * scale; z <= size * scale; z += size) {
                    this.tessellator.addVertex(x, y, z);
                    this.tessellator.addVertex(x + size, y, z);
                    this.tessellator.addVertex(x + size, y, z + size);
                    this.tessellator.addVertex(x, y, z + size);
                }
            }
            let mesh = this.tessellator.draw(this.listVoid);
            mesh.material = mesh.material.clone();
            mesh.material.depthTest = false;
            mesh.material.opacity = 1;
            this.backgroundCenter.add(this.listVoid);
        }
    }

    renderSky(partialTicks) {
        // Center sky (stars, sun, moon, void)
        this.backgroundCenter.position.copy(this.camera.position);

        const isEnd = this.minecraft.world.dimension === 1;

        // Update settings-based visibility
        const isRealismSky = !!this.minecraft.realismMode && !isEnd;
        const isRealisticClouds = this.minecraft.settings.realisticClouds;
        this.realismSky.visible=isRealismSky;
        this.listSky.visible=!isRealismSky;
        this.listSunset.visible=!isRealismSky;
        this.cloudGroup.visible = !isRealismSky && !isRealisticClouds && !isEnd;
        this.realisticCloudMesh.visible = !isRealismSky && isRealisticClouds && !isEnd;

        this.sun.visible = !isEnd && !isRealismSky;
        this.moon.visible = !isEnd && !isRealismSky;

        const player = this.minecraft.player;
        const weather = this.minecraft.world.weather;
        const angle = this.minecraft.world.getCelestialAngle(partialTicks);
        const nightFactor = MathHelper.clamp(Math.sin((angle - 0.2) * Math.PI * 1.5) * 2.0, 0.0, 1.0);

        // Update Block glossiness based on rain
        const px = Math.floor(player.x);
        const pz = Math.floor(player.z);
        const { isRaining } = this.getWeatherFactors(player);

        const rainFactor = isRaining ? 1.0 : 0.0;
        if(isRealismSky){this.realismSkyMaterial.uniforms.time.value=performance.now()/1000;this.realismSkyMaterial.uniforms.celestial.value=angle;this.realismSkyMaterial.uniforms.rain.value=rainFactor;}
        Tessellator.rainIntensityUniform.value = rainFactor;
        const sunX = Math.sin(angle * Math.PI * 2);
        const sunY = Math.cos(angle * Math.PI * 2);
        Tessellator.sunDirUniform.value.set(sunX, sunY, 0.5).normalize();

        if (isRealisticClouds) {
            this.realisticCloudMaterial.uniforms.time.value = (performance.now() / 1000.0);
            this.realisticCloudMaterial.uniforms.nightFactor.value = nightFactor;
            this.realisticCloudMaterial.uniforms.rainFactor.value = rainFactor;
            this.realisticCloudMesh.position.x = this.camera.position.x;
            this.realisticCloudMesh.position.z = this.camera.position.z;
            
            // Tint clouds slightly by sky color
            let skyColor = this.minecraft.world.getSkyColor(Math.floor(this.camera.position.x), Math.floor(this.camera.position.z), partialTicks);
            this.realisticCloudMaterial.uniforms.color.value.setRGB(
                0.8 + skyColor.x * 0.2,
                0.8 + skyColor.y * 0.2,
                0.8 + skyColor.z * 0.2
            );
        }

        // Update realistic water
        if (this.realisticWaterMesh) {
            this.realisticWaterMesh.visible = this.minecraft.settings.realisticWater && this.minecraft.world.dimension === 0;
            if (this.realisticWaterMesh.visible) {
                this.realisticWaterMesh.material.uniforms['time'].value += 1.0 / 60.0;
                
                // Update sun direction for water reflection (using values calculated above)
                this.realisticWaterMesh.material.uniforms['sunDirection'].value.set(sunX, sunY, 0.5).normalize();
            }
        }

        // Update clouds
        if (player && this.cloudGroup && this.cloudWidth > 1) {
            let px = player.prevX + (player.x - player.prevX) * partialTicks;
            let pz = player.prevZ + (player.z - player.prevZ) * partialTicks;
            
            // Cloud drift speed (blocks per tick)
            const driftSpeed = 0.12;
            const drift = this.minecraft.world.time * driftSpeed;
            
            // Wrapping logic for infinite clouds using the large geometry tile
            const interval = this.cloudWidth;
            let cx = Math.round((px + drift) / interval) * interval - drift;
            let cz = Math.round(pz / interval) * interval;
            
            this.cloudGroup.position.set(cx, 192, cz);
        } else if (player && this.cloudGroup && this.textureClouds && this.textureClouds.image && this.textureClouds.image.width > 1) {
            // First time load or rebuild required
            this.rebuildClouds();
        }

        // Rotate sky cycle (using angle calculated at the top of renderSky)
        this.cycleGroup.rotation.set(angle * Math.PI * 2 + Math.PI / 2, 0, 0);


    }

    setupFog(x, z, inWater, partialTicks) {
        if (inWater) {
            let player = this.minecraft.player;
            let color = new THREE.Color(0.4, 0.4, 0.7);
            if (player.activeEffects.has("night_vision") || player.activeEffects.has("water_breathing")) {
                 color = new THREE.Color(0.6, 0.6, 0.9);
            }
            this.background.background = color;
            
            let fogFar = 10;
            if (player.activeEffects.has("night_vision") || player.activeEffects.has("water_breathing")) {
                fogFar = 40;
            }
            this.scene.fog = new THREE.Fog(color, 0.0025, fogFar);
        } else {
            let world = this.minecraft.world;

            // Level 0 is an enclosed, electrically-lit office maze rather
            // than an outdoor biome. Short warm fog, no sky, and a tiny
            // brightness dip while a fixture is out give it its own visual
            // identity without changing normal-world rendering.
            if (world.isBackroomsSeed && world.dimension === 0) {
                const fixtureOut = world.backroomsFlickeringLights?.size > 0;
                const pulse = fixtureOut ? 0.68 : 0.92 + Math.sin(world.time * 0.075) * 0.025;
                const color = new THREE.Color(0.46 * pulse, 0.43 * pulse, 0.24 * pulse);
                const far = Math.max(24, Math.min(52, this.minecraft.settings.viewDistance * ChunkSection.SIZE * 1.5));

                this.background.background = color;
                this.scene.fog = new THREE.Fog(color, 5, far);
                // The solid Backrooms roof hides the sky geometry naturally.
                // Leave its visibility state alone so switching back to an
                // ordinary world immediately restores its normal sky cycle.
                this.background.fog = this.scene.fog;
                return;
            }

            const normalViewDistance=this.minecraft.settings.viewDistance;
            const farViewChunks=this.minecraft.settings.lodRendering===false?normalViewDistance:Math.max(normalViewDistance,Math.ceil((this.minecraft.settings.lodRenderDistance||64)/16));
            let viewDistance = farViewChunks * ChunkSection.SIZE;
            let viewFactor = 1.0 - Math.pow(0.25 + 0.75 * normalViewDistance / 32.0, 0.25);

            let angle = world.getCelestialAngle(partialTicks);

            let skyColor = world.getSkyColor(x, z, partialTicks);
            let fogColor = world.getFogColor(partialTicks);
            let sunsetColor = world.getSunriseSunsetColor(partialTicks);

            let starBrightness = world.getStarBrightness(partialTicks);
            let brightness = this.prevFogBrightness + (this.fogBrightness - this.prevFogBrightness) * partialTicks;

            if (this.lightningFlashTimer > 0) {
                // Apply a relative additive boost instead of forcing a white-out value
                brightness += 0.45; 
            }

            let red = (fogColor.x + (skyColor.x - fogColor.x) * viewFactor) * brightness;
            let green = (fogColor.y + (skyColor.y - fogColor.y) * viewFactor) * brightness;
            let blue = (fogColor.z + (skyColor.z - fogColor.z) * viewFactor) * brightness;

            // Darken during rain
            if (this.currentRainFactor > 0.01) {
                const rainDarken = 1.0 - (this.currentRainFactor * 0.45);
                red *= rainDarken;
                green *= rainDarken;
                blue *= rainDarken;
            }

            // Deepen night colors for better atmospheric look
            if (angle > 0.25 && angle < 0.75) { // Nighttime range
                let nightFactor = Math.sin((angle - 0.25) * Math.PI);
                red *= (1.0 - nightFactor * 0.2);
                green *= (1.0 - nightFactor * 0.2);
                blue *= (1.0 - nightFactor * 0.1); // Keep a bit more blue
            }

            // Update background color
            this.background.background = new THREE.Color(red, green, blue);

            // Update fog color
            // Modulate fog distance based on density setting
            // Density 0.0 -> Far fog (2.5x render distance)
            // Density 1.0 -> Thick fog (0.5x render distance)
            let density = this.minecraft.settings.fogDensity;
            let fogMultiplier = 2.5 - (density * 2.0);
            
            this.scene.fog = new THREE.Fog(new THREE.Color(red, green, blue), 0.0025, viewDistance * fogMultiplier);

            let skyMesh = this.listSky.children[0];
            let voidMesh = this.listVoid.children[0];
            let starsMesh = this.listStars.children[0];
            let sunsetMesh = this.listSunset.children[0];

            // Update sky and void color
            skyMesh.material.color.set(new THREE.Color(skyColor.x, skyColor.y, skyColor.z));
            voidMesh.material.color.set(new THREE.Color(
                skyColor.x * 0.2 + 0.04,
                skyColor.y * 0.2 + 0.04,
                skyColor.z * 0.6 + 0.1
            ));

            // Update star brightness
            if (starBrightness > 0) {
                starsMesh.material.opacity = starBrightness;
                starsMesh.material.color.set(new THREE.Color(starBrightness, starBrightness, starBrightness));
            }
            this.listStars.visible = starBrightness > 0 && !this.minecraft.realismMode;

            // Update sunset
            if (sunsetColor !== null) {
                sunsetMesh.material.opacity = sunsetColor.w;
                sunsetMesh.material.color.set(new THREE.Color(sunsetColor.x, sunsetColor.y, sunsetColor.z));
                sunsetMesh.rotation.x = MathHelper.toRadians(angle <= 0.5 ? 90 : 135);
            }
            sunsetMesh.visible = sunsetColor !== null;
        }

        this.background.fog = this.scene.fog;
    }

    renderChunks(cameraChunkX, cameraChunkZ) {
        let world = this.minecraft.world;
        let player = this.minecraft.player;
        let cameraY = player.y;
        let cameraSectionY = Math.floor(cameraY) >> 4;
        const normalRenderDistance=this.minecraft.settings.viewDistance;
        let renderDistance=this.minecraft.settings.lodRendering===false?normalRenderDistance:Math.max(normalRenderDistance,Math.ceil((this.minecraft.settings.lodRenderDistance||64)/16));
        let showBorders = this.minecraft.settings.showChunkBorders;
        const sodiumEnabled = isSodiumClientModEnabled();

        if (showBorders) {
            this.updateChunkBorders(cameraChunkX, cameraChunkZ, renderDistance);
        } else {
            this.debugGroup.visible = false;
        }

        // Update chunks
        for (let [index, chunk] of world.chunks) {
            let distanceX = Math.abs(cameraChunkX - chunk.x);
            let distanceZ = Math.abs(cameraChunkZ - chunk.z);

            // Is in render distance check
            if (distanceX < renderDistance && distanceZ < renderDistance) {
                // Make chunk visible
                chunk.group.visible = true;
                chunk.loaded = true;

                // Only mesh a chunk once its whole 3x3 neighbourhood exists.
                // Until then its border faces, lighting and trees from
                // neighbouring population are still changing, and meshing
                // early meant re-meshing every chunk several times while
                // exploring.
                const wasNeighborsReady = !!chunk.neighborsReady;
                if (!chunk.neighborsReady) {
                    chunk.neighborsReady = world.isNeighborhoodReady(chunk);
                    // Chunks that were meshed early should get one final pass
                    // once all neighbors exist so border faces/light are correct.
                    if (!wasNeighborsReady && chunk.neighborsReady) chunk.setModifiedAllSections();
                }
                // The Nether generator is cave-heavy and expensive enough that
                // waiting for a full 3x3 neighborhood leaves visible holes while
                // exploration catches up. Build Nether chunks immediately, then
                // the neighbor-ready pass above cleans up seams.
                const canBuild = chunk.neighborsReady || world.dimension === -1;

                // Process all 16 vertical sections per chunk (extended height support)
                for (let y = 0; y < 16; y++) {
                    let chunkSection = chunk.sections[y];
                    if (!chunkSection) continue;

                    // Vertical distance culling to match horizontal render distance
                    let distanceY = Math.abs(cameraSectionY - y);
                    
                    // Improved visibility check: Frustum, emptiness, and range.
                    // Sodium port: do cheap frustum/range checks before touching
                    // section storage so invisible empty sections stay cold.
                    const isVisible = this.frustum.intersectsBox(chunkSection.boundingBox);
                    if (sodiumEnabled && (!isVisible || distanceY >= (renderDistance + 2))) {
                        chunkSection.group.visible = false;
                        if (!isVisible && chunkSection.inUpdateQueue && distanceX > renderDistance + 3) {
                            chunkSection.inUpdateQueue = false;
                            this.chunkSectionUpdateQueue = this.chunkSectionUpdateQueue.filter(s => s !== chunkSection);
                        }
                        continue;
                    }
                    const isEmpty = chunkSection.isEmpty();
                    
                    if (isVisible && !isEmpty && distanceY < (renderDistance + 2)) {
                        chunkSection.group.visible = true;

                        // Check LOD thresholds (64 blocks) for foliage rendering transitions
                        let cx = (chunkSection.x << 4) + 8;
                        let cy = (chunkSection.y << 4) + 8;
                        let cz = (chunkSection.z << 4) + 8;
                        let dSq = (this.activeViewer.x - cx)**2 + (this.activeViewer.y - cy)**2 + (this.activeViewer.z - cz)**2;
                        // Everything outside the player's normal render radius
                        // is built as LOD. lodRenderDistance controls the outer
                        // radius, not where the simplification begins.
                        let useLOD = this.minecraft.settings.lodRendering !== false && (distanceX >= normalRenderDistance || distanceZ >= normalRenderDistance);
                        
                        if (chunkSection.lastBuiltLOD !== useLOD) {
                            chunkSection.isModified = true;
                        }

                        // Watchdog only covers sections that have never produced
                        // geometry. Rebuilding nearby sections every 60 frames
                        // caused continuous CPU work and GPU buffer churn.
                        if (!chunkSection.inUpdateQueue &&
                            chunkSection.group.children.length === 0 &&
                            chunkSection.lastBuiltLOD === null) {
                            chunkSection.isModified = true;
                        }

                        // Add to rebuild queue if modified and not already queued
                        if (canBuild && chunkSection.isModified && !chunkSection.inUpdateQueue) {
                            this.chunkSectionUpdateQueue.push(chunkSection);
                            chunkSection.inUpdateQueue = true;
                        }
                        
                        chunkSection.render();
                    } else {
                        chunkSection.group.visible = false;
                        // If far away and not modified, ensure it's not clogging the queue
                        if (!isVisible && chunkSection.inUpdateQueue && distanceX > renderDistance + 4) {
                             chunkSection.inUpdateQueue = false;
                             this.chunkSectionUpdateQueue = this.chunkSectionUpdateQueue.filter(s => s !== chunkSection);
                        }
                    }
                }
            } else {
                // Hide chunk
                chunk.group.visible = false;

                // Unload chunk
                if (chunk.loaded) {
                    chunk.unload();
                    // Drop queued rebuilds for geometry that was just
                    // released; otherwise the stale entries retain sections
                    // and can rebuild the chunk twice when it re-enters view.
                    this.chunkSectionUpdateQueue = this.chunkSectionUpdateQueue.filter(
                        section => section && section.chunk !== chunk
                    );
                }
            }
        }

        // Sort update queue by 3D distance. 
        const queueSortInterval = sodiumEnabled && this.chunkSectionUpdateQueue.length > 128 ? 4 : 10;
        if (this.chunkSectionUpdateQueue.length > 0 && (this.minecraft.frames % queueSortInterval === 0)) {
            this.chunkSectionUpdateQueue.sort((a, b) => {
                if (!a || !b) return 0;
                // Keep high priority items at the end because rebuilds use
                // pop() to avoid shifting the entire queue.
                if (a.priority !== b.priority) return a.priority ? 1 : -1;
                let d1 = (a.x - cameraChunkX)**2 + (a.y - cameraSectionY)**2 + (a.z - cameraChunkZ)**2;
                let d2 = (b.x - cameraChunkX)**2 + (b.y - cameraSectionY)**2 + (b.z - cameraChunkZ)**2;
                return d2 - d1;
            });
        }

        // Update render order of chunks to Front-to-Back (Ascending distance) to maximize Early-Z culling
        // Only sort if camera moved to a new chunk to avoid per-frame overhead
        if (this._lastCameraChunkX !== cameraChunkX || this._lastCameraChunkZ !== cameraChunkZ) {
            world.group.children.sort((a, b) => {
                let distance1 = (a.chunkX - cameraChunkX)**2 + (a.chunkZ - cameraChunkZ)**2;
                let distance2 = (b.chunkX - cameraChunkX)**2 + (b.chunkZ - cameraChunkZ)**2;
                return distance1 - distance2;
            });
            this._lastCameraChunkX = cameraChunkX;
            this._lastCameraChunkZ = cameraChunkZ;
        }

        // Flush by rebuilding chunk sections
        if(this.flushRebuild) {
            this.flushRebuild = false;

            // Reduced flush limit to prevent lag spikes
            const FLUSH_LIMIT = 8; 
            for (let i = 0; i < FLUSH_LIMIT; i++) {
                if (this.chunkSectionUpdateQueue.length !== 0) {
                    let chunkSection = this.chunkSectionUpdateQueue.pop();
                    if (chunkSection != null) {
                        // Correctly reset queue flags when flushing to allow future updates
                        chunkSection.inUpdateQueue = false;
                        chunkSection.priority = false;
                        
                        // Rebuild chunk if it still belongs to the active world
                        if (chunkSection.chunk.loaded) {
                            chunkSection.rebuild(this);
                        }
                    }
                }
            }
        }
    }

    rebuildAll() {
        let world = this.minecraft.world;
        if (!world) return;
        
        // Don't clear spawnerMobEntities here, it causes flickering as mobs vanish/reappear
        
        for (let [index, chunk] of world.chunks) {
            chunk.setModifiedAllSections();
        }
    }

    updateChunkBorders(cameraChunkX, cameraChunkZ, renderDistance) {
        this.debugGroup.visible = true;
        disposeGroup(this.debugGroup);

        const geo = new THREE.BoxGeometry(16, 128, 16);
        const edges = new THREE.EdgesGeometry(geo);

        // Iterate all loaded chunks to show borders for everyone
        for (let [key, chunk] of this.minecraft.world.chunks) {
            if (!chunk.loaded) continue;
            
            const line = new THREE.LineSegments(edges, this.chunkBorderMaterial);
            line.position.set(chunk.x * 16 + 8, 64, chunk.z * 16 + 8);
            this.debugGroup.add(line);
        }
    }

    renderHand(player, partialTicks) {
        // Hide hand before rendering

        // Ensure first person model is ready (includes main and offhand checks)
        player.renderer.prepareModel(player);

        let stack = player.renderer.firstPersonGroup;
        let offhandStack = player.renderer.firstPersonOffhandGroup;
        stack.visible = false;
        offhandStack.visible = false;

        let firstPerson = this.minecraft.settings.thirdPersonView === 0;
        let itemId = firstPerson ? this.itemToRender : player.inventory.getItemInSelectedSlot();
        let hasItem = itemId !== 0;

        // Hide in third person
        if (!firstPerson) {
            return;
        }

        // Apply matrix mode (Put object in front of camera)
        stack.position.copy(this.camera.position);
        stack.rotation.copy(this.camera.rotation);
        stack.rotation.order = 'ZYX';

        // Scale down
        stack.scale.set(0.0625, 0.0625, 0.0625);
        
        // Setup offhand stack
        offhandStack.position.copy(this.camera.position);
        offhandStack.rotation.copy(this.camera.rotation);
        offhandStack.rotation.order = 'ZYX';
        offhandStack.scale.set(0.0625, 0.0625, 0.0625);
        // Counter-mirror the offhand bob if needed? No, standard is shared.

        let equipProgress = this.prevEquippedProgress + (this.equippedProgress - this.prevEquippedProgress) * partialTicks;
        let swingProgress = player.getSwingProgress(partialTicks);

        let pitchArm = player.prevRenderArmPitch + (player.renderArmPitch - player.prevRenderArmPitch) * partialTicks;
        let yawArm = player.prevRenderArmYaw + (player.renderArmYaw - player.prevRenderArmYaw) * partialTicks;

        // Bobbing animation
        if (this.minecraft.settings.viewBobbing) {
            this.bobbingAnimation(player, stack, partialTicks, true);
            this.bobbingAnimation(player, offhandStack, partialTicks, true, true);
        }

        let factor = 0.8;
        // Only apply swing variables if the specific hand is swinging
        const isMainSwing = player.swingingHand === 'main' && swingProgress > 0;
        const isOffSwing = player.swingingHand === 'off' && swingProgress > 0;

        let zOffset = isMainSwing ? Math.sin(swingProgress * Math.PI) : 0;
        let yOffset = isMainSwing ? Math.sin(Math.sqrt(swingProgress) * Math.PI * 2.0) : 0;
        let xOffset = isMainSwing ? Math.sin(Math.sqrt(swingProgress) * Math.PI) : 0;

        let sqrtRotation = isMainSwing ? Math.sin(Math.sqrt(swingProgress) * Math.PI) : 0;
        let powRotation = isMainSwing ? Math.sin(swingProgress * swingProgress * Math.PI) : 0;

        let offXOffset = isOffSwing ? Math.sin(Math.sqrt(swingProgress) * Math.PI) : 0;
        let offYOffset = isOffSwing ? Math.sin(Math.sqrt(swingProgress) * Math.PI * 2.0) : 0;
        let offZOffset = isOffSwing ? Math.sin(swingProgress * Math.PI) : 0;

        let offSqrtRot = isOffSwing ? Math.sin(Math.sqrt(swingProgress) * Math.PI) : 0;
        let offPowRot = isOffSwing ? Math.sin(swingProgress * swingProgress * Math.PI) : 0;

        // Camera rotation movement
        stack.rotateX(MathHelper.toRadians((player.rotationPitch - pitchArm) * 0.1));
        stack.rotateY(MathHelper.toRadians((player.rotationYaw - yawArm) * 0.1));
        
        offhandStack.rotateX(MathHelper.toRadians((player.rotationPitch - pitchArm) * 0.1));
        offhandStack.rotateY(MathHelper.toRadians((player.rotationYaw - yawArm) * 0.1));

        // Render Offhand Item if present
        let offhandId = player.inventory.offhand.id;
        if (offhandId !== 0) {
            // Check if Eating with Offhand
            const isEatingOffhand = (player.itemInUse !== null && player.isUsingOffhand);
            
            if (isEatingOffhand) {
                const dev = player.minecraft.devTools;
                const e = dev.eating;
                let bob = Math.sin((player.itemInUseTimer || 0) * 0.6) * 0.08;
                this.translate(offhandStack, -offXOffset * 0.1, offYOffset * 0.1 + bob, -offZOffset * 0.1);
                this.translate(offhandStack, -e.x, e.y, e.z); // Mirror X for offhand eating
                offhandStack.rotateX(e.rotationX);
                offhandStack.rotateY(-e.rotationY); // Mirror Y rotation
                offhandStack.rotateZ(-e.rotationZ); // Mirror Z rotation
                offhandStack.scale.set(0.0625 * e.scale, 0.0625 * e.scale, 0.0625 * e.scale);
            } else {
                // Apply similar mirrored transform
                this.translate(offhandStack, offXOffset * 0.4, offYOffset * 0.2, -offZOffset * 0.2);
                this.translate(offhandStack, -0.7 * factor, -0.4 * factor - (1.0 - equipProgress) * 0.6, -0.9 * factor);

                offhandStack.rotateY(MathHelper.toRadians(-45));
                offhandStack.rotateY(MathHelper.toRadians(-offPowRot * 20));
                offhandStack.rotateZ(MathHelper.toRadians(-offSqrtRot * 20));
                offhandStack.rotateX(MathHelper.toRadians(-offSqrtRot * 80));

                offhandStack.scale.x *= 0.4;
                offhandStack.scale.y *= 0.4;
                offhandStack.scale.z *= 0.4;
            }
            
            offhandStack.visible = true;
        }

        if (hasItem) {
            // Check if Eating or in Eating Dev Mode
            const isEatingMain = (player.itemInUse !== null && !player.isUsingOffhand);
            const isDevEating = isEatingMain || (this.minecraft.currentScreen && this.minecraft.currentScreen.constructor.name === "GuiDevTools" && this.minecraft.devTools.mode === "eating");

            if (isDevEating) {
                const dev = player.minecraft.devTools;
                const e = dev.eating;

                // Apply subtle bobbing based on the eating timer
                let bob = Math.sin((player.itemInUseTimer || 0) * 0.6) * 0.08;
                
                // Position in center of screen and apply bob
                this.translate(stack, -xOffset * 0.1, yOffset * 0.1 + bob, -zOffset * 0.1);
                this.translate(stack, e.x, e.y, e.z);
                
                // Apply corrective rotations to face the item toward the player during eating
                stack.rotateX(e.rotationX);
                stack.rotateY(e.rotationY);
                stack.rotateZ(e.rotationZ);
                
                // apply scale relative to base 1/16 scale
                stack.scale.set(0.0625 * e.scale, 0.0625 * e.scale, 0.0625 * e.scale);

                player.renderer.updateFirstPerson(player);
                return;
            }

            // Check if Sword Blocking
            const isSword = [268, 272, 267, 283, 276].includes(itemId);
            if (isSword && player.isBlocking) {
                // Apply Blocking Transform - use simplified hand position
                // The actual item transform is handled in BlockRenderer.renderBlockInFirstPerson
                this.translate(stack, -xOffset * 0.1, yOffset * 0.1, -zOffset * 0.1);
                this.translate(stack, 0.2 * factor, -0.4 * factor - (1.0 - equipProgress) * 0.6, -0.4 * factor);

                // Render item
                player.renderer.updateFirstPerson(player);
                return;
            }

            // Check if Map
            if (itemId === 358) { // Map ID
                // Map specific transform: Centered, lower, tilted up
                
                // Adjust for equip progress (slide up)
                let equipOffset = (1.0 - equipProgress) * 2.0;
                
                // Dynamic Tilt & Position based on pitch
                // Pitch: -90 (Up) to +90 (Down)
                let pitch = player.rotationPitch;
                let pitchFactor = pitch / 90.0;
                if (pitchFactor < -1.0) pitchFactor = -1.0;
                if (pitchFactor > 1.0) pitchFactor = 1.0;
                
                // Values for Looking Forward (Pitch 0) - "Holding Mode"
                // Lower on screen, tilted away to be flatter
                let yHold = -0.6;
                let zHold = -1.1;
                let tiltHold = 50.0;
                
                // Values for Looking Down (Pitch 90) - "Reading Mode"
                // Higher (centered), flat facing camera
                let yRead = -0.22;
                let zRead = -0.75;
                let tiltRead = 0.0;
                
                let curY, curZ, curTilt;
                
                if (pitchFactor > 0) {
                    // Looking Down: Interpolate Hold -> Read
                    curY = yHold + pitchFactor * (yRead - yHold);
                    curZ = zHold + pitchFactor * (zRead - zHold);
                    curTilt = tiltHold + pitchFactor * (tiltRead - tiltHold);
                } else {
                    // Looking Up: Keep relative to Hold, but slightly adjust to stay nice
                    // "Lower it to be flatter in the players view at the bottom"
                    // We tilt it more flat as we look up, and keep Y relatively stable so it doesn't slide off
                    let upFactor = Math.abs(pitchFactor);
                    
                    curY = yHold - (upFactor * 0.1); // Minimal lowering
                    curZ = zHold;
                    curTilt = tiltHold + (upFactor * 15.0); // Tilt more flat (up to ~65 deg)
                }

                // Base position: Centered X
                this.translate(stack, 0.0 + xOffset * 0.03, curY + yOffset * 0.05 - equipOffset, curZ + zOffset * 0.05);

                // Apply Tilt
                stack.rotateX(MathHelper.toRadians(curTilt));
                
                // Render item
                player.renderer.updateFirstPerson(player);
            } else {
                // Standard Item Transform
                
                // Initial offset on screen
                this.translate(stack, -xOffset * 0.4, yOffset * 0.2, -zOffset * 0.2);
                this.translate(stack, 0.7 * factor, -0.4 * factor - (1.0 - equipProgress) * 0.6, -0.9 * factor);

                // Rotation of hand
                stack.rotateY(MathHelper.toRadians(45));
                stack.rotateY(MathHelper.toRadians(-powRotation * 20));
                stack.rotateZ(MathHelper.toRadians(-sqrtRotation * 20));
                stack.rotateX(MathHelper.toRadians(-sqrtRotation * 80));

                // Scale down
                stack.scale.x *= 0.4;
                stack.scale.y *= 0.4;
                stack.scale.z *= 0.4;

                // Render item
                player.renderer.updateFirstPerson(player);
            }
        } else {
            // Initial offset on screen
            this.translate(stack, -xOffset * 0.3, yOffset * 0.4, -zOffset * 0.4);
            this.translate(stack, 0.8 * factor, -0.75 * factor - (1.0 - equipProgress) * 0.6, -0.9 * factor);

            // Rotation of hand
            stack.rotateY(MathHelper.toRadians(45));
            stack.rotateY(MathHelper.toRadians(sqrtRotation * 70));
            stack.rotateZ(MathHelper.toRadians(-powRotation * 20));

            // Post transform
            this.translate(stack, -1, 3.6, 3.5);
            stack.rotateZ(MathHelper.toRadians(120));
            stack.rotateX(MathHelper.toRadians(200));
            stack.rotateY(MathHelper.toRadians(-135));
            this.translate(stack, 5.6, 0.0, 0.0);

            // Render hand
            player.renderer.renderRightHand(player, partialTicks);
        }
    }

    renderFishingLine(partialTicks) {
        let player = this.minecraft.player;
        if (!player || !player.fishEntity) {
            this.fishingLine.visible = false;
            return;
        }

        let hook = player.fishEntity;
        this.fishingLine.visible = true;

        // Rod position (approximation of hand/rod tip)
        let rodX, rodY, rodZ;
        
        if (this.minecraft.settings.thirdPersonView === 0) {
            // In 1st person, calculate a world-space point that matches the rod tip on screen
            // Use development tool offsets for the rod tip
            const dev = this.minecraft.devTools.fishingRod;
            let rodOffset = new THREE.Vector3(dev.x, dev.y, dev.z);
            
            // Account for walk bobbing to keep line attached to rod tip
            if (this.minecraft.settings.viewBobbing) {
                let walked = player.prevDistanceWalked + (player.distanceWalked - player.prevDistanceWalked) * partialTicks;
                let cameraYaw = player.prevCameraYaw + (player.cameraYaw - player.prevCameraYaw) * partialTicks;
                
                let bobX = Math.sin(walked * Math.PI) * cameraYaw * 0.55;
                let bobY = -Math.abs(Math.cos(walked * Math.PI) * cameraYaw * 0.35);
                
                rodOffset.x += bobX;
                rodOffset.y += bobY;
            }

            // If the player is swinging, the line should follow the animation
            let swingProgress = player.getSwingProgress(partialTicks);
            if (swingProgress > 0) {
                let factor = 0.8;
                let swingZ = Math.sin(swingProgress * Math.PI);
                let swingY = Math.sin(Math.sqrt(swingProgress) * Math.PI * 2.0);
                let swingX = Math.sin(Math.sqrt(swingProgress) * Math.PI);

                rodOffset.x -= swingX * 0.4;
                rodOffset.y += swingY * 0.2;
                rodOffset.z += swingZ * 0.3;
            }

            rodOffset.applyQuaternion(this.camera.quaternion);
            rodOffset.add(this.camera.position);
            
            rodX = rodOffset.x;
            rodY = rodOffset.y;
            rodZ = rodOffset.z;
        } else {
            // Third person rod tip approx (center-chest area)
            let interpX = player.prevX + (player.x - player.prevX) * partialTicks;
            let interpY = player.prevY + (player.y - player.prevY) * partialTicks + player.getEyeHeight();
            let interpZ = player.prevZ + (player.z - player.prevZ) * partialTicks;
            
            let look = player.getLook(partialTicks);
            rodX = interpX + look.x * 0.3;
            rodY = interpY + look.y * 0.3 - 0.4;
            rodZ = interpZ + look.z * 0.3;
        }

        // Hook position
        let hx = hook.prevX + (hook.x - hook.prevX) * partialTicks;
        let hy = hook.prevY + (hook.y - hook.prevY) * partialTicks + 0.125;
        let hz = hook.prevZ + (hook.z - hook.prevZ) * partialTicks;

        const positions = this.fishingLine.geometry.attributes.position.array;
        positions[0] = rodX; positions[1] = rodY; positions[2] = rodZ;
        positions[3] = hx;   positions[4] = hy;   positions[5] = hz;
        this.fishingLine.geometry.attributes.position.needsUpdate = true;
    }

    renderSpawnerMobs(partialTicks) {
        if (!this.minecraft.world || !this.minecraft.player) return;
        const world = this.minecraft.world;
        const time = performance.now() / 1000.0;
        const activeSpawners = new Set();

        world.tileEntities.forEach((te, key) => {
            const coords = key.split(",");
            const x = parseInt(coords[0]);
            const y = parseInt(coords[1]);
            const z = parseInt(coords[2]);

            // Optimization: distance check for spawner rendering
            const distSq = (x + 0.5 - this.camera.position.x)**2 + (y + 0.5 - this.camera.position.y)**2 + (z + 0.5 - this.camera.position.z)**2;
            if (distSq > 1024) return; // 32 blocks

            const id = world.getBlockAt(x, y, z);
            if (id === 52 && te.mobType) {
                activeSpawners.add(key);
                
                let ent = this.spawnerMobEntities.get(key);
                const mobKey = te.mobType.replace("Entity", "").toLowerCase();
                const MobClass = this.minecraft.commandHandler.mobMap[mobKey];
                
                if (!ent || ent.constructor !== MobClass) {
                    if (ent && ent.renderer && ent.renderer.group) {
                        this.scene.remove(ent.renderer.group);
                    }
                    if (MobClass) {
                        ent = new MobClass(this.minecraft, world);
                        this.spawnerMobEntities.set(key, ent);
                    }
                }

                if (ent) {
                    ent.prevX = ent.x = x + 0.5;
                    ent.prevY = ent.y = y + 0.3; // Offset up slightly to center shrunken mob
                    ent.prevZ = ent.z = z + 0.5;
                    
                    // Use a time-based rotation that includes partial ticks for frame-perfect smoothness
                    const rotation = (this.minecraft.world.time + partialTicks) * 6.0; 
                    ent.prevRotationYaw = ent.rotationYaw = rotation % 360;
                    ent.prevRenderYawOffset = ent.renderYawOffset = ent.rotationYaw;
                    ent.rotationYawHead = ent.rotationYaw;
                    ent.scale = 0.25; 

                    // Force idle animation for spawner display
                    ent.getAnimationName = () => "idle";
                    
                    if (ent.renderer && ent.renderer.group && !ent.renderer.group.parent) {
                        this.scene.add(ent.renderer.group);
                    }
                    
                    if (ent.renderer) {
                        ent.renderer.render(ent, partialTicks);
                        ent.renderer.group.visible = true;
                    }
                }
            }
        });

        // Cleanup
        for (let [key, ent] of this.spawnerMobEntities) {
            if (!activeSpawners.has(key)) {
                if (ent.renderer && ent.renderer.group) this.scene.remove(ent.renderer.group);
                this.spawnerMobEntities.delete(key);
            }
        }
    }

    renderStructureOutlines(partialTicks) {
        disposeGroup(this.structureOutlines);
        if (!this.minecraft.world) return;

        const world = this.minecraft.world;
        const player = this.minecraft.player;

        world.tileEntities.forEach((te, key) => {
            const coords = key.split(",");
            const x = parseInt(coords[0]);
            const y = parseInt(coords[1]);
            const z = parseInt(coords[2]);

            const id = world.getBlockAt(x, y, z);
            if (id === 255) { // Structure Block ID
                // Draw outline for this structure block
                const sx = te.sizeX || 1;
                const sy = te.sizeY || 1;
                const sz = te.sizeZ || 1;
                const ox = x + (te.offsetX || 0);
                const oy = y + (te.offsetY || 0);
                const oz = z + (te.offsetZ || 0);

                const geo = new THREE.BoxGeometry(sx, sy, sz);
                const edges = new THREE.EdgesGeometry(geo);
                const line = new THREE.LineSegments(edges, this.structureOutlineMaterial);
                
                // Position at center of capture box
                line.position.set(ox + sx / 2, oy + sy / 2, oz + sz / 2);
                this.structureOutlines.add(line);
            }
        });
    }

    renderBlockHitBox(player, partialTicks) {
        let hitResult = player.rayTrace(5, partialTicks);
        let hitBoxVisible = !(hitResult === null);
        if ((this.blockHitBox.visible = hitBoxVisible)) {
            let x = hitResult.x;
            let y = hitResult.y;
            let z = hitResult.z;

            // Get block type
            let world = this.minecraft.world;
            let typeId = world.getBlockAt(x, y, z);
            let block = Block.getById(typeId);

            if (typeId !== 0 && block) {
                let boundingBox = block.getBoundingBox(world, x, y, z);
                if (!boundingBox) {
                    this.blockHitBox.visible = false;
                    return;
                }

                let offset = 0.01;

                let width = boundingBox.width() + offset;
                let height = boundingBox.height() + offset;
                let depth = boundingBox.depth() + offset;

                // Update size of hit box
                this.blockHitBox.scale.set(
                    width,
                    height,
                    depth
                );

                // Update position of hit box (Simple centering to avoid NaN errors)
                const centerX = x + boundingBox.minX + boundingBox.width() / 2;
                const centerY = y + boundingBox.minY + boundingBox.height() / 2;
                const centerZ = z + boundingBox.minZ + boundingBox.depth() / 2;
                this.blockHitBox.position.set(centerX, centerY, centerZ);
            }
        }
    }

    translate(stack, x, y, z) {
        stack.translateX(x);
        stack.translateY(y);
        stack.translateZ(z);
    }

    rebuildClouds() {
        if (!this.textureClouds || !this.textureClouds.image || this.textureClouds.image.width <= 1) return;
        
        this.cloudGroup.clear();
        
        const img = this.textureClouds.image;
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        const w = canvas.width;
        const h = canvas.height;
        
        // 1 pixel = 16 blocks (1 chunk width)
        const scale = 16; 
        const thickness = 4; // Height of cloud layer
        this.cloudWidth = w * scale;
        
        const isSolid = (x, z) => {
            if (x < 0 || x >= w || z < 0 || z >= h) return false;
            // Check alpha channel
            return data[(z * w + x) * 4 + 3] > 64;
        };

        const cloudTess = new Tessellator();
        // Cloud material: opaque white
        cloudTess.material.side = THREE.DoubleSide;
        cloudTess.material.transparent = false;
        cloudTess.material.opacity = 1.0;
        cloudTess.material.depthWrite = true;
        
        cloudTess.startDrawing();
        
        for (let z = 0; z < h; z++) {
            for (let x = 0; x < w; x++) {
                if (!isSolid(x, z)) continue;
                
                // Box coords
                const x0 = x * scale;
                const x1 = x0 + scale;
                const z0 = z * scale;
                const z1 = z0 + scale;
                const y0 = 0;
                const y1 = thickness;
                
                // Top face (Y+)
                cloudTess.setColor(1.0, 1.0, 1.0);
                cloudTess.addVertex(x0, y1, z1);
                cloudTess.addVertex(x1, y1, z1);
                cloudTess.addVertex(x1, y1, z0);
                cloudTess.addVertex(x0, y1, z0);
                
                // Bottom face (Y-)
                cloudTess.setColor(0.7, 0.7, 0.7);
                cloudTess.addVertex(x0, y0, z0);
                cloudTess.addVertex(x1, y0, z0);
                cloudTess.addVertex(x1, y0, z1);
                cloudTess.addVertex(x0, y0, z1);
                
                // Sides (Shaded for 3D depth effect)
                const s1 = 0.85; // North/South shading
                const s2 = 0.75; // East/West shading
                
                if (!isSolid(x, z - 1)) { // North
                    cloudTess.setColor(s1, s1, s1);
                    cloudTess.addVertex(x0, y1, z0);
                    cloudTess.addVertex(x1, y1, z0);
                    cloudTess.addVertex(x1, y0, z0);
                    cloudTess.addVertex(x0, y0, z0);
                }
                if (!isSolid(x, z + 1)) { // South
                    cloudTess.setColor(s1, s1, s1);
                    cloudTess.addVertex(x0, y0, z1);
                    cloudTess.addVertex(x1, y0, z1);
                    cloudTess.addVertex(x1, y1, z1);
                    cloudTess.addVertex(x0, y1, z1);
                }
                if (!isSolid(x - 1, z)) { // West
                    cloudTess.setColor(s2, s2, s2);
                    cloudTess.addVertex(x0, y1, z1);
                    cloudTess.addVertex(x0, y1, z0);
                    cloudTess.addVertex(x0, y0, z0);
                    cloudTess.addVertex(x0, y0, z1);
                }
                if (!isSolid(x + 1, z)) { // East
                    cloudTess.setColor(s2, s2, s2);
                    cloudTess.addVertex(x1, y0, z1);
                    cloudTess.addVertex(x1, y0, z0);
                    cloudTess.addVertex(x1, y1, z0);
                    cloudTess.addVertex(x1, y1, z1);
                }
            }
        }
        
        const mesh = cloudTess.draw(this.cloudGroup);
        if (mesh) {
            // Center the geometry so movement is relative to mesh center
            mesh.geometry.center();
            mesh.matrixAutoUpdate = true;
        }
    }

    bobbingAnimation(player, stack, partialTicks, isHand, mirrored = false) {
        let walked = player.prevDistanceWalked + (player.distanceWalked - player.prevDistanceWalked) * partialTicks;
        let yaw = player.prevCameraYaw + (player.cameraYaw - player.prevCameraYaw) * partialTicks;
        let pitch = player.prevCameraPitch + (player.cameraPitch - player.prevCameraPitch) * partialTicks;
    
        if (isHand) {
            let bobX = Math.sin(walked * Math.PI) * yaw * 0.8;
            let bobY = -Math.abs(Math.cos(walked * Math.PI) * yaw * 0.4);
            let bobAngle = Math.sin(walked * Math.PI) * yaw * 4.0;
            
            if (mirrored) {
                bobX = -bobX;
                bobAngle = -bobAngle;
            }

            this.translate(stack, bobX, bobY, 0.0);
            stack.rotateZ(MathHelper.toRadians(bobAngle));
        } else {
             this.translate(
                stack,
                Math.sin(walked * Math.PI) * yaw * 0.5,
                -Math.abs(Math.cos(walked * Math.PI) * yaw),
                0.0
            );
    
            stack.rotateZ(MathHelper.toRadians(Math.sin(walked * Math.PI) * yaw * 3.0));
            stack.rotateX(MathHelper.toRadians(Math.abs(Math.cos(walked * Math.PI - 0.2) * yaw) * 5.0));
        }
    
        stack.rotateX(MathHelper.toRadians(pitch));
    }

    reset() {
        if (this.minecraft.world !== null) {
            const oldWorld = this.minecraft.world;
            for (const entity of oldWorld.entities) {
                if (entity.renderer && typeof entity.renderer.dispose === "function") {
                    entity.renderer.dispose();
                }
            }
            for (const item of oldWorld.droppedItems) {
                if (typeof item.kill === "function") item.kill();
            }
            for (const chunk of oldWorld.chunks.values()) {
                chunk.unload();
            }
            oldWorld.chunkLoadQueue.length = 0;
            if (oldWorld.chunkLoadSet) oldWorld.chunkLoadSet.clear();
            oldWorld.lightingInitQueue.length = 0;
            if (oldWorld.lightEngine) oldWorld.lightEngine.clear();
            this.scene.remove(oldWorld.group);
        }
        disposeGroup(this.signGroup);
        if (this.signGroup) this.scene.remove(this.signGroup);
        this.signCache = new Map();
        // Furnace readouts are per-world; drop them with the old world.
        this.furnaceDisplayRenderer?.dispose();
        disposeGroup(this.techBillboardGroup);
        disposeGroup(this.structureOutlines);
        disposeGroup(this.debugGroup);
        this.webRenderer.clear();
        this.overlay.clear();
        this.chunkSectionUpdateQueue = [];
    }
}
