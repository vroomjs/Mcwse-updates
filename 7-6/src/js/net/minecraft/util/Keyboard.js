export default class Keyboard {

    static state = {};

    static create() {
        window.addEventListener('keydown', function (event) {
            Keyboard.state[event.code] = true;
        });
        window.addEventListener('keyup', function (event) {
            event.preventDefault();
            delete Keyboard.state[event.code];
        });
    };

    static releaseKey(key) {
        delete Keyboard.state[key];
    }

    static setState(key, state) {
        if (state) {
            Keyboard.state[key] = state;
        } else {
            delete Keyboard.state[key];
        }
    }

    static unPressAll() {
        Keyboard.state = {};
    }

    static isKeyDown(key) {
        return Keyboard.state[key];
    }

}