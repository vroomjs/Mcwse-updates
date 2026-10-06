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

### Experimental UI — world creation

`GuiExpCreateWorld.js` replaces both `GuiCreateWorld` and the little
`GuiCreateWorldChoice` dialog. There is no reference screenshot for world
creation, so it is built from the shared Experimental language: a 1.5x title,
one scrolling pane of rows, and the right-hand Create/Back panel that
`GuiExpWorlds` established. Along with `GuiExpAddServer` it is one of the two
screens to re-check if a reference ever turns up.

Rows are grouped under WORLD / GAMEPLAY / OPTIONS / EXISTING SAVE headers and
come in five types: `text` (name, seed), `value` (cycling chip), `toggle`,
`action` and paint-only `header`. Text rows are taller than the rest and put
their caption above the field, because a 46-104px value chip cannot hold a
32-character world name. Row heights therefore vary, so the pane walks
cumulative heights and renders only rows that fit *entirely* — the column is
never clipped mid-row.

Two behaviours worth knowing:

* **Create does not build the world itself.** It fills in a classic
  `GuiCreateWorld` and calls its `createWorld()`, so seed hashing, generator
  selection and game-rule wiring stay in one place and the two screens cannot
  drift apart.
* **"Customize Flat..." only exists for Flat**, rather than sitting greyed
  out, and **One Block forces Keep Inventory on** the moment it is selected.

"Import Previous World..." is a row here, which is why the chooser screen is
gone: `ExpRouter` maps both `GuiCreateWorld` and `GuiCreateWorldChoice` onto
this screen, and `GuiExpWorlds` opens it directly.

### Join failures no longer mark a server Offline

`describeJoinError()` lives in `src/js/net/minecraft/util/JoinErrors.js` —
deliberately dependency-free, because `RemoteWorlds.js` imports `peerjs` and
the GUI screens that need this message must stay importable without dragging
a WebRTC stack in behind them.

Both `GuiExpWorlds.activate()` and the classic `GuiSelectWorld.joinRemoteWorld()`
used to set `status = "unknown"` when a join attempt failed. A failed attempt
says nothing about whether the host is up — a stale code, a refused approval
or a signalling wobble all look identical — so both now leave the status alone,
report the real cause, and re-ping to find out.

`RemoteWorlds.releaseProbe()` drops the shared probe peer before a join so it
is not racing the join for a signalling slot. A `probeGeneration` counter makes
a cancelled probe unable to write a stale result afterwards; anything mid-ping
reverts to idle rather than being demoted.

### Multiplayer sync: equipment, dropped items, chests

Four separate defects, three of which were wiring that had never been
connected rather than logic that was wrong.

**Held items were invisible on anyone you could see.** `BlockRenderer` already
had `renderItemHand()`, written in bone-space with third-person positioning
and a main-hand/offhand flag — and nothing ever called it. `PlayerRenderer`
only built an item in the first-person branch. `rebuildHeldItems()` now hangs
the main hand off `model.rightArm.bone` and the offhand off `leftArm.bone`.
It must run *after* `super.rebuild()`, because `ModelRenderer.rebuild()` calls
`bone.clear()` and would throw the item away.

**`RemotePlayerEntity` had no `inventory` at all.** `PlayerRenderer` reads
armour and the held item straight off `entity.inventory`, so remote players
rendered bare-handed and unarmoured no matter what the other person was
wearing. It now carries `heldItemId` / `offhandItemId` / `armorIds` behind a
shim exposing exactly the three things the renderer touches:
`getItemInSelectedSlot()`, `getArmor(i)` and an `offhand` getter. `fillMeta`
already tracked `itemInHand` and `armor`, so rebuilds now trigger by
themselves when gear changes.

**Equipment rides on `pos` and `presence`, deliberately.** The host only
relays a whitelist of message types, so a new `equipment` type would never
reach the other clients. `pos` also fires only when you move, so an
equipment change forces a send (`... || eqChanged`) — otherwise swapping
item while standing still never reached anyone. `presence` carries it too,
which covers late joiners.

**Dropped items: `return` where `continue` was meant.** In
`handleItemsSync`, an item already in the world but not yet in `remoteItems`
hit a bare `return` inside the `for` loop, abandoning every remaining item
in that sync. One already-known item was enough to stop the rest of the
ground rendering.

**Chests only synced in `onClose()`.** Contents were invisible to everyone
else until you shut the lid, and whoever closed last silently overwrote the
other person. The persist-and-broadcast half is now `saveAndSync()`, called
on every slot interaction as well as on close. `GuiChest.onTileEntityUpdated()`
accepts a remote change while the chest is open — `Multiplayer` offers every
`tile_entity_sync` to `currentScreen` and `currentScreen2` — so an open
screen no longer shows stale items and then stomps them.

## Running it

```bash
python3 /home/user/serve.py     # serves /home/user/project on 0.0.0.0:8080
```

A plain static server is all it needs, but it must send `text/javascript` for `.js`
(ES modules are rejected otherwise) — the bundled script sets that plus `no-store`, which
matters because `sw.js` will otherwise cache aggressively while you're editing.

The service worker is the usual dev trap here: hard-reload, or unregister it in
DevTools → Application, if a change doesn't show up.

## Stability pass after adoption feedback — 2026-10-04

Addressed the issues called out in review before adding new features:

- **Nether invisible/corrupted chunks:** Nether chunks no longer wait for a full 3×3 neighborhood before their first mesh. They render immediately and then rebuild once neighboring chunks are available, so exploration no longer leaves large cave sections invisible while the loader catches up. Chunk-section rebuilding is also hardened so an unknown/bad block renderer is skipped instead of clearing the whole section and leaving it permanently empty.
- **Command block black dots:** removed stray pure-black artifact pixels from `command_block_front.png`, `command_block_back.png`, `command_block_side.png`, and `command_block_conditional.png` while preserving the 16×64 animated sheets.
- **Pistol player skins:** the pistol GLB's blocky first-person arms now use a dedicated texture created from `settings.skin` instead of the embedded Steve arm texture. It refreshes when the selected/custom skin changes without mutating the shared player texture cache.

Validation: `node --check` passes for the touched JavaScript files, and the command-block textures still load as 16×64 RGBA PNGs.

### Follow-up: pistol arm side faces

The first pistol skin pass bound the selected Minecraft skin directly to the GLB arm material. The GLB arm UVs were authored against a compact arm atlas where the long side strips are at the top of each 16×16 arm block and the end caps are below them. A normal Minecraft skin stores the caps first and side strips underneath, so several side UVs sampled transparent pixels and the outside of the pistol arms disappeared.

`BlockRenderer.createPistolArmSkinCanvas()` now builds a dedicated 64×64 pistol-arm atlas from the selected skin: right arm base/sleeve and left arm base/sleeve are copied into the GLB's expected layout, while the regular player texture cache is left untouched.

### Follow-up: pistol arm length direction

The remapped pistol-arm atlas was using the right pixels, but the pistol GLB samples the arm side strips in the opposite length direction from the vanilla Minecraft arm texture. That put the shoulder/sleeve end at the pistol grip and made it look like the upper arm/shoulder was holding the pistol. `copyArmBox()` now copies the 12 side-strip rows bottom-to-top so the wrist/hand end lands at the GLB's grip end.

## Nether terrain generator port — 2026-10-04

Replaced the custom Nether generator with the one from `literally_just_minecraft_by_SirDingus.zip` (`js/world/nether.js`). The port is self-contained in root `Nether.js` and keeps the current engine API (`NetherWorld`, `NetherGenerator.newChunk`).

What was ported:

- seeded `mulberry` RNG and Perlin/Octaves helpers from the source project,
- 5×17×5 coarse density lattice, trilinearly interpolated through each 16×128×16 chunk,
- cavernous netherrack terrain with a lava sea at Y=31,
- randomized bedrock floor/ceiling,
- soul-sand and gravel shore patches around the lava sea,
- glowstone ceiling clusters,
- wall lava springs,
- fire patches and mushrooms on netherrack.

Adaptations for this project:

- lava uses this engine's registered lava ID (`10`) instead of the source's still-lava ID (`11`), because only `10` is registered here,
- mushrooms use this project's registered mushroom IDs (`34`/`35`) instead of vanilla `39`/`40`, which are not mushrooms in this codebase,
- source nether-wart patches are omitted because this project has no registered nether-wart crop block yet,
- decoration runs during `newChunk()`, so `populateChunk()` is now a no-op for Nether chunks.

Validation: `node --check Nether.js` passes.

## Shark mob integration
- Added `EntityShark` using the provided `minecraft_shark.glb` model and its embedded `animation.model.swimming` / `animation.model.eating` clips.
- Sharks are aquatic hostile mobs: they wander in water, chase nearby swimmers, bite for 4 damage on non-peaceful difficulties, flop/dry out if stranded, and despawn on Peaceful.
- Registered sharks with the GLB entity renderer, `/summon shark`, `/give @p shark_spawn_egg`, spawn eggs (`id 527`), multiplayer mob sync, and rare natural water spawning in sufficiently deep water.
- Added a small `shark_spawn_egg.png` icon and kept the downloaded GLB at project root so the static preview can load it directly.

## Pistol reload HUD timing
- Added `minecraft.pistolMagOut` state for the pistol HUD.
- The ammo counter now displays `AMMO -/-` exactly when the magazine-out SFX trigger fires, and returns to `AMMO 6/6` when the magazine-in SFX trigger fires for both easy reload and final-shot full reload.
- The mag-out HUD state is cleared when the pistol is unequipped or when a new pistol animation starts, preventing stale `-/-` displays.

## Third-person / multiplayer pistol rendering
- Replaced the generic flat held-item rendering for pistol item `568` with a blocky 3D third-person pistol model attached to the player's hand.
- Added a pistol-specific third-person arm pose so the right arm aims forward instead of holding the pistol like a downward tool.
- The same held-item path is used by `RemotePlayerEntity`, so multiplayer players now show the pistol properly when their synced equipment reports item `568`.
- Dynamic entity lighting now preserves per-material base colors for special held models, keeping the pistol dark/metal instead of turning it into a flat white mesh.

## Third-person/multiplayer pistol GLB rig
- Replaced the temporary blocky third-person pistol fallback with cloned `pistol.glb` rigs for visible players holding item `568`.
- The third-person rig now uses the real GLB arms + pistol mesh, remaps the arm material to the holder's current skin, hides the vanilla player/armor arms while equipped, and plays the same Scene animation segments as first person (`draw`, `fire`, `inspect`, reloads, holster, idle).
- Added pistol animation event syncing over existing multiplayer position/presence packets so remote players can see fire/reload/inspect/holster animation changes even when the player is standing still.

## Reverted third-person GLB pistol arms
- Removed the cloned `pistol.glb` third-person/multiplayer arms rig because it changed the visible player model too much.
- Restored normal player/armor arms while holding the pistol; pistol item `568` is attached as a held object only, so the player model itself is not replaced or hidden.
- Removed the extra multiplayer pistol animation event sync added for the GLB overlay; normal held-item equipment sync remains.

## Soundtrack: Moog City 3
- Downloaded the user-provided MediaFire MP3 and saved it locally as `moog_city_3.mp3` so background music loads same-origin in previews/downloads.
- Added `Moog City 3` to default enabled music settings and to `SoundManager.MUSIC_TRACKS` using `/moog_city_3.mp3`.
- Settings load now merges in any new default music toggles so existing players get `Moog City 3` enabled by default unless they later disable it.

## Now Playing music toast
- Added a bottom-right `Now Playing` DOM toast that slides in diagonally from offscreen when a background music track actually starts playback.
- The toast shows the current track name (including `Moog City 3`) and slides back out automatically after a short display period.

## Now Playing toast style adjustment
- Restyled the music `Now Playing` popup to be simpler and more Minecraft-like: dark flat panel, gray border, square corners, minimal shadow, plain label text, and no blue sci-fi gradient styling.

## Spotify-style music library, uploads, and synced lyrics
- Rebuilt `GuiMusicSettings.js` into a darker Spotify-like library panel with track rows, enabled/skipped pills, current-playing highlighting, scrolling, uploaded-track counts, and a `+ Upload Song` flow.
- Added user music uploads through IndexedDB-backed storage in `SoundManager.js`; imported browser audio files are rebuilt as object URLs, shown as custom tracks, included in the random background-music pool, and removable from the music menu.
- The upload flow can generate synced `.lrc` lyrics with a Whisper-like browser transcription path (`@xenova/transformers` + `Xenova/whisper-tiny`) when the user says the song has vocals. If model loading/transcription fails, the menu offers manual `.lrc` upload as a fallback.
- Added `.lrc` parsing/current-line tracking in `SoundManager.js` and render the active lyric line in `IngameOverlay.js` at the held-item tooltip slot above the hotbar; item tooltips shift upward while lyrics are visible.
- Hardened `FontRenderer.getStringWidth()` so non-ASCII UI glyphs fall back to `?` width instead of producing `NaN` positions.

## Uploaded music playback unlock fix
- Fixed a browser audio-unlock edge case where uploaded songs could show the Now Playing toast and first lyric line even while the Web Audio context was still suspended. `SoundManager` now resumes the audio context when the sound engine is created and again before background music starts.
- Changed `currentTrackStartedAt` from a falsy `0` sentinel to `null`, so lyrics advance correctly even when the first song starts at AudioContext time `0`.
- Lyrics are hidden while the AudioContext is suspended, preventing a stale first line from appearing when audio has not actually started.

## /play command and uploaded-song playback fallback
- Added `/play <song>` to start a specific background music track by name, `/play list` to show available built-in/uploaded tracks, and `/play stop` to stop background music. Song names can include spaces, e.g. `/play Moog City 3`.
- `/play` is allowed even when cheats are disabled because it only controls local music.
- Added command autocomplete suggestions for `/play` track names.
- Uploaded/custom songs now play through an `HTMLAudioElement` fallback instead of only `THREE.AudioLoader`/WebAudio decoding. This supports more browser-playable uploaded audio formats and ties synced lyric timing to the actual media element `currentTime`, fixing uploaded songs that showed Now Playing/line one without audible playback or lyric advancement.
- Background music loading is tracked so the random music loop does not spam-start multiple tracks while a song is decoding/starting.

## Lyrics timing repair and editable uploaded lyrics
- Improved Whisper-generated `.lrc` creation by requesting word timestamps and grouping words into short readable lines. Chunk-level transcriptions are split/interpolated so one 20-30 second chunk no longer feels like frozen lyrics.
- Added lyric timeline repair when loading/parsing `.lrc`: duplicate/zero timestamps, single giant generated lines, long gaps, and oversized lines are redistributed/split so lyrics visibly advance with playback.
- Uploaded-song lyric timing now uses the actual HTML audio element `currentTime`, and `/lyrics status` reports the current song/time/line for debugging.
- Added editable uploaded lyrics: the music menu now has an `LRC` button on custom tracks to replace or clear synced lyrics after upload.
- Added `/lyrics upload <song>`, `/lyrics clear <song>`, and `/lyrics status` commands for managing uploaded song lyrics. This lets bad automatic transcriptions be replaced with a correct `.lrc` without re-uploading the song.

## Better transcription model for uploaded lyrics
- Upgraded uploaded-song transcription from `Xenova/whisper-tiny` to a higher-quality `Xenova/whisper-small` default in `SoundManager.transcribeAudioToLrc()`.
- Added automatic fallback tiers (`whisper-base`, then `whisper-tiny`) if the browser/device cannot load the stronger model, so imports still work on weaker machines.
- Kept word timestamps, `task: "transcribe"`, shorter chunks, and stride overlap for better synced `.lrc` output.
- Updated the music upload prompt to warn that Whisper Small is more accurate but downloads a much larger model the first time.

## Faster lyrics methods instead of slow transcription
- Removed AI transcription from the normal upload flow because browser Whisper models were too slow for regular use.
- Uploading a custom song now offers fast lyric methods instead: upload a synced `.lrc` file, paste plain lyrics into an in-game textarea and auto-time them across the song duration, or skip lyrics.
- The uploaded-track `LRC` button now supports replacing lyrics via `.lrc` or pasted auto-timed lyrics, and clearing existing lyrics.
- Added a multiline lyrics paste dialog (Ctrl+Enter saves) so users can paste full lyric blocks instead of using a single-line browser prompt.
- Expanded `/lyrics` with `/lyrics paste <song>` for the same instant auto-timing method, alongside `/lyrics upload`, `/lyrics clear`, and `/lyrics status`.

## Waveform fallback for music HUD
- When background music is playing but no active lyric line is available, the lyric slot above the hotbar now renders a compact animated green waveform instead of blank/stale lyric text.
- The waveform uses the current music playback time and track name to animate deterministically, and the held-item tooltip shifts upward while either lyrics or the waveform are visible.

## Real white waveform for no-lyrics music HUD
- Replaced the fake/procedural green waveform with a white waveform driven by real audio analyser data.
- `SoundManager` now attaches an `AnalyserNode` to built-in `THREE.Audio` background music and routes uploaded `HTMLAudioElement` music through a `MediaElementSource -> Analyser -> destination` chain.
- `IngameOverlay` reads `SoundManager.getMusicWaveformLevels()` and draws the actual time-domain waveform in the lyric slot whenever music is playing but no lyric line is active.

## Custom music discs, crossfades, and launcher-style music menu
- Added a tagged custom music disc item (`custom_disc`, item ID `2212`) backed by uploaded browser music.
- `/give @p custom_disc <uploaded song name>` now gives a one-off disc named for that uploaded song. The music menu also has a `DISC` row button for uploaded tracks that runs the same give flow.
- Jukeboxes now accept tagged custom discs. Inserting one plays the uploaded song through the browser's custom-track player, mutes background music while the disc plays, and ejects the same tagged disc item.
- Custom jukebox disc playback is synced best-effort over multiplayer by sending the disc tag; other clients can play it if they have the same uploaded custom track in their local browser library.
- Background music now fades in on start, fades out on stop, and selecting another track through `/play` or the music menu transitions with a short crossfade-style overlap.
- Reworked `GuiMusicSettings.js` to look closer to the provided Blockworld music screenshot: top app bar, left nav rail, upload well with file-type pills, Your songs/Default tracks tabs, compact track rows with play/LRC/DISC/delete actions, and a right Now Playing panel with progress and controls.

## Fabric-style Mods menu redesign
- Reworked `GuiMods.js` to visually match the attached Fabric Mod Menu reference: translucent in-game backdrop, centered "Mods" title, black search bar with filter button, left mod list, right detail panel with large icon/version/authors, Website/Issues buttons, links/license/credits sections, drag-and-drop hint text, and bottom Open Mods Folder/Done buttons.
- Added built-in entries for the project's core feature sets so the menu always has a populated Mod Menu-like list even before the user imports ZIP mods. Imported local ZIP mods are appended with a Local badge and can still be selected/removed.
- Added drag-and-drop `.zip` import handling directly on the Mods screen while preserving the Open Mods Folder import picker.

## Mods menu fake-entry cleanup
- Removed the synthetic built-in/fake mod entries from `GuiMods.js` so the Mods menu only lists ZIP mods the player actually imported into browser storage.
- If no mods have been imported, the list now honestly shows zero/no installed mods while preserving the drag/drop and Open Mods Folder import flow.

## Music Configuration screenshot-style redesign
- Reworked `GuiMusicSettings.js` to match the attached Music Configuration reference: centered title, large black search box, translucent world backdrop, a dark bordered scrollable category list, collapsible music categories, per-track gray "Frequency" buttons, scrollbar, and four bottom controls: Show Music Toast, Music Frequency, Reset to Default, Done.
- Preserved custom music features inside the new screenshot-style UI: uploaded song section, Upload Music row, LRC button, DISC button, delete button, click-to-play rows, and per-track frequency weights.
- Added `GameSettings.musicTrackFrequency` and `GameSettings.showMusicToast`; missing saved settings are backfilled on load.
- Updated `SoundManager.playRandomTrack()` to use per-track frequency weights and `showNowPlaying()` to respect the Show Music Toast toggle.

## Real album art for music tracks
- Added real 600x600 album artwork assets under `/album_art/`: `minecraft_volume_alpha.jpg`, `minecraft_volume_beta.jpg`, and `mojang_please_hire_me.jpg`.
- Added `album` and `albumArt` metadata to the built-in `SoundManager.MUSIC_TRACKS` entries: Volume Alpha art for the Alpha tracks, Volume Beta art for Blind Spots, and Joabi single art for Moog City 3.
- Updated the Music Configuration track list to render album-art thumbnails beside each built-in song and show the album name under the track title.
- Updated the Now Playing popup to include album art and album/subtitle text when available.

## Peer-to-peer LAN voice chat
- Added optional voice chat to `Multiplayer.js` using PeerJS WebRTC media calls on top of the existing LAN PeerJS connection. Audio is peer-to-peer and uses browser microphone permission through `navigator.mediaDevices.getUserMedia()`.
- Voice chat supports enable/disable, mute/unmute, remote audio playback through hidden `<audio>` elements, cleanup on peer disconnect/world disconnect, and relayed `voice_state` packets so hosted rooms can connect all voice-enabled peers.
- Added `/voice <on|off|mute|unmute|toggle|status>` as a non-cheat command for controlling voice chat from chat.
- Added Pause Menu controls while connected to LAN: `Voice: On/Off` and `Mute`/`Unmute` buttons.

## Voice chat converted into a bundled Server mod
- Moved the voice chat implementation into `src/js/net/minecraft/client/mods/server/VoiceChatServerMod.js` with explicit bundled mod metadata (`Voice Chat`, badge/environment `Server`).
- `Multiplayer.js` now installs the bundled Server voice-chat mod during LAN multiplayer setup instead of owning the voice implementation directly.
- The Mods menu now lists the real bundled `Voice Chat` Server mod while still avoiding fake/placeholder feature entries; imported ZIP mods continue to appear underneath as Local mods.
- `/voice status` now labels the feature as the voice chat server mod.

## Voice Chat Server mod metadata author update
- Updated the bundled `Voice Chat` Server mod author metadata to `MCWSE` for the Mods menu detail panel.

## Mods menu Enable/Disable control
- Replaced the Mods detail-panel `Website` and `Issues` buttons with a single `Enable` / `Disable` button.
- The bundled `Voice Chat` Server mod enable state is saved in localStorage and is enforced by `VoiceChatServerMod`; disabling it stops active voice chat and blocks `/voice on` until re-enabled.
- Imported ZIP mods now store an `enabled` flag in IndexedDB through `WorldStorage.setModEnabled()`, and `Minecraft.loadActiveMods()` skips disabled imported mods on reload.
- The Mods list/detail panel now displays Enabled/Disabled status so disabled mods are visibly marked.

## Mods menu disabled card styling cleanup
- Removed the explicit `Disabled` pill from disabled mod list cards.
- Disabled mods are now indicated by a greyed/desaturated row, dimmed badge text, grey title/summary text, and a grey overlay on the icon.

## Server mod join confirmation prompt
- Added `GuiServerModsPrompt.js`, a vanilla-style Yes/No prompt shown while joining a LAN world when the host advertises enabled server mods.
- Hosts now include an active `serverMods` list in the multiplayer `world_info` packet; currently this advertises the bundled `Voice Chat` Server mod only when it is enabled on the host.
- Clients pause world loading on `world_info` if server mods are present, showing: "This server has server mods enabled" and "Would you like to continue?" with Yes/No buttons.
- Choosing Yes continues loading the world; choosing No cancels the join, disconnects, and returns to the menu/world state.

## Voice Chat Server mod uploaded icon
- Added the provided microphone PNG as `src/js/net/minecraft/client/mods/server/voice_chat_icon.png`.
- Updated the bundled `Voice Chat` Server mod metadata with `iconImage` pointing to the uploaded icon.
- Updated `GuiMods.js` to render custom image icons from mod metadata with crisp pixel scaling, falling back to the procedural icon if the image is unavailable.

## Sodium Fabric optimization mod port
- Downloaded and inspected the provided `sodium-fabric-mc1.16.5-0.2.0+build.4.jar`; its Fabric metadata identifies `Sodium` version `0.2.0+build.4`, author `JellySquid`, client environment, LGPL-3.0-only license, and icon `assets/sodium/icon.png`.
- Extracted the official Sodium icon into `src/js/net/minecraft/client/mods/client/sodium_icon.png`.
- Added `src/js/net/minecraft/client/mods/client/SodiumClientMod.js`, a native MCWSE client mod that ports Sodium's optimization goals to the browser/WebGL renderer rather than attempting to run Fabric/JVM bytecode.
- Sodium now appears as a real bundled Client mod in the Mods menu with enable/disable support and the official icon/metadata.
- Installed the Sodium client mod in `Minecraft.js` and hooked `WorldRenderer.js` into the Sodium port for adaptive chunk rebuild budgets, stale offscreen rebuild-queue culling, cheaper invisible-section checks, and faster queue resorting under rebuild pressure.
- Fabric API was downloaded for reference but was not needed at runtime because MCWSE uses native JavaScript/WebGL modules instead of Fabric Loader.

## Xaero's Minimap Fabric mod port and Sodium version label
- Downloaded the provided `pp8ez4.zip`, inspected `xaerominimap-fabric-1.16.5-26.6.0.jar`, and read its Fabric metadata: `Xaero's Minimap` version `26.6.0`, author `Xaero96`, icon `assets/xaerominimap/icon.png`, and Fabric/API requirements.
- Extracted the official Xaero's Minimap icon to `src/js/net/minecraft/client/mods/client/xaerominimap_icon.png`.
- Added `src/js/net/minecraft/client/mods/client/XaerosMinimapClientMod.js`, a native MCWSE browser port with a top-right minimap, player direction arrow, coordinate readout, loaded-terrain coloring, and nearby entity dots.
- Installed the minimap client mod in `Minecraft.js` and render-hooked it through `IngameOverlay.js`.
- Added Xaero's Minimap to the real bundled Client mods list in `GuiMods.js` with enable/disable support.
- Updated Sodium's Mods menu version label from its original Fabric build string to the MCWSE game version: `MCWSE 1.07`.

## Xaero's Minimap visual/readability upgrade
- Reworked the MCWSE Xaero's Minimap port into a larger circular top-right minimap with a Minecraft-style dark frame, drop shadow, compass markers, center reticle, and player direction arrow.
- Increased map coverage to roughly a 112-block diameter around the player and added terrain relief shading, biome-tinted foliage, chunk-grid hints, and a vignette for better readability.
- Improved entity dots with separate colors for players, mobs, and dropped items, plus a coordinate/heading/biome strip under the minimap.
- Kept minimap rendering fully local/client-side and controlled by the Mods menu Enable/Disable toggle.

## Xaero's Minimap facing-direction fix
- Corrected the minimap player arrow rotation by adding the MCWSE yaw offset: yaw `0` faces +Z/south in-game, while the arrow texture points north by default. The arrow now matches the real camera/player facing direction on the north-up minimap.

## Stream setup GLB, /stream commands, monitors, and proximity mic
- Downloaded and analyzed `https://files.catbox.moe/dcw1cu.glb`; GLB metadata identifies a CC-BY-4.0 Sketchfab "PC Setup - MC Model" by RigidStudios, with multiple mesh/material parts and embedded textures. The asset was added as `assets/models/stream_setup.glb`.
- Added `src/js/net/minecraft/client/camera/StreamSetupManager.js` to place and manage stream setup props using the GLB, including persisted world serialization via the `ss` world-data field and LAN sync via `stream_setups` packets.
- `/stream setup` places the GLB setup in front of the player. The setup has functional overlay canvases: a vertical live-chat monitor and a horizontal current-stream-preview monitor.
- Added `/stream` command family: `setup`, `remove`, `clear`, `list`, `start`, `stop`, `source`, `next`, `preview`, `mic`, `chat`, and `status`, plus autocomplete and non-cheat availability.
- The vertical monitor displays MineWatch/viewer chat messages and `/stream chat` test messages. `BroadcastMedia.handleViewerChat()` now forwards viewer chat into the stream setup monitor.
- The horizontal monitor shows the current broadcast canvas while live, including LIVE/source/viewer overlay; when offline it shows standby/source instructions.
- Added browser microphone capture for the setup microphone. When a broadcast starts, `BroadcastMedia` asks `StreamSetupManager` to attach a WebAudio microphone track to the outgoing MediaStream. The mic is proximity-based: gain fades with distance from the player to the nearest enabled stream setup mic.
- Added `/stream mic on|off|radius|status` controls. Stopping the broadcast tears down the raw microphone stream/audio context.

## Stream setup model orientation and monitor-surface fix
- Fixed `/stream setup` prop orientation: the setup now uses MCWSE yaw directly instead of the broadcast-camera 180-degree offset, so the PC setup faces the player correctly when placed.
- Removed the separate custom monitor frames/planes that were floating in front of the setup.
- The dynamic stream preview and live chat canvases now sit directly on the GLB model's own monitor screen surfaces: preview on the landscape monitor and chat on the vertical monitor.


## Stream setup removal
- Removed the placed GLB stream setup prop and its setup-specific systems at user request.
- Deleted the stream setup GLB asset and removed StreamSetupManager from game startup, world saves, LAN sync, and broadcast media hooks.
- Kept the non-setup `/stream` broadcast commands: start, stop, source, next, preview, chat, and status.

## Rifle removal
- Removed the rifle GLB firearm at user request. The project no longer includes `rifle.glb`, `rifle_icon.png`, the `/give @p rifle` item, rifle HUD, rifle renderer hooks, or rifle documentation file.

## Log pile removal
- Removed the dropped-log compaction / Log Pile feature at user request. Deleted the Log Pile GLB asset and removed its dropped-item, world tick, left-click collection, render, and LAN sync hooks.

## LambDynamicLights Both mod
- Downloaded and inspected `https://files.catbox.moe/4rkgux.zip`; it contains `lambdynamiclights-fabric-1.3.4+1.16.jar` plus Fabric API. Fabric metadata: id `lambdynlights`, name `LambDynamicLights`, version `1.3.4+1.16`, author `LambdAurora`, license `MIT`, original environment `client`, description “Adds dynamic lights to the game.”
- Extracted official icon to `src/js/net/minecraft/client/mods/both/lambdynamiclights_icon.png`.
- Added native browser/MCWSE port at `src/js/net/minecraft/client/mods/both/LambDynamicLightsMod.js`; Java/Fabric bytecode is not directly loadable, so the port implements dynamic carried/dropped-item lighting in JavaScript.
- Added bundled mod metadata to the Fabric-style Mods screen with badge/environment displayed as `Both`, and an Enable/Disable toggle using storage key `mcwse_builtin_mod_enabled_lambdynamiclights`.
- The host advertises LambDynamicLights in the server-mod list when enabled, with environment `Both`, so LAN clients get the existing server-mod warning prompt.
- Dynamic lights are computed from local player held/offhand items, remote multiplayer players' synced held/offhand equipment, burning entities, and dropped luminous items. Supported sources include torch, fire, redstone torch, glowstone, jack-o'-lantern, lit redstone lamp, magma block, lava/lava bucket, and glowstone dust, plus any block/item whose MCWSE block reports a light value.
- `World.getTotalLightAt()` now consults the LambDynamicLights mod for virtual light when enabled, and the mod marks affected chunk sections for rebuild as sources move so lighting updates in singleplayer and multiplayer.

## Chat Heads client mod
- Added bundled native `Chat Heads` client mod by `dzwdz` / `MCWSE Port`, using the provided head icon at `src/js/net/minecraft/client/mods/client/chat_heads_icon.png`.
- Added mod metadata and an Enable/Disable toggle to the Fabric-style Mods menu with storage key `mcwse_builtin_mod_enabled_chat_heads`.
- `ChatOverlay` now decorates normal `<player> message` chat lines with an 8x8 Minecraft head before the username when Chat Heads is enabled.
- Heads render from the local player's selected skin or matching remote multiplayer player/presence skin when available, with the bundled icon/procedural face as a fallback. System messages and non-player/pseudo-speaker lines are left unchanged.

## World-owner `/name` command
- Added `/name <new name>` as a non-cheat command for the world owner/host.
- The command sanitizes the new name, limits it to 16 characters to match the Multiplayer username field, saves it to game settings, and updates the local player display/chat name immediately.
- Joined LAN clients cannot use `/name` to rename the host; they receive an owner-only error. Client-side dispatch was added so approved client command use cannot accidentally rename the host.
- When the owner renames while hosting, presence is pushed immediately so remote player labels/chat-head skin lookup use the new name, and other players receive a rename notice.
- Singleplayer chat now respects the saved `/name` value instead of always forcing the Websim username.

## Multiplayer bug audit/fixes
- Audited LAN chat, relay, world-diff, item-sync, jukebox, and saved-player-data paths after the recent Chat Heads/dynamic lights/name changes.
- Fixed multiplayer chat so the sender now sees their own LAN chat line locally; `/say` and `/me` now broadcast raw server/action lines instead of becoming `<player> [Server] ...` or duplicating locally.
- Fixed host relay for peer-authored realtime effects that previously stopped at the host: arm swings, block break progress, block-break particle bursts, jukebox play/stop, and mob aggro events now forward to the rest of the LAN.
- Removed the early host relay for client block batches; the host now forwards only authoritative post-processed block states, reducing stale/double block updates. Remote block processing is marked so it does not loop back into another local broadcast.
- Fixed authoritative diff updates for host-processed remote block changes, including One Block replacements, so late joiners receive the final server state instead of stale air.
- Fixed dropped-item sync to include damage and item tags, preserving enchanted/custom items and uploaded custom music-disc tags across LAN item sync.
- Fixed client player-data saves to preserve inventory tags, armour tags, and offhand contents across disconnect/rejoin.
- Guarded presence handling when a presence packet arrives before a world is loaded, and ensured saved-server/per-world join names are applied to the local player after multiplayer world load.
- Fixed remote jukebox stop handling so replayed stop packets do not bounce back to the host and create duplicate stop/drop traffic.

## Multiplayer hit-flash tint fix
- Fixed remote multiplayer players staying permanently red after being hit. `RemotePlayerEntity` overrides `onLivingUpdate()` to avoid local physics, but that also skipped the inherited `hurtTime` countdown used by the renderer for the red damage flash.
- Remote players now tick down `hurtTime` without running local movement physics, so the red tint fades normally after hits.

## Mimicer Forge mod native port
- Downloaded `https://www.mediafire.com/file/rsl6hcpz7ikej2f/spider+mimicer.jar/file` to `/home/user/source_jars/spider_mimicer.jar` and inspected it with `unzip`.
- Jar metadata: Forge `mods.toml`, mod id `mimicer`, display name `mimicer`, version `1.7.0`, author `Cadentem`, license `MIT`, description `Fork of the Mimicer mod`, side/dependency context `BOTH`.
- Extracted bundled Mimicer assets into the project: textures, GeckoLib geometry/animation JSON reference, and OGG sounds under `assets/mimicer/`.
- Added built-in Both mod metadata/toggle at `src/js/net/minecraft/client/mods/both/MimicerBothMod.js`; it registers the Mimicer sound groups and displays in the Mods menu with the extracted texture-derived icon.
- Added native `EntityMimicer` and `MimicerRenderer` because Forge/GeckoLib Java bytecode cannot run directly in the browser. The renderer loads the copied Bedrock/GeckoLib geometry JSON when available, with a procedural fallback, and the native entity includes cave-stalking behaviour, player-looking detection, spotted/flee/chase states, attacks, sounds, death drops, peaceful despawn, and rare dark cave natural spawning when the mod is enabled.
- Registered Mimicer with rendering, commands (`/summon mimicer` and `/summon the_mimicer`), multiplayer mob sync/class maps, spawn egg item id `528`, `/give @p mimicer_spawn_egg`, and the root resource manifest/startup preload.
- Added Mimicer to underground One Block mob pools and Bane of Arthropods bonus damage.

## Real Minecraft server option in Add Server
- Updated the Experimental Add/Edit Server popup to ask: "Is this a real Minecraft server?" with two choices: **No, LAN Code** and **Yes, Real Server**.
- LAN-code entries continue to use the existing PeerJS/MCWSE multiplayer flow.
- Real-server entries store a Java server address such as `example.org:25565`, are shown as **Real** server cards, and join through a native port of the LabyStudio/js-minecraft protocol bridge.
- Imported the LabyStudio/js-minecraft network stack under `src/js/net/minecraft/client/network/` plus required NBT/packet utility classes and browser crypto/compression libraries. Preserved the upstream license in `THIRD_PARTY_LABYSTUDIO_JS_MINECRAFT_LICENSE.txt`.
- Added `GuiRealServerConnecting`, `GuiDisconnected`, `WorldClient`, chunk packet filling, protocol constants, an offline session/profile shim, real-server chat/command forwarding, and a real-server tick path for keepalive/movement packets.
- Real server support targets the LabyStudio bridge's Minecraft Java 1.8 protocol (`PROTOCOL_VERSION = 47`) through `wss://socket.labystudio.de/minecraft/`; LAN worlds remain unchanged.

## Deploy 7.6 notice and zip rename
- Replaced the startup `GuiNotice` patch notes with a short Deploy 7.6 summary covering the major world/multiplayer, native mod/mob, music/interface, real-server, and fix work.
- Renamed the deliverable zip to `Deploy-7-6.zip`.
