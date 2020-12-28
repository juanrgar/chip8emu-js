class Keyboard {
    constructor() {
        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
	window.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    isKeyPressed(keyCode) {
        return false;
    }

    onKeyDown(event) {
    }

    onKeyUp(event) {
    }
}

export default Keyboard;
