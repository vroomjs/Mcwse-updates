export default class BroadcastSession {
    constructor() { this.active = false; this.sourceId = "player:local"; }
    start(sourceId = this.sourceId) { this.sourceId = sourceId; this.active = true; }
    stop() { this.active = false; }
    select(sourceId) { this.sourceId = sourceId; }
    toJSON() { return { active: this.active, sourceId: this.sourceId }; }
}
