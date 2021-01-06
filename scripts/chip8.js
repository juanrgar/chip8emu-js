import Screen from './screen.js';
import Keyboard from './keyboard.js';
import Cpu from './cpu.js';

const screen = new Screen(10);
const keyboard = new Keyboard();
const cpu = new Cpu(screen, keyboard);

let tic, roms;

$(function() {
    loadSprites();
    setupRomSelector();
    let stopButton = $("#stop-button");
    stopButton.prop("disabled", true).click(function () {
        if (stopButton.text() === "Stop") {
            cpu.halt();
            stopButton.text("Resume");
        } else if (stopButton.text() === "Resume") {
            cpu.resume();
            stopButton.text("Stop");
        }
        stopButton.blur();
    });
    $("#settings").click(function() {
        $("#settings-pane").toggle();
    });
    $("#load-store-quirk").prop("checked", false);
    $("#shift-quirk").prop("checked", false);
});

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

function setupRomSelector() {
    $.get('roms/roms.json', function(romsList) {
        roms = romsList;
        let romSelector = document.querySelector('#rom-selector');
        $.each(romsList, function(i, rom) {
            let o = new Option(rom.title, rom.file);
            o.title = rom.description;

            romSelector[romSelector.length] = o;
        });
        $('#rom-selector').change(onRomSelected);
    });
}

function onRomSelected() {
    let romSelector = document.querySelector('#rom-selector');
    if (romSelector.selectedIndex == 0) {
        $("#stop-button").text("Stop").prop("disabled", true).blur();
        screen.clear();
        cpu.reset();
        return;
    }
    let romName = roms[romSelector.selectedIndex - 1].file;
    loadRom(romName, function () {
        screen.clear();
        cpu.reset();
        cpu.resume();
        romSelector.blur();
        $("#stop-button").prop("disabled", false);
        tic = Date.now();
        window.requestAnimationFrame(step);
    });
}
