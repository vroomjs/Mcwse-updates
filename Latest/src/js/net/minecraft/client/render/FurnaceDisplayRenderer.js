import * as THREE from "three";
import Block from "../world/block/Block.js";
import { disposeObject } from "../../util/dispose.js";

/**
 * Floating smelting readout above an active furnace.
 *
 * Deliberately *not* a sci-fi projection: it's a small physical slate — a
 * carved stone-and-iron plaque with the item being smelted hovering above it
 * and a recessed ember bar burning its way across as the smelt progresses.
 * Everything is real geometry in the world, lit flat so it stays readable,
 * and it turns to face the player the way a hanging sign would swing around.
 *
 * Shown only while a furnace is actually working, and it lingers briefly after
 * the last item so you see the final count.
 */

const FURNACE_IDS = new Set([61]);

// Ticks a furnace takes to smelt one item, mirroring BlockFurnace.
const COOK_TIME = 200;

// How long (ms) the plaque stays up after smelting stops.
const LINGER_MS = 2500;

const RENDER_DISTANCE_SQ = 32 * 32;

// Plaque proportions in world units.
const PANEL_WIDTH = 1.30;
const PANEL_HEIGHT = 0.62;
const PANEL_DEPTH = 0.055;

const CANVAS_SCALE = 3;        // pixels per font unit, for crisp text
const CANVAS_WIDTH = 128 * CANVAS_SCALE;
const CANVAS_HEIGHT = 61 * CANVAS_SCALE;

export default class FurnaceDisplayRenderer {

    constructor(worldRenderer) {
        this.worldRenderer = worldRenderer;
        this.minecraft = worldRenderer.minecraft;
        this.group = null;
        this.displays = new Map();
    }

    get scene() {
        return this.worldRenderer.scene;
    }

    /** Pulls the live smelting state out of a furnace tile entity. */
    readState(tileEntity) {
        const items = tileEntity?.items;
        if (!Array.isArray(items) || items.length < 3) return null;

        const input = items[0] || { id: 0, count: 0 };
        const output = items[2] || { id: 0, count: 0 };
        const burning = (tileEntity.burnTime || 0) > 0;
        const cooking = burning && (input.id || 0) !== 0;

        return {
            inputId: input.id || 0,
            remaining: input.count || 0,
            outputId: output.id || 0,
            done: output.count || 0,
            progress: Math.max(0, Math.min(1, (tileEntity.cookTime || 0) / COOK_TIME)),
            burning,
            cooking
        };
    }

    itemName(id) {
        if (!id) return "Nothing";
        try {
            const block = Block.getById(id);
            return block?.name || "Unknown";
        } catch (_) {
            return "Unknown";
        }
    }

    /**
     * Text face of the plaque. Rebuilt only when the wording actually changes
     * (item or counts), never for progress — the bar handles that, so a
     * furnace running for ten minutes redraws this a couple of dozen times
     * rather than every frame.
     */
    buildPanelTexture(state) {
        const fontRenderer = this.minecraft.fontRenderer;
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.save();
        ctx.scale(CANVAS_SCALE, CANVAS_SCALE);

        // Slate face with a chiselled border.
        ctx.fillStyle = "#2b2622";
        ctx.fillRect(0, 0, 128, 61);
        ctx.fillStyle = "#4a4039";
        ctx.fillRect(0, 0, 128, 1);
        ctx.fillRect(0, 0, 1, 61);
        ctx.fillStyle = "#17120f";
        ctx.fillRect(0, 60, 128, 1);
        ctx.fillRect(127, 0, 1, 61);

        const smelting = state.cooking || state.remaining > 0;
        const title = smelting ? this.itemName(state.inputId) : "Finished";
        const result = state.outputId ? this.itemName(state.outputId) : this.itemName(state.inputId);

        // Headline: what is in the fire.
        fontRenderer.drawString(ctx, this.fit(fontRenderer, title, 120), 5, 5, 0xFFD89B, true);
        // Sub-line: what it becomes.
        fontRenderer.drawString(ctx, this.fit(fontRenderer, "to " + result, 120), 5, 16, 0x9A9A9A, true);

        // Counts.
        fontRenderer.drawString(ctx, "Done " + state.done, 5, 30, 0x8CE08C, true);
        const leftText = "Left " + state.remaining;
        fontRenderer.drawString(ctx, leftText, 123 - fontRenderer.getStringWidth(leftText), 30, 0xE0C98C, true);

        ctx.restore();

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }

    fit(fontRenderer, text, maxWidth) {
        let out = String(text || "");
        if (fontRenderer.getStringWidth(out) <= maxWidth) return out;
        while (out.length > 1 && fontRenderer.getStringWidth(out + "...") > maxWidth) {
            out = out.slice(0, -1);
        }
        return out + "...";
    }

    /** The hovering item itself, reusing the normal block/item renderer. */
    buildItemMesh(id) {
        const holder = new THREE.Group();
        holder.name = "furnace_display_item";
        if (!id) return holder;

        let block;
        try {
            block = Block.getById(id);
        } catch (_) {
            return holder;
        }
        if (!block) return holder;

        const built = new THREE.Group();
        try {
            // force3D = false keeps flat items (ingots, food) as flat sprites,
            // which is how they read in an item frame.
            this.worldRenderer.blockRenderer.renderGuiBlock(built, block, 0, 0, 1.0, 1.0, false);
        } catch (_) {
            return holder;
        }

        built.traverse(child => {
            if (!child.isMesh) return;
            if (child.geometry) child.geometry.center();
            child.position.set(0, 0, 0);
            child.rotation.set(0, 0, 0);
            child.scale.set(1, 1, 1);
            if (child.material) {
                child.material.side = THREE.DoubleSide;
                // Flat-lit so the readout is legible in a dark mineshaft.
                if (child.material.color) child.material.color.setScalar(1.0);
                child.material.depthTest = true;
            }
        });

        built.scale.set(0.34, 0.34, 0.34);
        holder.add(built);
        return holder;
    }

    /** Builds the whole floating assembly for one furnace. */
    createDisplay(state) {
        const root = new THREE.Group();
        root.name = "furnace_display";

        // Backing slab: a real slab of stone with an iron rim, not a glowing
        // pane. Rendered with a basic material so it never goes pitch black.
        const backing = new THREE.Mesh(
            new THREE.BoxGeometry(PANEL_WIDTH + 0.07, PANEL_HEIGHT + 0.07, PANEL_DEPTH),
            new THREE.MeshBasicMaterial({ color: 0x15110f })
        );
        backing.name = "backing";
        root.add(backing);

        const rim = new THREE.Mesh(
            new THREE.BoxGeometry(PANEL_WIDTH + 0.02, PANEL_HEIGHT + 0.02, PANEL_DEPTH * 0.8),
            new THREE.MeshBasicMaterial({ color: 0x5a5048 })
        );
        rim.position.z = 0.004;
        root.add(rim);

        const panelTexture = this.buildPanelTexture(state);
        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT),
            new THREE.MeshBasicMaterial({ map: panelTexture, transparent: true })
        );
        panel.name = "panel";
        panel.position.z = PANEL_DEPTH / 2 + 0.004;
        root.add(panel);

        // Recessed progress track along the bottom of the slate.
        const trackWidth = PANEL_WIDTH - 0.12;
        const track = new THREE.Mesh(
            new THREE.BoxGeometry(trackWidth, 0.085, 0.022),
            new THREE.MeshBasicMaterial({ color: 0x120d0b })
        );
        track.position.set(0, -PANEL_HEIGHT / 2 + 0.10, PANEL_DEPTH / 2 + 0.012);
        root.add(track);

        // The ember that creeps across it. Scaled from the left edge, so the
        // group pivot is parked at the track's left end.
        const fillPivot = new THREE.Group();
        fillPivot.name = "fill_pivot";
        fillPivot.position.set(-trackWidth / 2, track.position.y, PANEL_DEPTH / 2 + 0.02);
        root.add(fillPivot);

        const fill = new THREE.Mesh(
            new THREE.BoxGeometry(trackWidth, 0.055, 0.016),
            new THREE.MeshBasicMaterial({ color: 0xff8a2b })
        );
        fill.name = "fill";
        fill.position.x = trackWidth / 2;
        fillPivot.add(fill);
        fillPivot.userData.trackWidth = trackWidth;

        // Hovering item above the slate.
        const itemMesh = this.buildItemMesh(state.inputId || state.outputId);
        itemMesh.position.set(0, PANEL_HEIGHT / 2 + 0.30, 0);
        root.add(itemMesh);

        return root;
    }

    updateDisplay(entry, state, time) {
        const root = entry.root;

        // Text only redraws when the wording changes.
        const signature = `${state.inputId}|${state.outputId}|${state.done}|${state.remaining}|${state.cooking ? 1 : 0}`;
        if (entry.signature !== signature) {
            const panel = root.getObjectByName("panel");
            if (panel) {
                panel.material.map?.dispose?.();
                panel.material.map = this.buildPanelTexture(state);
                panel.material.needsUpdate = true;
            }
            entry.signature = signature;
        }

        // Swap the hovering item if the furnace moved on to something else.
        const itemId = state.inputId || state.outputId;
        if (entry.itemId !== itemId) {
            const old = root.getObjectByName("furnace_display_item");
            if (old) {
                root.remove(old);
                disposeObject(old, false);
            }
            const mesh = this.buildItemMesh(itemId);
            mesh.position.set(0, PANEL_HEIGHT / 2 + 0.30, 0);
            root.add(mesh);
            entry.itemId = itemId;
        }

        // Progress bar: pure scale, so this is free every frame.
        const fillPivot = root.getObjectByName("fill_pivot");
        if (fillPivot) {
            const progress = state.cooking ? state.progress : 0;
            fillPivot.scale.x = Math.max(0.0001, progress);
            const fill = fillPivot.getObjectByName("fill");
            if (fill?.material?.color) {
                // Ember brightens as the item finishes.
                const heat = 0.55 + 0.45 * progress;
                fill.material.color.setRGB(1.0 * heat, (0.42 + 0.22 * progress) * heat, 0.14 * heat);
            }
        }

        // Gentle bob and a slow turn on the item, like a dropped item.
        const item = root.getObjectByName("furnace_display_item");
        if (item) {
            item.rotation.y = time * 0.9;
            item.position.y = PANEL_HEIGHT / 2 + 0.30 + Math.sin(time * 1.8) * 0.025;
        }
        root.position.y = entry.baseY + Math.sin(time * 1.1) * 0.02;
    }

    render(partialTicks) {
        const world = this.minecraft.world;
        const camera = this.worldRenderer.camera;
        if (!world || !camera || !this.minecraft.fontRenderer) return;
        if (this.minecraft.settings?.furnaceDisplay === false) {
            if (this.displays.size) this.dispose();
            return;
        }
        if (!this.scene) return;

        if (!this.group) {
            this.group = new THREE.Group();
            this.group.name = "furnaceDisplays";
            this.scene.add(this.group);
        }

        const now = performance.now();
        const time = now / 1000;
        const live = new Set();

        for (const [key, tileEntity] of world.loadedTileEntities()) {
            const state = this.readState(tileEntity);
            if (!state) continue;

            const coords = key.split(",");
            const x = parseInt(coords[0], 10);
            const y = parseInt(coords[1], 10);
            const z = parseInt(coords[2], 10);
            if (!FURNACE_IDS.has(world.getBlockAt(x, y, z))) continue;

            const dx = x + 0.5 - camera.position.x;
            const dy = y + 0.5 - camera.position.y;
            const dz = z + 0.5 - camera.position.z;
            if (dx * dx + dy * dy + dz * dz > RENDER_DISTANCE_SQ) continue;

            let entry = this.displays.get(key);

            // Keep the plaque up briefly after the fire goes out so the final
            // tally is readable, then retire it.
            if (state.cooking) {
                if (entry) entry.lastActive = now;
            } else if (!entry || now - entry.lastActive > LINGER_MS) {
                continue;
            }

            if (!entry) {
                const root = this.createDisplay(state);
                root.position.set(x + 0.5, y + 1.32, z + 0.5);
                this.group.add(root);
                entry = {
                    root,
                    baseY: y + 1.32,
                    signature: null,
                    itemId: state.inputId || state.outputId,
                    lastActive: now
                };
                this.displays.set(key, entry);
            }

            live.add(key);
            this.updateDisplay(entry, state, time);

            // Face the player, swinging on the vertical axis like a hanging
            // sign rather than tumbling to track the camera exactly.
            entry.root.rotation.y = Math.atan2(
                camera.position.x - (x + 0.5),
                camera.position.z - (z + 0.5)
            );
        }

        for (const [key, entry] of this.displays) {
            if (live.has(key)) continue;
            this.group.remove(entry.root);
            disposeObject(entry.root, true);
            this.displays.delete(key);
        }
    }

    dispose() {
        for (const [, entry] of this.displays) {
            this.group?.remove(entry.root);
            disposeObject(entry.root, true);
        }
        this.displays.clear();
    }
}
