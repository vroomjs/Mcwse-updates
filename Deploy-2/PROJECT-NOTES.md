# Minecraft Websim Edition — intake notes

Downloaded from MediaFire (`Final-Version.zip`, 19.8 MB, md5 `51a452ec114274aa63e2be998075ec92`)
and extracted to `/home/user/project`.

## What it is

A browser-based Minecraft clone built on **Three.js 0.150.0**, pure ES modules, no build step.

| | |
|---|---|
| Entry point | `index.html` → `src/js/Start.js` |
| Modules in graph | 290 |
| Lines of JS | ~68,900 (excluding `libraries/`) |
| Block types | 96 |
| GUI screens | 53 |
| Mobs | 23 (10 hostile, 13 passive) |
| Structure generators | 8 |
| Assets | 212 PNG, 18 glTF, 1 FBX, 1 GLSL shader, intro MP4 |

**Dependencies** come from the `esm.sh` CDN via an import map in `index.html`:
`three`, `three/addons/*`, `nipplejs` (mobile joystick), `peerjs` (multiplayer), `jszip`.
A local `libraries/three.module.js` is also vendored but not referenced by the import map.

**Architecture.** Two coexisting layouts, both live:
- `src/js/net/minecraft/...` — the Java-style package tree (client, world, entity, gui, render, util)
- Root-level feature modules — `Multiplayer.js`, `structures.js`, `Redstone.js`, `Farming.js`,
  `Boats.js`, `Minecarts.js`, `Nether.js`, `End.js`, `Signs.js`, `Armor.js`, `Map.js`,
  `Saplings.js`, `BlockParticles.js`. These are **not** stray files — `BlockRegistry.js`,
  `Minecraft.js` and `CommandHandler.js` import them.

Also: a PWA service worker (`sw.js`), `manifest.json`, mobile touch controls, and a
skippable intro video.

## Health check

Module graph fully resolves. All routes serve 200 with correct MIME types.
Every `.js` file parses.

### Fixed

- **`src/js/net/minecraft/client/world/block/type/BlockPumpkin.js:90`** — `spawnIronGolem()`
  did `import("../../entity/passive/EntityIronGolem.js")`, one `../` short. Line 5 gets the
  snow golem path right (`../../../`), so this was an inconsistency, not a missing file.
  Because it's a *dynamic* import it didn't break startup — it threw an unhandled promise
  rejection the moment a player finished stacking an iron golem, so the golem just never
  appeared. Changed to `../../../`.

### Known issues, not touched

**1. Two files are AI placeholder artifacts, written to disk literally.**

- `src/js/net/minecraft/client/foliage/Foliage.js` — the entire file is the text
  `... existing code ...`
- `src/js/World/World.js` — a bare `checkFluidInteractions()` / `updateLiquid()` method pair
  with no enclosing class, bracketed by `// ... existing code ...`

Both are **unreachable** — nothing imports them, which is why the game still runs. The real
foliage class is `world/block/type/BlockFoliage.js`; the real world is
`client/world/World.js`. They're safe to delete.

But note what the second one implies: the fluid logic in `src/js/World/World.js` — flowing
water + source lava → obsidian, flowing lava + source water → cobblestone, flowing + flowing
→ stone — **was never merged**. `client/world/World.js` has no `checkFluidInteractions`,
no `updateLiquid`, no `getLiquidLevel`. That feature is written but not wired in.

**2. Eleven more unreachable `.js` files.** Some look like whole features that were built and
never hooked up to a menu:

```
Start.js                  (root copy; differs from src/js/Start.js — the real one)
src/js/Commands.js        (29 bytes, stub)
src/js/net/minecraft/client/IngameOverlay.js
src/js/net/minecraft/client/gui/screens/GuiGameSettings.js
src/js/net/minecraft/client/gui/screens/GuiModChoice.js
src/js/net/minecraft/client/gui/screens/GuiModHowTo.js
src/js/net/minecraft/client/gui/screens/GuiMods.js
src/js/net/minecraft/client/gui/screens/GuiTextureMode.js
src/js/net/minecraft/client/world/generator/noise/NoiseGeneratorCombined.js
src/js/net/minecraft/util/MetadataChunkBlock.js
sw.js                     (not an import — registered by index.html, so this one is fine)
```

**3. Missing textures are handled by design, not broken.** `Start.js` checks every texture
path against `AVAILABLE_ASSETS` in `src/js/asset-manifest.js` and substitutes a 1×1 magenta
placeholder for anything absent, specifically to avoid 404 storms from older resource packs.
So references to `terrain.png`, `items.png`, `gui/widgets.png`, the `panorama_*.png` set, the
wool/terracotta color ramps and the tool/armor item icons all resolve to magenta rather than
failing. If any of those show up magenta in game, the asset genuinely isn't in this zip —
it's not a path bug.

## System dialogs (added)

`src/js/net/minecraft/client/gui/SystemDialogManager.js` — Bedrock-style status popups.

```js
const id = minecraft.systemDialogs.show("Requested to join Steve's world.");
minecraft.systemDialogs.setText(id, "...");   // revise in place
minecraft.systemDialogs.dismiss(id);          // slide out
minecraft.systemDialogs.show(text, { duration: 6000, sticky: false, width: 160 });
```

Chrome is drawn to match the reference art exactly — verified pixel-for-pixel, 0/10240
differing pixels: 1px `#000000` outline, 2px `#286485` border, `#082C4C` fill. The
exclamation icon is drawn procedurally rather than loaded as a texture, so it needs no
asset and stays crisp at any GUI scale. Its bevel rule (top row highlight except the last
column, bottom row shadow except the first, left column highlight, right column shadow)
reproduces the source pixels exactly, and its 11/2/4 stem/gap/dot split falls out of the
scaling math at two lines, which is the case the reference depicts.

Two deliberate deviations from the reference, which is an *empty* 160×64 template:
content is centred vertically (top-aligning real text to the 8px padding left the bottom
half visibly dead), and the icon scales with the line count so it doesn't overhang a
one-line message. Box stays 160×64 unless the text needs more.

**Rendered from `ScreenRenderer.render()`, not `IngameOverlay`.** The join popup fires while
`GuiMultiplayer` is still open, and `IngameOverlay` only draws once a world is loaded.
Drawing after the menu pass puts dialogs above both the HUD and any open screen.

**Timing is wall-clock, not ticks**, for the same reason — `onTick()` is not a dependable
heartbeat while sitting in a menu, so animation and expiry run off `performance.now()`.

Test it in game with `/systemdialog <text>`.

### Join flow

The client only ever has a LAN code, so the host's name is genuinely unknown when the
request is sent. The dialog therefore opens as *"Requested to join this world."* and the
host answers the `join_request` with a new `join_pending` message carrying its username,
which rewrites the dialog in place to *"Requested to join Steve's world."* On approval it
dismisses and a short *"Joining Steve's world."* replaces it.

The new message is additive — a host running older code simply never sends it, and the
client keeps the neutral phrasing.

## Unseen notification badge (added)

A 10×10 red badge with a yellow exclamation mark, shown on the pause menu at **x 34, y 10** —
immediately right of the DEV button (x 5, w 25) and centred against its 20px height.
Drawn by `Gui.drawUnseenBadge(stack, x, y, scale)`, procedural like the dialog icon, and
verified pixel-for-pixel against the reference art (0/100 differing pixels).

It lives on `Gui` rather than on the menu so other screens can reuse it.

### What counts as "missed"

A join request that leaves the host's queue **without the host ever accepting it**.
Accepted requests are shifted off by `acceptPendingJoin()` and never touch this path, so
they can't produce a false badge.

In practice that's the requester disconnecting before the host holds E — handled in the
`conn.on('close')` branch of `setupConnection`, which already dropped pending requests but
previously did so silently.

Worth knowing: `cancelJoinRequest()` was **dead code** — defined but called from nowhere,
while the close handler carried its own inlined copy of the same filter. Both paths now
record missed requests, so whichever one gets wired up later behaves correctly.

### Behaviour

`Multiplayer` keeps `missedJoinRequests` (capped at 16) with
`recordMissedJoinRequests()` / `hasMissedJoinRequests()` / `clearMissedJoinRequests()`.
The badge shows only while hosting, so it disappears on its own if the host returns to the
title screen. Clicking it clears the list and reports who tried, reusing the system dialog:
*"Steve tried to join your world."*, *"Steve and Alex tried..."*, or *"4 players tried..."*.

`GuiIngameMenu.mouseClicked` hit-tests the badge before delegating to `super`, since the
badge is painted directly rather than being a `GuiButton`.

## Saved remote worlds (added)

`RemoteWorlds.js` (root, matching the other feature modules) + rendering in `GuiSelectWorld`.

**Approval no longer auto-joins.** When a host accepts, the client saves the world and
closes the connection; you launch it later from Select World. The flow is:

1. `join(code)` sends a request as before.
2. The host's `join_approved` now carries `token`, `code`, `hostUsername` and `worldName`.
3. The client stores that entry and shows *"Steve's world was added to your worlds."*
4. `GuiMultiplayer` sends you to Select World instead of into the game.

Two ordering hazards worth remembering if this is touched again. The host fires
`world_info` immediately after approving, which would load the world anyway — hence the
`suppressWorldLoad` guard. And the promise must resolve *before* `disconnect()`, because
resolving sets the `settled` flag that stops teardown errors rejecting the join.

### Re-joining without re-asking

`acceptPendingJoin()` issues a **reusable** 30-day grant, persisted by the host under
`mc_issued_join_tokens_v1`. This is deliberately separate from `approvedJoinTokens`, which
stays one-shot and in-memory for the watcher flow. Without host-side persistence the saved
entry would need fresh approval after every host restart, which defeats the point.

### Ping

Liveness is checked with PeerJS directly rather than by joining: one shared probe Peer dials
the host id, and whether the connection opens is the answer. PeerJS reports a failed dial on
the *Peer*, not the connection, so failures are routed back to the right entry by matching
the peer id inside the error message. A `lan_pong` reply additionally supplies world name
and player count but is not required to call a host found — the open connection already
proved it. Hosts answer `lan_ping` and drop the prober out of `connections` first, since a
probe is not a player.

Status drives the row: `pinging` → `Server_pinging.png` thumbnail with `pinging_1..5`
sweeping at 140ms/frame; `found` → `server_found.png` plus the `join.png` arrow, swapping to
`join_highlighted.png` on hover; `unknown` → `ping_unknown.png` and "Can't connect".
Entries re-check every 30s while the screen is open, throttled to one sweep per second.

Status is **never** persisted — only `code`, `hostUsername`, `worldName`, `token`,
`addedAt` and `lastSeen`, under `mc_remote_worlds_v1`. A reload always re-verifies.

### Notes

Remote rows render below the local saves in the same list and share the selection index via
`getSelected()`. Edit and Re-Create are disabled for them (no local world data); Delete
removes the saved entry; Play is enabled only once the host answers.

LAN sprites are resolved per frame through `getLanTexture()` rather than cached at init,
because they load lazily — a screen opened early would otherwise latch onto the loader's
1×1 magenta placeholder for its whole lifetime.

Tests: `tests/remoteworlds.test.mjs` (`node tests/remoteworlds.test.mjs` from `/home/user`)
covers persistence, both ping outcomes and the frame cycle against a fake peer. 15 passing.

## Stable LAN codes (added)

Hosting used to roll a fresh random code every session, which quietly invalidated every
saved entry in other players' world lists. Codes are now remembered **per world** under
`mc_lan_codes_v1`:

```json
{ "byWorld": { "<worldId>": "ABC123" }, "last": "ABC123" }
```

Keyed on `world.worldId`, falling back to `world.name` for worlds with no save id. A world
with no history deliberately does **not** inherit `last` — that would hand two different
worlds the same code and guarantee a collision. `last` is kept only as a record of the most
recent code.

A code is written only once the peer actually opens, so an id that failed to register is
never offered again.

### The unavailable-id ladder

The common reason a remembered code is rejected is the host's *own* peer from the previous
session not having expired on the signalling server yet — which is exactly the reload case
code reuse exists to serve. Abandoning the code there would defeat the feature, so:

1. Remembered code busy → wait 1.5s and retry **the same code** once.
2. Still busy → `forgetLanCode()` and rotate to a fresh one.
3. No remembered code → rotate immediately, no delayed retry.

Retry state rides along the recursive `host(world, state)` call so the ladder can't loop.

Tests: `tests/lancode.test.mjs` — per-world isolation, persistence across a reload, corrupt
storage, and each branch of the ladder including termination. 14 passing.

## PVP (added)

Players can damage each other in LAN worlds. It was previously hard-disabled: both melee
target loops in `Minecraft.js` skipped `RemotePlayerEntity` outright, so a swing at another
player passed straight through them.

### Victim-authoritative damage

A player's health, armour, potion effects, hunger and death are all owned by their own
client. A `RemotePlayerEntity` is only a render proxy — it carries no real health — so an
attacker who damaged it locally would desync immediately.

Instead the attacker *reports* the hit and the victim decides what it costs:

| | |
|---|---|
| Attacker | computes damage as normal, then `multiplayer.sendPlayerDamage(victim, damage, player)` instead of `takeHit`. Plays a local flash + hit sound as immediate feedback. Weapon durability and exhaustion still apply. |
| Wire | `{type:'player_damage', target, from, attacker, damage, kx, kz}`. Broadcast, not addressed — the host relay already whitelisted `player_damage`, and bystanders use it to flash the victim so fights are visible to onlookers. |
| Victim | `handlePlayerDamage` matches `target` against its own peer id, then hands the hit to the normal `player.takeHit(attackerEntity, damage, "player")`. |

Routing works in all three directions without new relay code: client→client goes via the
host's existing fan-out, client→host falls through the relay into the host's own handler,
and host→client is a direct send.

### What the victim enforces

Nothing is trusted from the wire. The victim independently checks its own `pvp` rule,
rejects hits while `hurtTime > 0` (the invulnerability frames that stop a fast attacker
stacking damage), ignores hits when already dead, and is immune in creative and spectator —
matching the guard `takeHit` already applied to every other damage source. Damage is
clamped to `>= 0` so a malformed packet cannot heal.

### Knockback and death

`PlayerEntity.takeHit` already did knockback and death screens, so PVP reuses them rather
than duplicating the logic. `kx`/`kz` are only applied as a fallback when the attacker's
entity isn't known locally yet (presence can lag a fresh joiner).

Two fixes were needed in `takeHit` for it to make sense in PVP:

- The death message derived the killer's name from the class name, so a player kill read
  *"Steve was slain by remoteplayer"*. It now uses the attacker's username.
- Death messages were local-only. They are now broadcast, so **every** death announces
  itself to the world — falls and lava included, not just PVP.
- Thorns called `takeHit` on the render proxy, which did nothing. It now sends a
  `player_damage` back to the real attacker.

### Toggling it

`pvp` is a world game rule defaulting to **true**, synced to clients inside the existing
`world_info` payload. Because clients enforce PVP locally, a mid-session change has to
reach them too — both entry points broadcast `{type:'gamerules', gr:{pvp}}`, and clients
accept that message **only** from the host.

- **Manage LAN → PVP: ON/OFF** button.
- `/gamerule pvp <true|false>`.

Tests: `tests/pvp.test.mjs` — payload shape, unit-vector knockback, every victim-side
rejection, an attacker→victim round trip, bystander isolation, and source-level assertions
that both melee loops stay gated. 39 passing.

## Command block textures (added)

The command block now uses four animated textures — `command_block_front.png`,
`_back.png`, `_side.png` and `_conditional.png` — each a 16×64 vertical strip of four
16×16 frames.

### What it replaced

`renderCommandBlock` expected one *horizontal* sheet and derived the sprite count from
`img.width > img.height`. The shipped `commandblock.png` was square (1024×1024), so the
count came out as 1, tripped the `spriteCount < 3` guard, and fell through to
`renderMineralBlock` — the directional logic never actually ran. The block was a flat
single texture on all six faces.

### Face mapping

`commandBlockTextureFor(dir, conditional, face)` is pure and vector-based: it compares the
face normal against `COMMAND_BLOCK_FACING[dir & 3]`. Front and back are the two faces on
the facing axis; everything else — **including top and bottom** — takes the side texture,
which is what the vanilla model does. A conditional block swaps side for the chevron
variant and leaves front/back alone.

Each face binds its own tessellator via `getTessellator(textureName)`, because the four
textures are separate files rather than regions of one atlas.

### Animation

Frames are selected the same way fire, water and the portal already do it — the material's
`repeat`/`offset`, not geometry UVs:

- at bind: `repeat.set(1, 1/4)`, `wrapT = RepeatWrapping`, `NearestFilter`, `flipY = false`
- geometry passes a full `0..1` V range and lets the material narrow it
- `WorldRenderer.renderSceneForPlayer` walks `offset.y = (frameCount - 1 - frame) / frameCount`
  at 100 ms per frame, inside the existing `if (!isPaused)` block

The frame index is computed **once** and applied to all four textures, so the faces cannot
drift out of step. The `frameCount - 1 - frame` inversion is required by `flipY = false`.

### Conditional

Metadata bit 3 (`& 8`) marks a block conditional; the low two bits stay as facing, so the
two never collide. The command block GUI gained a **Conditional / Unconditional** toggle
that writes through `setBlockDataAt`, which already handles the chunk rebuild and the
multiplayer sync.

> This is currently **cosmetic** — the block renders as conditional but still executes
> unconditionally. Real conditional behaviour needs chain blocks and success tracking,
> which this engine doesn't have yet.

A missing texture falls back to `renderMineralBlock` rather than rendering nothing.

Tests: `tests/commandblock.test.mjs` — file dimensions and frame distinctness, registration
in all three lists, the full face mapping for all four directions, conditional swapping,
frame maths including wrap-around, and the degradation path. 37 passing.

## Camera studio layout (reworked)

The studio was squished on large windows. Two separate defects, both measurable:

1. **Buttons ran off the bottom of the screen.** `bottomH = Math.max(86, height - bottomY - 31)`
   forced 86px of dock even when only 38 remained, so the dock overflowed by up to 17px and
   EXIT STUDIO, ADD, PROPERTIES and `-` were unreachable at 1280×720, 1366×768, 1440p, 4K
   and both ultrawides. The old CONTROLS panel also overlapped its own buttons.
2. **The monitor stretched to 2.4:1, 3.25:1, even 4.90:1.** The video is height-limited, so
   the extra width became black bars — at 32:9 the picture stayed 167×94 inside a 564px-wide
   panel.

### Why "bigger window" means "worse"

`GameWindow.updateScaleFactor` raises the GUI scale until `w/(s+1) < 320 || h/(s+1) < 240`,
so the logical canvas is always roughly 320–860 wide by 240–480 tall. Growing the window
raises the scale instead of the canvas: logical height collapses toward **240** while
logical width keeps tracking the aspect ratio. A bigger window is therefore a *shorter,
wider* canvas. 1920×1200 actually gets a shorter canvas (240) than 1024×768 (256) — an
engine-wide behaviour this screen can't fix locally.

### What replaced it

`layout()` now returns named `{x,y,w,h}` rects for every panel instead of scattered
scalars, and both `init()` and `drawScreen()` read those rects — no absolute arithmetic in
two places. Everything derives from a real vertical budget, so no minimum can push content
off-screen. The monitor tracks 16:9 against the *video* area, not the panel, so the feed
fills it.

Two arrangements:

| | |
|---|---|
| **stacked** | default. Monitor + PROGRAM on top, four dock panels beneath. |
| **wide** | `usableW >= 540 && W/H >= 1.95`. The dock moves *beside* the monitor in two columns, so the preview gets the full canvas height instead of surrendering ~80px to a dock underneath. |

Supporting adjustments: CONTROLS folds to a 2×2 grid with short labels when the dock is
too short for four stacked buttons; the source-row count comes from `visibleRows(L)`, shared
by `init` and the scroll handler so they can't disagree; PROGRAM flows its label/value rows
into as many columns as fit and centres them vertically.

### Result

| window | before | after | picture |
|---|---|---|---|
| 1280×720 | 2.38:1, EXIT clipped | 1.56:1, fits | 0.94× |
| 1920×1080 | 2.40:1 | 1.60:1 | 1.06× |
| 3840×2160 | 2.38:1, EXIT clipped | 1.56:1, fits | 0.94× |
| 3440×1440 | 3.24:1, EXIT clipped | 1.52:1, wide | **2.91×** |
| 5120×1440 | 4.90:1, EXIT clipped | 1.65:1, wide | **3.35×** |

The 0.94× on 16:9 is the honest cost of keeping the dock on-screen — the old layout was
only taller because it overflowed.

Tests: `tests/camerastudio.test.mjs` lifts the real `layout`/`visibleRows`/`init` and runs
them headlessly — a brute-force sweep of the whole reachable logical range asserting no
panel or button escapes, no panels overlap, aspect stays within 1.15–2.0:1, letterbox waste
below 20%, and all original actions survive. 23 passing.

## MCWSE Preview switch (added)

A toggle switch on the main menu, sharing the bottom row with the **Streams**
button. Styled after the reference screenshots' "Minecraft Preview" control.

**Widget:** `src/js/net/minecraft/client/gui/widgets/GuiToggleSwitch.js`

It **extends `GuiButton`**, which matters: `GuiScreen.mouseClicked` only ever
iterates `buttonList` and calls `isMouseOver`/`mouseClicked` on its entries, so
subclassing is what makes the switch clickable at all. A standalone widget
class would need a `mouseClicked` override on every screen that hosts it. Only
`render()` is replaced; hit testing, the click sound and `enabled` are inherited.

**Anatomy** (the look was sampled pixel-by-pixel from the reference, not guessed):

- Two cells side by side, each with its own 1px dark outline, abutting so the
  shared edge reads as a 2px divider.
- The **knob is taller than the track** and the two are *bottom aligned*, so the
  knob stands proud of the track — this stepped silhouette is the single most
  recognisable part of the control.
- The knob is lit on **three** sides (top, left, right) over a **2px** dark base.
  It is not a uniform bevel; a dark right edge makes it look sunken instead.
- The track takes a conventional bevel: light top/left, dark bottom/right.
- On = green track on the left carrying a white `I`, knob on the right.
  Off = knob slides left, track greys out, glyph disappears.

Geometry: `SWITCH_W = 30`, `SWITCH_H = 16`, `TRACK_DROP = 3`, `LABEL_GAP = 6`.
The ~1.9:1 aspect comes from the reference (65×35 source px). Palette lives in
`GuiToggleSwitch.COLORS`; every value there was read off the screenshots except
the three `off*` greys, which the references never show in an off state.

`GuiToggleSwitch.widthFor(minecraft, label)` returns switch + gap + label width
so a screen can lay the row out before the widget exists. The whole row,
label included, is the click target.

**Placement:** `GuiMainMenu.init()`, immediately after the Streams button.
Default position is 8px to the left of Streams, vertically centred in its 20px
row. If that would run into the bottom-left version string the switch moves to
the row *above* Streams, right-aligned — at 320 logical width the row genuinely
does not fit, and the fallback is what keeps it legible there.

`GuiMainMenu.VERSION_TEXT` was hoisted to a static for this: `init()` measures
the same string `drawScreen()` paints, so the two cannot drift apart.

**State:** `GameSettings.mcwsePreview`, default `false`. `GameSettings.save()`
serialises every non-function field, so persistence to `mc_wse_settings` came
for free. The switch currently only records the preference — **nothing reads it
yet**; wire consumers off `minecraft.settings.mcwsePreview`.

Tests: `tests/mcwsepreview.test.mjs` (31). Lifts the real `init()` and the real
`drawSwitch`/`drawCell`/`drawKnob` so the geometry and pixels asserted are the
shipped ones. Covers placement across every GUI-scale size plus a brute-force
320-860 × 240-480 sweep, no overlap with Streams or the version string, toggle
and persistence, and the appearance invariants above.

## Experimental UI (added)

A second, complete UI skin matching the reference screenshots, living in
`src/js/net/minecraft/client/gui/experimental/`. It is **gated behind the
MCWSE Preview switch** — off gives the classic screens, on swaps in these.

### Gating

`ExpRouter.route(minecraft, screen)` is called from **`Minecraft.displayScreen`**,
which is the single funnel every screen change passes through. That is why no
call site anywhere else had to change, and why flipping the switch takes effect
on the very next screen.

Classic screens are matched by **constructor name**, not `instanceof`:
importing them into the router would create a cycle back through
`Minecraft.js`. There is no build step here, so class names are stable. Set
`screen.isExperimental = true` on a classic screen to opt it out of routing —
`GuiExpWorlds.editBridge()` relies on this to hand off to the classic world
list without being bounced straight back.

Mapping: `GuiMainMenu`→`GuiExpMainMenu`, `GuiIngameMenu`→`GuiExpPauseMenu`,
`GuiOptions`→`GuiExpSettings`, `GuiSelectWorld` and `GuiMultiplayer`→
`GuiExpWorlds` (the reference puts worlds and servers on one tabbed screen).

**Gotcha:** the codebase stores a screen's back-target as `previousScreen`.
The router reads that first; experimental screens mirror it onto `parent`.
Getting this wrong silently breaks every Done/Escape button.

### Theme

`ExpTheme` holds the palette, all of it sampled from the screenshots. The
references use **one** palette across all six, and it is the same one as
`GuiToggleSwitch`: `#48494A` surfaces, `#1C211B` outlines, `#4F8236` green,
`#D0D2D4`/`#EAEDF0` light, `#6D6D6D` chips, `#080E18` tab bar.

`GuiExpButton` extends `GuiButton` (so clicks keep routing through
`buttonList`) and swaps only the painting. Variants: `light` (main menu, dark
**shadowless** text — a shadow under dark glyphs reads as mud), `dark`,
`selected` (green), `chip`, plus `tab`/`card`/`flat`, which are hit zones whose
visuals the owning screen paints.

### Screens

- **`GuiExpMainMenu`** — logo top-left, left button column over a faded side
  panel, preview switch bottom-left (so you can always get *out* of preview
  mode from inside it), version block bottom-right.
- **`GuiExpPauseMenu`** — world name + Back/Quit on the left, secondary column
  on the right headed by the sleep switch. Keeps DEV, 2P, the unseen-join
  badge and Camera Studio even though the reference has none of them; dropping
  them would be a regression. `quitToTitle` is static so the sleep screen can
  reuse the exact classic save path.
- **`GuiExpSleepMode`** — the AFK screen, raised by `AfkTracker`.
- **`GuiExpSettings`** — category sidebar + searchable rows. Two row shapes
  from the reference: *value* (wide plate + chip) and *toggle* (bare label +
  switch). Only interactive parts are widgets; plates and labels are painted
  from the **same** `visibleRows()` the widgets were built from, so the two
  cannot disagree. Rows bind to real `GameSettings` fields.
- **`GuiExpWorlds`** — tabs, search, world and server cards. Cards are placed
  into content space first, then only those intersecting the viewport become
  widgets; this is what stops scrolled-off cards swallowing clicks.

### AFK

`AfkTracker` owns its own window listeners and a 1s interval, so no hot loop
was touched. Fires only when preview **and** `afkSleepMode` are on, a world is
loaded, and no screen is open. `settings.afkMinutes` (default 5) sets the
threshold. While the sleep screen is up, `reset()` is ignored so mouse drift
behind it cannot silently restart the clock — the player must dismiss it.

### Features the game does not have

Mods, Quests, Accessibility, Friends, Create Backup, Marketplace and Language
are drawn so the layouts match the references, and call
`ExpRouter.notAvailable()`, which states so plainly via the system dialog.
Everything else is wired to something real.

**Bug this work surfaced:** `GuiExpWorlds.drawThumb` hashed with `>>> 0` but
indexed its palettes with a **signed** `>>`. For hashes past 2^31 that goes
negative and yields `undefined` as a colour. Use `>>>` on unsigned hashes.

Tests: `tests/experimental.test.mjs` (60). The GUI layer has no Three.js
dependency, so these **import the real screens** and drive their real
`init()`/`drawScreen()` rather than lifting source.

Preview tooling: `tools/exp-render.mjs` (records real draw calls against a
fake 2D context) + `tools/exp-raster.py` (rasterises them with the game's own
`font.png`). `node tools/exp-render.mjs dump && python3 tools/exp-raster.py 3`.

### Experimental UI — second pass

**Service worker removed.** `sw.js` is deleted and the registration in
`index.html` is replaced by a teardown shim that unregisters any worker a
browser still holds and deletes its caches. The old cache-first worker served
stale files and interfered with static-host deploys. `manifest.json` stays;
it only carries PWA metadata and caches nothing.

**New modules**

| file | role |
|---|---|
| `GuiExpSlider.js` | continuous range control; drag semantics copied from `GuiSliderButton` |
| `GuiExpKeyButton.js` | keybind capture chip; **Escape cancels** instead of binding |
| `GuiExpSkins.js` | skin customiser, **deliberately Three-free** |
| `GuiExpAddServer.js` | Add Server modal behind the `+` tile |

**Settings now contains the whole classic tree.** `rowsFor()` gained three row
types — `slider`, `key`, `header` — on top of `value`/`toggle`/`action`.
Every classic sub-screen's options are inline: all 12 key bindings, all four
volumes plus music delay and 3D audio, the chat opacities/scale/colours, the
accessibility set, and a new **Performance** category carrying the light-engine
budgets (`maxLightUpdatesPerFrame`, `lightUpdateBudgetMs`, `maxLightQueueSize`,
`chunkLoad`, `chunkRebuildBudgetMs`). Nothing in this UI opens a classic
settings screen any more; `ExpRouter` additionally maps `GuiPerformance`,
`GuiSoundSettings`, `GuiControls`, `GuiChatSettings` and `GuiAccessibility`
onto the pane with that category pre-selected, and `GuiSkins` → `GuiExpSkins`.

Sliders were chosen over cycling chips for continuous values because the
classic screens exposed the full range; four preset stops would have lost
resolution the player already had.

**Pause menu**
- Widgets **slide in from their own side** — `openedAt` + `slideProgress()`
  (ease-out cubic, 220 ms, wall-clock). `init()` records `_homeX`/`_fromRight`
  per widget; `applySlide()` offsets them each frame. Resizing re-runs `init()`
  but **must not restart the clock**, so `openedAt` is only set when unset.
- **Quests removed** on request.
- **Create Backup** is real: saves the world, reads the canonical record back
  out of IndexedDB via `WorldStorage.loadWorld(worldId)`, and downloads it as
  `<name>-backup-<date>.json`.
- Sub-screens open via `openScreen(file)`, which **catches rejections**. The
  old bare `import().then()` chains swallowed failures silently — that is why
  Statistics appeared to do nothing.

**World management**
- `tabButtons(L)` fits the tab strip to the width left of the action panel:
  gap shrinks 6→1, then inner padding 4→1, then labels are clipped evenly.
  Previously the strip used fixed positions and **ran underneath "Create New
  World"** at narrow widths — the reported "Singleplayer clipping" bug.
- **Back** sits at the foot of the right-hand action panel. The card column is
  clipped to `contentW` and never reaches there, so unlike a bottom-left
  placement it cannot be painted over a world card.
- The `+` tile and the Add Server button both open `GuiExpAddServer`.

**Text rule change.** `ExpTheme.bigText()` draws scaled text via a canvas
transform. The old "draw twice, 1px apart" bold **merged adjacent glyphs** at
8px — section headings and button labels came out as smears. Emphasis is now
scale (headings) or a brighter fill (buttons); the 1px double-strike is gone
everywhere.

**Harness.** `tools/exp-render.mjs` now tracks canvas `translate`/`scale` and
records `sx`/`sy` on text ops; `tools/exp-raster.py` scales glyph blits to
match. Screens with an entry animation are settled before capture unless the
scene passes `keepClock: true`.

### Experimental UI — third pass

**World thumbnails are real now.**
- `client/world/WorldThumbnail.js` captures the player's POV as a 160x90 JPEG
  data URL. This only works because `WorldRenderer` builds its `WebGLRenderer`
  with **`preserveDrawingBuffer: true`** — without that the read-back is blank.
  Kept small and lossy on purpose: thumbnails ride inside the world record in
  IndexedDB.
- `World.saveWorldData()` stores it as `thumb`, falling back to the previous
  one so a save made from a menu does not wipe a good capture.
  `WorldStorage.getWorldList()` surfaces it.
- Servers use the shipped artwork instead: `server_found.png` once the host
  has answered, `Server_pinging.png` otherwise — matching the classic list.
  Both are lazy-loaded, so `lanTexture()` rejects the 1x1 magenta placeholder
  and the procedural tile remains as the fallback for pre-thumbnail worlds.

**The "online, then offline while it was still up" bug.** `RemoteWorlds.ping()`
treated `conn.on("close")` before `PONG_GRACE_MS` as a failure. A busy host
closes the throwaway probe connection almost immediately, so a healthy server
got demoted to `UNKNOWN`. The dial **opening** is already proof of life, so an
`opened` flag now drives the outcome: close-after-open and error-after-open
both settle as `FOUND`, and a probe-peer fault no longer demotes a probe that
had already connected. A dial that never opens is still `UNKNOWN`.
`isConnectedTo()` additionally skips probing a world you are currently standing
in — hosting does not count.

**Join Name.** The Add Server modal's first field is the name you join *as*,
not a label for the server. Stored per entry as `joinName`, persisted through
`save()`/`load()`, and passed to `Multiplayer.join(code, { username })`, which
now honours an override ahead of `settings.username` and the websim fallback.
Blank falls back to the global username, and the field hint shows what that is.

**Edit and delete work.** `edit(item)` takes the card that was clicked — it
previously ignored its argument and always opened the classic world list.
Servers open the Add/Edit modal pre-filled (`RemoteWorlds.update()` re-keys on
a code change, invalidates the stale ping result and refuses a collision);
local worlds still hand off to the classic rename screen. Deleting a server
now reports success or failure.

## Running it

```bash
python3 /home/user/serve.py     # serves /home/user/project on 0.0.0.0:8080
```

A plain static server is all it needs, but it must send `text/javascript` for `.js`
(ES modules are rejected otherwise) — the bundled script sets that plus `no-store`, which
matters because `sw.js` will otherwise cache aggressively while you're editing.

The service worker is the usual dev trap here: hard-reload, or unregister it in
DevTools → Application, if a change doesn't show up.
