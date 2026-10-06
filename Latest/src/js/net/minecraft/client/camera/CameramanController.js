import Keyboard from "../../util/Keyboard.js";

export default class CameramanController {
    constructor(minecraft) { this.minecraft = minecraft; this.speed = 0.18; this.velocity = {x:0,y:0,z:0}; }
    setSpeed(v) { this.speed = Math.max(0.03, Math.min(1.5, Number(v) || 0.18)); }
    update(player) {
        if (!player || !player.isCameraman || player.cameraMode !== "freecam") return false;
        const s = this.minecraft.settings;
        let forward = (Keyboard.isKeyDown(s.forward)?1:0) - (Keyboard.isKeyDown(s.back)?1:0);
        let strafe = (Keyboard.isKeyDown(s.left)?1:0) - (Keyboard.isKeyDown(s.right)?1:0);
        let vertical = (Keyboard.isKeyDown(s.jump)?1:0) - (Keyboard.isKeyDown(s.crouching)?1:0);
        const yaw = (player.rotationYaw + 180) * Math.PI / 180;
        const target = {
            x: (strafe * Math.cos(yaw) - forward * Math.sin(yaw)) * this.speed,
            y: vertical * this.speed,
            z: (forward * Math.cos(yaw) + strafe * Math.sin(yaw)) * this.speed
        };
        const accel = 0.22;
        this.velocity.x += (target.x-this.velocity.x)*accel;
        this.velocity.y += (target.y-this.velocity.y)*accel;
        this.velocity.z += (target.z-this.velocity.z)*accel;
        if (!forward && !strafe) { this.velocity.x*=0.86; this.velocity.z*=0.86; }
        if (!vertical) this.velocity.y*=0.86;
        player.prevX=player.x; player.prevY=player.y; player.prevZ=player.z;
        player.x+=this.velocity.x; player.y+=this.velocity.y; player.z+=this.velocity.z;
        player.setPosition(player.x, player.y, player.z);
        player.motionX=this.velocity.x; player.motionY=this.velocity.y; player.motionZ=this.velocity.z;
        player.onGround=false; player.flying=true; player.sneaking=false;
        return true;
    }
}
