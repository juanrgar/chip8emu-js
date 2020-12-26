class Cpu {
    constructor(screen, keyboard) {
        this.screen = screen;
        this.keyboard = keyboard;

        this.memory = new Array(4096);
        this.v = new Array(16);
        this.i = 0;
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.pc = 0;
        this.sp = 0;
        this.stack = new Array(16);

        this.decode_level1 = [
            this.decode_level1_0,
            this.inst_JP,
            this.inst_CALL,
            this.inst_SE_imm,
            this.inst_SNE_imm,
            this.inst_SE_reg,
            this.inst_LD_imm,
            this.inst_ADD_imm,
            this.decode_level1_8,
            this.inst_SNE_reg,
            this.inst_LD_I,
            this.inst_JP_V0,
            this.inst_RND,
            this.inst_DRW,
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

    decode_level1_8(inst) {
    }

    decode_level1_E(inst) {
    }

    decode_level1_F(inst) {
    }

    inst_SYS(inst) {
        let nnn = inst & 0xFFFFFF;
        this.set_pc(nnn);
    }

    inst_CLS(inst) {
        this.screen.clear();
        this.inc_pc(2);
    }

    inst_RET(inst) {
        this.set_pc(this.stack.pop());
        this.dec_sp();
    }

    inst_JP(inst) {
        let nnn = inst & 0xFFFFFF;
        this.set_pc(nnn);
    }

    inst_JP_V0(inst) {
        let nnn = inst & 0xFFFFFF;
        this.set_pc(nnn + this.v[0]);
    }

    inst_CALL(inst) {
        let nnn = inst & 0xFFFFFF;
        this.inc_sp();
        this.stack.push(this.pc);
        this.set_pc(nnn);
    }

    inst_SE_imm(inst) {
        let x = (inst >> 16) & 0xFF;
        let kk = inst & 0xFFFF;
        let inc = 1 + (this.v[x] == kk);
        this.inc_pc(inc);
    }

    inst_SNE_imm(inst) {
        let x = (inst >> 16) & 0xFF;
        let kk = inst & 0xFFFF;
        let inc = 1 + (this.v[x] != kk);
        this.inc_pc(inc);
    }

    inst_SE_reg(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        let inc = 1 + (this.v[x] == this.v[y]);
        this.inc_pc(inc);
    }

    inst_SNE_reg(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        let inc = 1 + (this.v[x] != this.v[y]);
        this.inc_pc(inc);
    }

    inst_LD_imm(inst) {
        let x = (inst >> 16) & 0xFF;
        let kk = inst & 0xFFFF;
        this.v[x] = kk;
    }

    inst_LD_reg(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        this.v[x] = this.v[y];
    }

    inst_LD_I(inst) {
        let nnn = inst & 0xFFFFFF;
        this.i = nnn;
    }

    inst_LD_DT_rd(inst) {
        let x = (inst >> 16) & 0xFF;
        this.v[x] = this.delayTimer;
    }

    inst_LD_DT_wr(inst) {
        let x = (inst >> 16) & 0xFF;
        this.delayTimer = this.v[x];
    }

    inst_LD_ST_wr(inst) {
        let x = (inst >> 16) & 0xFF;
        this.soundTimer = this.v[x];
    }

    inst_LD_F(inst) {
        console.log('not implemented');
    }

    inst_LD_B(inst) {
        console.log('not implemented');
    }

    inst_LD_regs_st(inst) {
        console.log('not implemented');
    }

    inst_LD_regs_ld(inst) {
        console.log('not implemented');
    }

    inst_ADD_imm(inst) {
        let x = (inst >> 16) & 0xFF;
        let kk = inst & 0xFFFF;
        this.v[x] += kk;
        this.v[x] &= 0xFF;
    }

    inst_ADD_reg(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        this.v[x] += this.v[y];
        this.v[0xF] = this.v[x] > 0x100;
        this.v[x] &= 0xFF;
    }

    inst_ADD_I(inst) {
        let x = (inst >> 16) & 0xFF;
        this.i += this.v[x];
        this.i &= 0xFFFF;
    }

    inst_SUB(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        this.v[0xF] = this.v[x] > this.v[y];
        this.v[x] -= this.v[y];
        this.v[x] &= 0xFF;
    }

    inst_SUBN(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        this.v[0xF] = this.v[y] > this.v[x];
        this.v[x] = this.v[y] - this.v[x];
    }

    inst_AND(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        this.v[x] &= this.v[y];
    }

    inst_OR(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        this.v[x] |= this.v[y];
    }

    inst_XOR(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        this.v[x] ^= this.v[y];
    }

    inst_SHR(inst) {
        let x = (inst >> 16) & 0xFF;
        this.v[0xF] = this.v[x] & 0x01;
        this.v[x] >>= 1;
    }

    inst_SHL(inst) {
        let x = (inst >> 16) & 0xFF;
        this.v[0xF] = this.v[x] & 0x80;
        this.v[x] <<= 1;
        this.v[x] &= 0xFF;
    }

    inst_RND(inst) {
        console.log('not implemented');
    }

    inst_DRW(inst) {
        let x = (inst >> 16) & 0xFF;
        let y = (inst >> 8) & 0xFF;
        let n = inst & 0xFF;
        let vx = this.v[x];
        let vy = this.v[y];
        this.v[0xF] = 0;
        for (let r = 0; r < n; r++) {
            let sc = this.memory[this.i + r];
            for (let c = 0; c < 8; c++) {
                if (sc & 0x80) {
                    this.v[0xF] |= screen.setPixel(vx + c, vy + r);
                }
                sc <<= 1;
            }
        }
    }

    inst_SKP(inst) {
        console.log('not implemented');
    }

    inst_SKNP(inst) {
        console.log('not implemented');
    }

    inst_LD_K(inst) {
        console.log('not implemented');
    }
}

export default Cpu;
