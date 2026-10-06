/**
 * Captures the player's current point of view as a small JPEG data URL, for
 * use as a world thumbnail in the world-management list.
 *
 * This works because WorldRenderer creates its WebGLRenderer with
 * `preserveDrawingBuffer: true`, so the colour buffer survives past the end
 * of a frame and can be read back at any time. Without that flag the capture
 * would come back blank unless taken mid-frame.
 *
 * Kept deliberately small and lossy: thumbnails live inside the world record
 * in IndexedDB, and a full-size PNG would add megabytes to every save.
 */

export const THUMB_W = 160;
export const THUMB_H = 90;
const QUALITY = 0.6;

/**
 * @param minecraft the client, for its GameWindow canvas
 * @returns a data: URL, or null if nothing could be captured
 */
export function captureThumbnail(minecraft) {
    try {
        const src = minecraft && minecraft.window && minecraft.window.canvas;
        if (!src || !src.width || !src.height) return null;

        const out = document.createElement("canvas");
        out.width = THUMB_W;
        out.height = THUMB_H;
        const ctx = out.getContext("2d");
        if (!ctx) return null;

        // Cover-fit: crop the long axis rather than squashing the view.
        const srcAspect = src.width / src.height;
        const dstAspect = THUMB_W / THUMB_H;
        let sx = 0, sy = 0, sw = src.width, sh = src.height;
        if (srcAspect > dstAspect) {
            sw = Math.round(src.height * dstAspect);
            sx = Math.round((src.width - sw) / 2);
        } else if (srcAspect < dstAspect) {
            sh = Math.round(src.width / dstAspect);
            sy = Math.round((src.height - sh) / 2);
        }

        ctx.drawImage(src, sx, sy, sw, sh, 0, 0, THUMB_W, THUMB_H);

        const url = out.toDataURL("image/jpeg", QUALITY);
        // A buffer that was never drawn reads back as a uniform transparent
        // frame, which encodes to a suspiciously tiny string. Treat that as
        // "nothing to capture" rather than storing a blank tile.
        if (!url || url.length < 512) return null;
        return url;
    } catch (e) {
        console.warn("Could not capture world thumbnail:", e);
        return null;
    }
}
