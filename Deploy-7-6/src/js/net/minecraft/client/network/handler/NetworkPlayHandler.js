import PacketHandler from "./PacketHandler.js";
import GuiDisconnected from "../../gui/screens/GuiDisconnected.js";
import WorldClient from "../../world/WorldClient.js";
import ClientKeepAlivePacket from "../packet/play/client/ClientKeepAlivePacket.js";
import ClientPlayerMovementPacket from "../packet/play/client/ClientPlayerMovementPacket.js";
import ClientPlayerPositionPacket from "../packet/play/client/ClientPlayerPositionPacket.js";
import ClientPlayerPositionRotationPacket from "../packet/play/client/ClientPlayerPositionRotationPacket.js";
import ClientPlayerRotationPacket from "../packet/play/client/ClientPlayerRotationPacket.js";
import ClientChatPacket from "../packet/play/client/ClientChatPacket.js";
import ClientConfirmTransactionPacket from "../packet/play/client/ClientConfirmTransactionPacket.js";
import ServerAnimationPacket from "../packet/play/server/ServerAnimationPacket.js";
import RemotePlayerEntity from "../../entity/RemotePlayerEntity.js";

export default class NetworkPlayHandler extends PacketHandler {

    constructor(networkManager, profile) {
        super();
        this.minecraft = networkManager.minecraft;
        this.networkManager = networkManager;
        this.profile = profile;
        this.playerInfoMap = new Map();
        this.spawnedEntities = new Map();
        this.positionUpdateTicks = 0;
        this.lastReportedX = 0;
        this.lastReportedY = 0;
        this.lastReportedZ = 0;
        this.lastReportedYaw = 0;
        this.lastReportedPitch = 0;
        networkManager.playHandler = this;
        this.minecraft.realServerConnection = networkManager;
    }

    handleKeepAlive(packet) {
        this.networkManager.sendPacket(new ClientKeepAlivePacket(packet.getId()));
    }

    handleJoinGame(packet) {
        const world = new WorldClient(this.minecraft, this.networkManager.address || "Real Server");
        world.realServerAddress = this.networkManager.address;
        world.realServerPort = this.networkManager.port;
        this.minecraft.loadWorld(world, "Joining real server...");
        if (this.minecraft.player) {
            this.minecraft.player.id = packet.entityId;
            this.minecraft.player.serverID = packet.entityId;
            this.minecraft.player.username = this.profile?.getUsername?.() || this.minecraft.settings?.username || "Player";
        }
        this.minecraft.systemDialogs?.show?.(`Connected to ${this.networkManager.address}:${this.networkManager.port}`, { duration: 3500 });
    }

    handleServerChat(packet) {
        if (packet.getType && packet.getType() === 2) return;
        const message = packet.getMessage ? packet.getMessage() : "";
        if (message && typeof this.minecraft.addMessageToChat === "function") {
            this.minecraft.addMessageToChat(message);
        } else if (message && this.minecraft.ingameOverlay?.chatOverlay) {
            this.minecraft.ingameOverlay.chatOverlay.addMessage(message);
        }
    }

    handleServerPlayerListEntry(packet) {
        for (let entry of packet.getPlayers()) {
            const uuid = entry.profile?.getId?.()?.toString?.() || String(entry.profile?.uuid || "");
            if (!uuid) continue;
            if (packet.getAction() === 4) {
                this.playerInfoMap.delete(uuid);
            } else {
                if (packet.getAction() === 0) this.playerInfoMap.set(uuid, entry);
                const current = this.playerInfoMap.get(uuid);
                if (!current) continue;
                if (entry.gameType !== undefined) current.gameType = entry.gameType;
                if (entry.ping !== undefined) current.ping = entry.ping;
                if (entry.displayName !== undefined) current.displayName = entry.displayName;
            }
        }
        this.minecraft.ingameOverlay?.playerListOverlay?.setDirty?.();
    }

    handleServerPlayerListData(packet) {
        this.minecraft.ingameOverlay?.playerListOverlay?.setHeader?.(packet.getHeader());
        this.minecraft.ingameOverlay?.playerListOverlay?.setFooter?.(packet.getFooter());
    }

    handleServerPlayerPositionRotation(packet) {
        const player = this.minecraft.player;
        if (!player) return;
        let x = packet.getX();
        let y = packet.getY();
        let z = packet.getZ();
        let yaw = packet.getYaw();
        let pitch = packet.getPitch();

        if (packet.hasFlag(0x01)) x += player.x; else player.motionX = 0;
        if (packet.hasFlag(0x02)) y += player.y; else player.motionY = 0;
        if (packet.hasFlag(0x04)) z += player.z; else player.motionZ = 0;
        if (packet.hasFlag(0x08)) yaw += player.rotationYaw;
        if (packet.hasFlag(0x10)) pitch += player.rotationPitch;

        player.setPositionAndRotation(x, y, z, yaw, pitch);
        this.markWorldEntered();
        this.networkManager.sendPacket(new ClientPlayerPositionRotationPacket(true, player.x, player.boundingBox?.minY ?? player.y, player.z, player.rotationYaw, player.rotationPitch));
    }

    profileName(uuid) {
        const info = this.playerInfoMap.get(String(uuid || ""));
        return info?.profile?.getUsername?.() || info?.displayName || "Player";
    }

    handleServerSpawnPlayer(packet) {
        const world = this.minecraft.world;
        if (!world) return;
        const entity = new RemotePlayerEntity(this.minecraft, world, null);
        entity.id = packet.getEntityId();
        entity.serverID = entity.id;
        entity.serverPositionX = packet.getX();
        entity.serverPositionY = packet.getY();
        entity.serverPositionZ = packet.getZ();
        entity.username = this.profileName(packet.getUUID?.() || packet.uuid);
        const x = entity.serverPositionX / 32;
        const y = entity.serverPositionY / 32;
        const z = entity.serverPositionZ / 32;
        const yaw = packet.getYaw() * 360 / 256;
        const pitch = packet.getPitch() * 360 / 256;
        entity.setPosition(x, y, z);
        entity.setRotation(yaw, pitch);
        entity.targetX = x; entity.targetY = y; entity.targetZ = z;
        entity.targetYaw = yaw; entity.targetPitch = pitch;
        this.spawnedEntities.set(entity.id, entity);
        world.addEntity(entity);
    }

    moveEntity(packet) {
        const entity = this.minecraft.world?.getEntityById(packet.getEntityId());
        if (!entity) return;
        entity.serverPositionX = (entity.serverPositionX || Math.floor(entity.x * 32)) + (packet.getX ? packet.getX() : 0);
        entity.serverPositionY = (entity.serverPositionY || Math.floor(entity.y * 32)) + (packet.getY ? packet.getY() : 0);
        entity.serverPositionZ = (entity.serverPositionZ || Math.floor(entity.z * 32)) + (packet.getZ ? packet.getZ() : 0);
        const x = entity.serverPositionX / 32;
        const y = entity.serverPositionY / 32;
        const z = entity.serverPositionZ / 32;
        const yaw = packet.rotation ? packet.getYaw() * 360 / 256 : entity.rotationYaw;
        const pitch = packet.rotation ? packet.getPitch() * 360 / 256 : entity.rotationPitch;
        entity.targetX = x; entity.targetY = y; entity.targetZ = z;
        entity.targetYaw = yaw; entity.targetPitch = pitch;
        if (typeof entity.setTargetPositionAndRotation === "function") entity.setTargetPositionAndRotation(x, y, z, yaw, pitch, 3);
        entity.onGround = packet.isOnGround?.() ?? entity.onGround;
    }

    handleEntityMovement(packet) { this.moveEntity(packet); }
    handleEntityTeleport(packet) {
        const entity = this.minecraft.world?.getEntityById(packet.getEntityId());
        if (!entity) return;
        entity.serverPositionX = packet.getX();
        entity.serverPositionY = packet.getY();
        entity.serverPositionZ = packet.getZ();
        const x = entity.serverPositionX / 32;
        const y = entity.serverPositionY / 32;
        const z = entity.serverPositionZ / 32;
        const yaw = packet.getYaw() * 360 / 256;
        const pitch = packet.getPitch() * 360 / 256;
        if (typeof entity.setPositionAndRotation === "function") entity.setPositionAndRotation(x, y, z, yaw, pitch);
        else { entity.setPosition(x, y, z); entity.setRotation(yaw, pitch); }
        entity.targetX = x; entity.targetY = y; entity.targetZ = z;
        entity.targetYaw = yaw; entity.targetPitch = pitch;
        entity.onGround = packet.isOnGround?.() ?? entity.onGround;
    }

    handleEntityMetadata(packet) {
        const entity = this.minecraft.world?.getEntityById(packet.getEntityId());
        entity?.updateMetaData?.(packet.getMetaData());
    }

    handleEntityHeadLook(packet) {
        const entity = this.minecraft.world?.getEntityById(packet.getEntityId());
        if (entity) entity.rotationYawHead = packet.getHeadYaw() * 360 / 256;
    }

    handleAnimation(packet) {
        const entity = this.minecraft.world?.getEntityById(packet.getEntityId());
        if (!entity) return;
        if (packet.getAnimation() === ServerAnimationPacket.SWING_ARM) entity.swingArm?.();
    }

    handleDestroyEntities(packet) {
        const world = this.minecraft.world;
        if (!world) return;
        for (let entityId of packet.getEntityIds()) world.removeEntityById(entityId);
    }

    handleConfirmTransaction(packet) {
        if (!packet.isAccepted()) this.networkManager.sendPacket(new ClientConfirmTransactionPacket(packet.getWindowId(), packet.getActionId(), true));
    }

    handleChunkData(packet) {
        const world = this.minecraft.world;
        if (!world) return;
        if (packet.isFullChunk && packet.isFullChunk() && packet.getMask && packet.getMask() === 0) {
            world.unloadChunk?.(packet.getX(), packet.getZ());
            return;
        }
        const chunk = world.getChunkAt(packet.getX(), packet.getZ());
        chunk.fillChunk(packet.getData(), packet.getMask(), packet.isFullChunk());
        this.markWorldEntered();
    }

    handleMultiChunkData(packet) {
        for (let chunkData of packet.getChunkData()) this.handleChunkData(chunkData);
    }

    handleBlockChange(packet) {
        const world = this.minecraft.world;
        if (!world) return;
        const position = packet.getBlockPosition();
        const blockState = packet.getBlockState();
        const typeId = blockState >> 4;
        world.setBlockAt(position.getX(), position.getY(), position.getZ(), typeId, blockState & 0xF);
    }

    handleDisconnect(packet) {
        this.disconnect(packet.getReason?.() || "Disconnected from server");
    }

    onDisconnect() {
        this.disconnect("Disconnected from server");
    }

    disconnect(reason) {
        if (this._disconnecting) return;
        this._disconnecting = true;
        const mc = this.minecraft;
        if (mc.realServerConnection === this.networkManager) mc.realServerConnection = null;
        mc.loadWorld(null);
        mc.displayScreen(new GuiDisconnected(reason));
    }

    markWorldEntered() {
        if (this.minecraft.loadingScreen) {
            this.minecraft.loadingScreen = null;
            this.minecraft.displayScreen(null);
        }
    }

    sendPacket(packet) { this.networkManager.sendPacket(packet); }
    sendChatMessage(message) { this.networkManager.sendPacket(new ClientChatPacket(message)); }
    getNetworkManager() { return this.networkManager; }
    getPlayerInfoMap() { return this.playerInfoMap; }

    onTick() {
        const player = this.minecraft.player;
        if (!player || !this.networkManager?.isConnected?.()) return;
        const dx = player.x - this.lastReportedX;
        const dy = player.y - this.lastReportedY;
        const dz = player.z - this.lastReportedZ;
        const dyaw = player.rotationYaw - this.lastReportedYaw;
        const dpitch = player.rotationPitch - this.lastReportedPitch;
        const reportPosition = dx * dx + dy * dy + dz * dz > 9.0E-4 || this.positionUpdateTicks >= 20;
        const reportRotation = dyaw !== 0 || dpitch !== 0;
        if (reportPosition && reportRotation) this.networkManager.sendPacket(new ClientPlayerPositionRotationPacket(player.onGround, player.x, player.y, player.z, player.rotationYaw, player.rotationPitch));
        else if (reportPosition) this.networkManager.sendPacket(new ClientPlayerPositionPacket(player.onGround, player.x, player.y, player.z));
        else if (reportRotation) this.networkManager.sendPacket(new ClientPlayerRotationPacket(player.onGround, player.rotationYaw, player.rotationPitch));
        else this.networkManager.sendPacket(new ClientPlayerMovementPacket(player.onGround));
        this.positionUpdateTicks++;
        if (reportPosition) {
            this.lastReportedX = player.x; this.lastReportedY = player.y; this.lastReportedZ = player.z;
            this.positionUpdateTicks = 0;
        }
        if (reportRotation) {
            this.lastReportedYaw = player.rotationYaw; this.lastReportedPitch = player.rotationPitch;
        }
    }
}
