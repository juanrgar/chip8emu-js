/**
 * This file is part of chip8emu-js.
 *
 * Copyright (C) 2020 Juan R. García Blanco <juanrgar@gmail.com>
 *
 * chip8emu-js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * chip8emu-js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with chip8emu-js.  If not, see <https://www.gnu.org/licenses/>.
 */

class Keyboard {
    constructor() {
        this.keyMap = {
            49: 0x1, // 1
            50: 0x2, // 2
            51: 0x3, // 3
            52: 0xc, // 4
            81: 0x4, // Q
            87: 0x5, // W
            69: 0x6, // E
            82: 0xD, // R
            65: 0x7, // A
            83: 0x8, // S
            68: 0x9, // D
            70: 0xE, // F
            90: 0xA, // Z
            88: 0x0, // X
            67: 0xB, // C
            86: 0xF  // V
        };

        this.keysPressed = new Map();

        this.onNextKeyPress = null;

        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
	window.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    isKeyPressed(keyCode) {
        return !!this.keysPressed[keyCode];
    }

    onKeyDown(event) {
        let key = this.keyMap[event.which];
        if (key) {
            this.keysPressed[key] = true;

            if (this.onNextKeyPress !== null) {
                this.onNextKeyPress(parseInt(key));
                this.onNextKeyPress = null;
            }
        }
    }

    onKeyUp(event) {
        let key = this.keyMap[event.which];
        this.keysPressed[key] = false;
    }
}

export default Keyboard;
