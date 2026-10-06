/**
 * Turns a PeerJS failure into something a player can act on.
 *
 * Deliberately dependency-free and separate from RemoteWorlds: that module
 * imports peerjs, and the GUI screens that need this message must stay
 * importable without dragging a WebRTC stack in behind them.
 */
export function describeJoinError(error) {
    switch (error && error.type) {
        case "peer-unavailable": return "nobody is hosting that code right now";
        case "network":
        case "socket-error":
        case "socket-closed":
        case "server-error":    return "the connection service is unreachable";
        case "unavailable-id":  return "that code is already in use";
        case "browser-incompatible": return "this browser cannot do peer-to-peer";
        case "webrtc":          return "the peer-to-peer connection failed";
        default: break;
    }
    const msg = error && (error.message || String(error));
    return msg ? String(msg).slice(0, 80) : "unknown error";
}
