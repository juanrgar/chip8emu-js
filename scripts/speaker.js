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

class Speaker {
    constructor() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        this.audioCtx = new AudioContextClass();
        this.gain = this.audioCtx.createGain();
        this.finish = this.audioCtx.destination;
        this.gain.connect(this.finish);
    }

    play(frequency) {
        if (this.audioCtx && !this.oscillator) {
            this.oscillator = this.audioCtx.createOscillator();

            this.oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

            this.oscillator.type = 'square';

            this.oscillator.connect(this.gain);
            this.oscillator.start();
        }
    }

    stop() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }
}

export default Speaker;
