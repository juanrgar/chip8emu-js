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

class Cpu {
    constructor(screen, keyboard) {
        this.screen = screen;
        this.keyboard = keyboard;

        this.memory = new Uint8Array(4096);
        this.v = new Uint8Array(16);
        this.i = 0;
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.pc = 0;
        this.sp = 0;
        this.stack = new Array(16);

        this.halted = false;
        this.wait_for_irq = false;
        this.pc_updated = false;

        this.decoder_level1 = [
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

        this.decoder_level2_8 = [
            this.inst_LD_reg,
            this.inst_OR,
            this.inst_AND,
            this.inst_XOR,
            this.inst_ADD_reg,
            this.inst_SUB,
            this.inst_SHR,
            this.inst_SUBN,
            null,
            null,
            null,
            null,
            null,
            null,
            this.inst_SHL,
            null
        ];

        this.decoder_level2_E = [
            this.inst_SKP,
            this.inst_SKNP
        ];

        this.decoder_level2_F = [
            this.decode_level3_F_0,
            this.decode_level3_F_1,
            this.inst_LD_F,
            this.inst_LD_B,
            null,
            this.inst_LD_regs_st,
            this.inst_LD_regs_ld
        ];

        this.decoder_level3_F_0 = [
            this.inst_LD_DT_rd,
            this.inst_LD_K
        ];

        this.decoder_level3_F_1 = [
            null,
            this.inst_LD_DT_wr,
            this.inst_LD_ST,
            this.inst_ADD_I
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
        this.set_pc(0x200);
        this.pc_updated = false;
        this.halt();
    }

    inc_pc(ninst) {
        this.set_pc(this.pc + (ninst * 2));
    }

    set_pc(pc) {
        this.pc = pc & 0xFFFF;
        this.pc_updated = true;
    }

    inc_sp() {
        this.sp++;
        this.sp &= 0xFFFF;
    }

    dec_sp() {
        this.sp--;
        this.sp &= 0xFFFF;
    }

    cycle() {
        if (this.halted || this.wait_for_irq) {
            return;
        }
        for (let i = 0; i < 10; i++) {
            let inst = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
            this.pc_updated = false;
            this.decode_level0(inst);
            if (!this.pc_updated) {
                this.inc_pc(1);
            }
        }
        this.updateTimers();
    }

    halt() {
        this.halted = true;
    }

    resume() {
        this.halted = false;
    }

    decode_level0(inst) {
        let opcode = (inst >> 12) & 0xF;
        let func = this.decoder_level1[opcode];
        func.call(this, inst);
    }

    decode_level1_0(inst) {
        let lsb = inst & 0xFF;
        if (lsb == 0xE0) {
            this.inst_CLS(inst);
        } else if (lsb == 0xEE) {
            this.inst_RET(inst);
        } else {
            this.inst_SYS(inst);
        }
    }

    decode_level1_8(inst) {
        let opcode = inst & 0xF;
        let func = this.decoder_level2_8[opcode];
        func.call(this, inst);
    }

    decode_level1_E(inst) {
        let opcode = inst & 1;
        let func = this.decoder_level2_E[opcode];
        func.call(this, inst);
    }

    decode_level1_F(inst) {
        let opcode = (inst >> 4) & 0xF;
        let func = this.decoder_level2_F[opcode];
        func.call(this, inst);
    }

    decode_level3_F_0(inst) {
        let opcode = (inst >> 3) & 1;
        let func = this.decoder_level3_F_0[opcode];
        func.call(this, inst);
    }

    decode_level3_F_1(inst) {
        let opcode = (inst >> 2) & 3;
        let func = this.decoder_level3_F_1[opcode];
        func.call(this, inst);
    }

    inst_SYS(inst) {
        let nnn = inst & 0xFFF;
        this.set_pc(nnn);
    }

    inst_CLS(inst) {
        this.screen.clear();
    }

    inst_RET(inst) {
        this.dec_sp();
        this.set_pc(this.stack[this.sp]);
    }

    inst_JP(inst) {
        let nnn = inst & 0xFFF;
        this.set_pc(nnn);
    }

    inst_JP_V0(inst) {
        let nnn = inst & 0xFFF;
        this.set_pc(nnn + this.v[0]);
    }

    inst_CALL(inst) {
        let nnn = inst & 0xFFF;
        this.stack[this.sp] = this.pc + 2;
        this.inc_sp();
        this.set_pc(nnn);
    }

    inst_SE_imm(inst) {
        let x = (inst >> 8) & 0xF;
        let kk = inst & 0xFF;
        let inc = 1 + (this.v[x] === kk);
        this.inc_pc(inc);
    }

    inst_SNE_imm(inst) {
        let x = (inst >> 8) & 0xF;
        let kk = inst & 0xFF;
        let inc = 1 + (this.v[x] !== kk);
        this.inc_pc(inc);
    }

    inst_SE_reg(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        let inc = 1 + (this.v[x] === this.v[y]);
        this.inc_pc(inc);
    }

    inst_SNE_reg(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        let inc = 1 + (this.v[x] !== this.v[y]);
        this.inc_pc(inc);
    }

    inst_LD_imm(inst) {
        let x = (inst >> 8) & 0xF;
        let kk = inst & 0xFF;
        this.v[x] = kk;
    }

    inst_LD_reg(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        this.v[x] = this.v[y];
    }

    inst_LD_I(inst) {
        let nnn = inst & 0xFFF;
        this.i = nnn;
    }

    inst_LD_DT_rd(inst) {
        let x = (inst >> 8) & 0xF;
        this.v[x] = this.delayTimer;
    }

    inst_LD_DT_wr(inst) {
        let x = (inst >> 8) & 0xF;
        this.delayTimer = this.v[x];
    }

    inst_LD_ST(inst) {
        let x = (inst >> 8) & 0xF;
        this.soundTimer = this.v[x];
    }

    inst_LD_F(inst) {
        let x = (inst >> 8) & 0xF;
        this.i = this.v[x] * 5;
    }

    inst_LD_B(inst) {
        let x = (inst >> 8) & 0xF;
        let vx = this.v[x];
        let hundreds = parseInt(vx / 100, 10);
        let tens = parseInt((vx - hundreds * 100) / 10, 10);
        let ones = parseInt(vx - hundreds * 100 - tens * 10, 10);
        this.memory[this.i] = hundreds;
        this.memory[this.i + 1] = tens;
        this.memory[this.i + 2] = ones;
    }

    inst_LD_regs_st(inst) {
        let x = (inst >> 8) & 0xF;
        for (let i = 0; i <= x; i++) {
            this.memory[this.i++] = this.v[i];
        }
    }

    inst_LD_regs_ld(inst) {
        let x = (inst >> 8) & 0xF;
        for (let i = 0; i <= x; i++) {
            this.v[i] = this.memory[this.i++];
        }
    }

    inst_ADD_imm(inst) {
        let x = (inst >> 8) & 0xF;
        let kk = inst & 0xFF;
        this.v[x] += kk;
        this.v[x] &= 0xFF;
    }

    inst_ADD_reg(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        let vx = this.v[x] + this.v[y];
        this.v[0xF] = vx > 0xFF;
        this.v[x] = vx & 0xFF;
    }

    inst_ADD_I(inst) {
        let x = (inst >> 8) & 0xF;
        this.i += this.v[x];
        this.i &= 0xFFFF;
    }

    inst_SUB(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        this.v[0xF] = this.v[x] >= this.v[y];
        this.v[x] -= this.v[y];
        this.v[x] &= 0xFF;
    }

    inst_SUBN(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        this.v[0xF] = this.v[y] >= this.v[x];
        this.v[x] = this.v[y] - this.v[x];
    }

    inst_AND(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        this.v[x] &= this.v[y];
    }

    inst_OR(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        this.v[x] |= this.v[y];
    }

    inst_XOR(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        this.v[x] ^= this.v[y];
    }

    inst_SHR(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
//        this.v[0xF] = this.v[x] & 0x01;
//        this.v[x] >>= 1;
        let vy = this.v[y];
        this.v[0xF] = vy & 1;
        this.v[x] = vy >> 1;
    }

    inst_SHL(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
//        this.v[0xF] = this.v[x] & 0x80;
//        this.v[x] <<= 1;
//        this.v[x] &= 0xFF;
        let vy = this.v[y];
        this.v[0xF] = (vy >> 7) & 1;
        this.v[x] = this.v[y] << 1;
    }

    inst_RND(inst) {
        let x = (inst >> 8) & 0xF;
        let kk = inst & 0xFF;
        this.v[x] = Math.floor(Math.random() * 0xFF) & kk;
    }

    inst_DRW(inst) {
        let x = (inst >> 8) & 0xF;
        let y = (inst >> 4) & 0xF;
        let n = inst & 0xF;
        let vx = this.v[x];
        let vy = this.v[y];
        this.v[0xF] = 0;
        for (let r = 0; r < n; r++) {
            let sc = this.memory[this.i + r];
            for (let c = 0; c < 8; c++) {
                if (sc & 0x80) {
                    this.v[0xF] |= this.screen.setPixel(vx + c, vy + r);
                }
                sc <<= 1;
            }
        }
    }

    inst_SKP(inst) {
        let x = (inst >> 8) & 0xF;
        let inc = 1 + this.keyboard.isKeyPressed(this.v[x]);
        this.inc_pc(inc);
    }

    inst_SKNP(inst) {
        let x = (inst >> 8) & 0xF;
        let inc = 1 + !this.keyboard.isKeyPressed(this.v[x]);
        this.inc_pc(inc);
    }

    inst_LD_K(inst) {
        let x = (inst >> 8) & 0xF;
        this.wait_for_irq = true;
        this.keyboard.onNextKeyPress = function (key) {
            if (this.halted) {
                return;
            }
            this.v[x] = key;
            this.wait_for_irq = false;
        }.bind(this);
    }

    updateTimers() {
        if (this.delayTimer > 0) {
            this.delayTimer--;
        }
        if (this.soundTimer > 0) {
            this.soundTimer--;
        }
    }
}

export default Cpu;
