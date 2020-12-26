class Cpu {
    constructor(screen, keyboard) {
        this.screen = screen;
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

        this.decode_level1 = [
            this.decode_level1_0,
            this.decode_level1_1,
            this.decode_level1_2,
            this.decode_level1_3,
            this.decode_level1_4,
            this.decode_level1_5,
            this.decode_level1_6,
            this.decode_level1_7,
            this.decode_level1_8,
            this.decode_level1_9,
            this.decode_level1_A,
            this.decode_level1_B,
            this.decode_level1_C,
            this.decode_level1_D,
            this.decode_level1_E,
            this.decode_level1_F
        ];
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

    inc_pc(stride) {
        this.pc += stride;
    }

    set_pc(pc) {
        this.pc = pc;
    }

    inc_sp() {
        this.sp++;
    }

    dec_sp() {
        this.sp--;
    }

    cycle() {
        let inst = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
        let func = this.decode_level0(inst);
        func.call(this, inst);
    }

    decode_level0(inst) {
        let opcode = (inst >> 24) & 0xFF;
        let func = this.decode_level1[opcode];
        return func.call(this, inst);
    }

    decode_level1_0(inst) {
        let lsb = inst & 0xFFFF;
        if (lsb == 0xE0) {
            return this.inst_CLS;
        } else if (lsb == 0xEE) {
            return this.inst_RET;
        } else {
            return this.inst_SYS;
        }
    }

    decode_level1_1(inst) {
    }

    decode_level1_2(inst) {
    }

    decode_level1_3(inst) {
    }

    decode_level1_4(inst) {
    }

    decode_level1_5(inst) {
    }

    decode_level1_6(inst) {
    }

    decode_level1_7(inst) {
    }

    decode_level1_8(inst) {
    }

    decode_level1_9(inst) {
    }

    decode_level1_A(inst) {
    }

    decode_level1_B(inst) {
    }

    decode_level1_C(inst) {
    }

    decode_level1_D(inst) {
    }

    decode_level1_E(inst) {
    }

    decode_level1_(inst) {
    }

    inst_SYS(inst) {
        let addr = inst & 0xFFFFFF;
        this.set_pc(addr);
    }

    inst_CLS(inst) {
        this.screen.clear();
        this.inc_pc(2);
    }

    inst_RET(inst) {
        this.set_pc(this.stack.pop());
        this.dec_sp();
    }
}

export default Cpu;
