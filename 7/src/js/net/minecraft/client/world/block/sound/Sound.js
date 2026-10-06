export default class Sound {

    constructor(name, pitch) {
        this.name = name;
        this.pitch = pitch;
    }

    getBreakSound() {
        // Map specific materials to break sets, fallback to step if not defined
        const breakSet = ["wood", "stone", "gravel", "grass", "granite", "diorite", "andesite"].includes(this.name);
        
        // Handle specific material re-mapping
        let targetName = this.name;
        if (targetName === "granite" || targetName === "diorite" || targetName === "andesite") {
            // If break.material doesn't exist, we fallback to the specific step or stone
            return "break.stone"; 
        }

        return (breakSet ? "break." : "step.") + targetName;
    }

    getStepSound() {
        return "step." + this.name;
    }

    getPitch() {
        return this.pitch;
    }

}