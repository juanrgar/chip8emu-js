class Cpu {
    constructor(renderer, keyboard) {
        this.renderer = renderer;
        this.keyboard = keyboard;

        this.memory = new Array(4096);
        this.v = new Array(16);
        this.i = 0;
        this.vf = 0;
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.pc = 0;
        this.sp = 0;
        this.stack = new Array(16);
    }

    loadProgram(program) {
        for (let i = 0; i < program.length; i++) {
            this.memory[0x200 + i] = program[i];
        }
    }

    store(offset, byte) {
        this.memory[offset] = byte;
    }

    reset() {
        this.pc = 0x200;
    }

    cycle() {
        let inst = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
    }
}

export default Cpu;
