# Pistol GLB integration

The supplied `pistol.glb` is now included and rendered as a first-person item.

## Get it in game

Use the command:

```text
/give @p pistol
```

The item ID is `568`; the existing crossbow icon is used as its inventory icon so it remains visible in the vanilla-style item UI.

## Animation mapping

The source contains one clip named `Scene`. The integration plays the requested time ranges from that clip:

- Draw: 0.00–1.61
- Idle: 1.43–1.43 (static idle pose)
- Inspect: 1.64–7.42
- Fire: 7.44–8.26
- Easy_reload: 8.29–11.20
- Final_shot_and_full_reload: 11.26–16.12
- Holster: 16.29–16.80

Controls while holding the pistol:

- Left click: Draw
- Right click: Fire
- `R`: Easy reload while ammo remains; full reload when empty
- `I`: Inspect
- `G`: Easy reload
- `H`: Holster

The model is loaded asynchronously from `pistol.glb`, converted to a bright, double-sided first-person material, and driven through Three.js `AnimationMixer`.
