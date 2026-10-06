import CameraSource from "./CameraSource.js";
export default class StaticCamera extends CameraSource {
    constructor(data = {}) { super({...data, type: "static"}); }
}
