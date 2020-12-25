class Keyboard {
    constructor() {
        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
	window.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    isKeyPressed(keyCode) {
    }

    onKeyDown(event) {
        console.log(event);
        console.log(event.which);
    }

    onKeyUp(event) {
    }
}

export default Keyboard;
