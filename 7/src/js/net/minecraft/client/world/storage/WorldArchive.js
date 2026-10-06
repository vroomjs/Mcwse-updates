import JSZip from "jszip";

/*
 * Portable world archive format. It intentionally resembles a Minecraft Java
 * world while keeping chunk payloads JSON, because this engine does not use
 * Anvil's binary NBT/.mca format.
 */

function safeName(value) {
    return String(value || "world").replace(/[^\w\-. ]+/g, "_").trim() || "world";
}

function dataUrlToBlob(dataUrl) {
    const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.*)$/);
    if (!match) return null;
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: match[1] });
}

export default class WorldArchive {
    static async exportZip(worldData, fileName) {
        const zip = new JSZip();
        const root = safeName(worldData.n);
        const folder = zip.folder(root);
        const chunks = worldData.c || {};
        const level = { ...worldData, c: undefined };
        delete level.c;
        delete level.id;

        folder.file("level.dat", JSON.stringify(level, null, 2));
        folder.file("level.dat_old", JSON.stringify(level, null, 2));
        folder.file("session.lock", String(Date.now()));
        folder.file("manifest.json", JSON.stringify({ format: "minecraft-websim-world", version: 1 }, null, 2));
        folder.file("datapacks/.keep", "");
        folder.file("players/advancements/.keep", "");
        folder.file("players/stats/.keep", "");
        folder.file("dimensions/the_nether/region/.keep", "");
        folder.file("dimensions/the_end/region/.keep", "");
        folder.file("dimensions/overworld/entities/.keep", "");
        folder.file("dimensions/overworld/poi/.keep", "");

        // The engine's compressed chunk representation is preserved one record
        // per file. This gives backups a real folder layout without claiming
        // to be binary Anvil .mca data.
        for (const [key, chunk] of Object.entries(chunks)) {
            const [x, z] = key.split(",");
            folder.file(`dimensions/overworld/region/r.${x}.${z}.json`, JSON.stringify(chunk));
        }

        if (worldData.pl) folder.file("players/data/local.json", JSON.stringify(worldData.pl, null, 2));
        if (worldData.pd) {
            for (const [username, player] of Object.entries(worldData.pd)) {
                folder.file(`players/data/${safeName(username)}.json`, JSON.stringify(player, null, 2));
            }
        }
        if (worldData.stats) folder.file("players/stats/world.json", JSON.stringify(worldData.stats, null, 2));
        if (worldData.thumb) {
            const icon = dataUrlToBlob(worldData.thumb);
            if (icon) folder.file("icon.png", icon);
        }

        const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || `${root}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    static async importFile(file) {
        const isZip = file.name?.toLowerCase().endsWith(".zip") || file.type === "application/zip";
        if (!isZip) return JSON.parse(await file.text());

        const zip = await JSZip.loadAsync(file);
        const names = Object.keys(zip.files).filter(name => !zip.files[name].dir);
        const levelName = names.find(name => /(?:^|\/)level\.dat$/i.test(name));
        if (!levelName) throw new Error("Archive does not contain level.dat");
        const data = JSON.parse(await zip.file(levelName).async("string"));
        data.c = {};

        const regionPrefix = levelName.slice(0, levelName.lastIndexOf("/") + 1) + "dimensions/overworld/region/";
        for (const name of names.filter(n => n.startsWith(regionPrefix) && /\/r\.-?\d+\.-?\d+\.json$/i.test(n))) {
            const match = name.match(/\/r\.(-?\d+)\.(-?\d+)\.json$/i);
            if (match) data.c[`${match[1]},${match[2]}`] = JSON.parse(await zip.file(name).async("string"));
        }

        const localName = names.find(name => name === levelName.slice(0, levelName.lastIndexOf("/") + 1) + "players/data/local.json");
        if (localName) data.pl = JSON.parse(await zip.file(localName).async("string"));
        data.pd = data.pd || {};
        const playerPrefix = levelName.slice(0, levelName.lastIndexOf("/") + 1) + "players/data/";
        for (const name of names.filter(n => n.startsWith(playerPrefix) && n.endsWith(".json") && !n.endsWith("local.json"))) {
            const username = name.slice(playerPrefix.length, -5);
            data.pd[username] = JSON.parse(await zip.file(name).async("string"));
        }
        return data;
    }
}
