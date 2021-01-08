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
    setupStopResumeButton();
    setupSettingsPane();
    $("#rom-info p").html("No ROM loaded.");
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
        let romSelector = $("#rom-selector").get(0);
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
        $("#rom-info p").html("No ROM loaded.");
        return;
    }
    let rom = roms[romSelector.selectedIndex - 1];
    loadRom(rom.file, function () {
        screen.clear();
        cpu.reset();
        cpu.resume();
        romSelector.blur();
        $("#stop-button").prop("disabled", false);
        $("#rom-info p").html(rom.description);
        tic = Date.now();
        window.requestAnimationFrame(step);
    });
}

function setupStopResumeButton() {
    let stopButton = $("#stop-button");
    stopButton.prop("disabled", true).click(onStopResumeClick);
}

function onStopResumeClick () {
    let stopButton = $("#stop-button");
    if (stopButton.text() === "Stop") {
        cpu.halt();
        stopButton.text("Resume");
    } else if (stopButton.text() === "Resume") {
        cpu.resume();
        stopButton.text("Stop");
    }
    stopButton.blur();
}

function setupSettingsPane () {
    $("#settings").click(function() {
        $("#settings-pane").toggle();
    });
    $("#load-store-quirk").prop("checked", false).click(function () {
        cpu.set_quirk_ld_i_inc(false);
    });
    $("#shift-quirk").prop("checked", false).click(function () {
        cpu.set_quirk_shift_vx(true);
    });
}
