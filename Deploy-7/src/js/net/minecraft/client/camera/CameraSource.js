export default class CameraSource {
    constructor(data = {}) {
        this.id = String(data.id || CameraSource.createId());
        this.name = String(data.name || "Camera");
        this.type = data.type || "static";
        this.position = { x: Number(data.position?.x || 0), y: Number(data.position?.y || 0), z: Number(data.position?.z || 0) };
        this.yaw = Number(data.yaw || 0);
        this.pitch = Number(data.pitch || 0);
        this.roll = Number(data.roll || 0);
        this.fov = Math.max(20, Math.min(120, Number(data.fov || 70)));
        this.online = data.online !== false;
        this.switchBackOnRender = !!data.switchBackOnRender;
        this.dimension = Number(data.dimension || 0);
        this.target = data.target || null;
        this.settings = {...(data.settings || {})};
        this.priority = Number(data.priority || 0);
        this.broadcastState = data.broadcastState || "offline";
    }

    static createId() {
        return globalThis.crypto?.randomUUID?.() || `camera-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    }

    update(data = {}) {
        if (data.name !== undefined) this.name = String(data.name);
        if (data.type !== undefined) this.type = String(data.type);
        if (data.position) Object.assign(this.position, data.position);
        for (const key of ["yaw", "pitch", "roll", "dimension"]) if (data[key] !== undefined) this[key] = Number(data[key]);
        if (data.fov !== undefined) this.fov = Math.max(20, Math.min(120, Number(data.fov)));
        if (data.online !== undefined) this.online = !!data.online;
        if (data.switchBackOnRender !== undefined) this.switchBackOnRender = !!data.switchBackOnRender;
        if (data.target !== undefined) this.target = data.target;
        if (data.settings !== undefined) this.settings = {...this.settings,...data.settings};
        if (data.priority !== undefined) this.priority = Number(data.priority);
        return this;
    }

    toJSON() {
        return { id: this.id, name: this.name, type: this.type, position: {...this.position}, yaw: this.yaw, pitch: this.pitch, roll: this.roll, fov: this.fov, online: this.online, switchBackOnRender: this.switchBackOnRender, dimension: this.dimension, target: this.target, settings: {...this.settings}, priority: this.priority };
    }
}
