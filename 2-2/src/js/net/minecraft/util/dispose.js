export function disposeGroup(group, disposeTextures = true) {
    while (group.children.length > 0) {
        const child = group.children[0];
        disposeObject(child, disposeTextures);
        group.remove(child);
    }
}

export function disposeObject(obj, disposeTextures = true) {
    if (obj.geometry) {
        obj.geometry.dispose();
    }
    if (obj.material) {
        if (disposeTextures && obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
    }
    if (obj.children) {
        for (let i = obj.children.length - 1; i >= 0; i--) {
            disposeObject(obj.children[i], disposeTextures);
        }
    }
}
