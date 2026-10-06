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

## Running it

```bash
python3 /home/user/serve.py     # serves /home/user/project on 0.0.0.0:8080
```

A plain static server is all it needs, but it must send `text/javascript` for `.js`
(ES modules are rejected otherwise) — the bundled script sets that plus `no-store`, which
matters because `sw.js` will otherwise cache aggressively while you're editing.

The service worker is the usual dev trap here: hard-reload, or unregister it in
DevTools → Application, if a change doesn't show up.
