import PlayerEntity from "./PlayerEntity.js";
import ClientPlayerMovementPacket from "../network/packet/play/client/ClientPlayerMovementPacket.js";
import ClientPlayerRotationPacket from "../network/packet/play/client/ClientPlayerRotationPacket.js";
import ClientPlayerPositionPacket from "../network/packet/play/client/ClientPlayerPositionPacket.js";
import ClientPlayerPositionRotationPacket from "../network/packet/play/client/ClientPlayerPositionRotationPacket.js";
import ClientSwingArmPacket from "../network/packet/play/client/ClientSwingArmPacket.js";

export default class PlayerEntityMultiplayer extends PlayerEntity {
    constructor(minecraft, world, networkHandler, id) {
        super(minecraft, world);
        this.id = id;
        this.serverID = id;
        this.networkHandler = networkHandler;
    }

    swingArm(hand = 'main') {
        super.swingArm(hand);
        this.networkHandler?.sendPacket?.(new ClientSwingArmPacket());
    }

    sendPosition() {
        const nh = this.networkHandler;
        if (!nh) return;
        nh.sendPacket(new ClientPlayerPositionRotationPacket(this.onGround, this.x, this.y, this.z, this.rotationYaw, this.rotationPitch));
    }
}
