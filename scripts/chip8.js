import Screen from './screen.js';
import Keyboard from './keyboard.js';
import Cpu from './cpu.js';

const screen = new Screen(10);
const keyboard = new Keyboard();
const cpu = new Cpu(screen, keyboard);

let tic;

function init() {
    loadSprites();
    // let rom = 'Minimal game [Revival Studios, 2007].ch8';
    // let rom = '15 Puzzle [Roger Ivie].ch8';
    // let rom = 'Maze [David Winter, 199x].ch8';
    let rom = 'Cave.ch8';
    // let rom = 'Zero Demo [zeroZshadow, 2007].ch8';
    loadRom(rom, function () {
        cpu.reset();
        tic = Date.now();
        window.requestAnimationFrame(step);
    });
}

function step() {
    let toc = Date.now();
    let elapsed = toc - tic;
    if (elapsed >= (1000 / 60)) {
        tic = toc;
        cpu.cycle();
        screen.render();
    }
    window.requestAnimationFrame(step);
}

function loadRom(romName, cb) {
    let request = new XMLHttpRequest;
    let self = this;

    request.onload = function() {
        if (request.response) {
            let program = new Uint8Array(request.response);
            cpu.loadProgram(program);
            cb();
        }
    };

    request.open('GET', 'roms/' + romName);
    request.responseType = 'arraybuffer';
    request.send();
}

function loadSprites() {
    const sprites = [
        0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
        0x20, 0x60, 0x20, 0x20, 0x70, // 1
        0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
        0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
        0x90, 0x90, 0xF0, 0x10, 0x10, // 4
        0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
        0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
        0xF0, 0x10, 0x20, 0x40, 0x40, // 7
        0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
        0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
        0xF0, 0x90, 0xF0, 0x90, 0x90, // A
        0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
        0xF0, 0x80, 0x80, 0x80, 0xF0, // C
        0xE0, 0x90, 0x90, 0x90, 0xE0, // D
        0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
        0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ];

    for (let i = 0; i < sprites.length; i++) {
        cpu.store(i, sprites[i]);
    }
}

init();
