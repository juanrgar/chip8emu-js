class Keyboard {
    constructor() {
        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
	window.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    isKeyPressed(keyCode) {
    }

    onKeyDown(event) {
    }

    onKeyUp(event) {
    }
}

export default Keyboard;
