import Long from "../../../../../libraries/long.js";

// Java-compatible 48-bit LCG (java.util.Random).
//
// The previous implementation did every step with Long.js objects, which
// allocated several objects per random number and made terrain generation
// (millions of calls per chunk) extremely slow. This version keeps the exact
// same number sequence, but stores the 48-bit state as two 24-bit halves so
// all math stays within exact double precision and allocates nothing.

const TWO_24 = 16777216;
const TWO_31 = 2147483648;
const TWO_32 = 4294967296;
const POW2 = [];
for (let i = 0; i <= 48; i++) POW2[i] = Math.pow(2, i);

// 0x5DEECE66D split into 24-bit halves
const MUL_HI = 0x5DE;
const MUL_LO = 0xECE66D;
const ADDEND = 0xB;

const MULTIPLIER_LONG = Long.fromString("25214903917");
const MASK_LONG = Long.fromInt(1).shiftLeft(48).subtract(1);

export default class Random {

    static instances = 0;

    constructor(seed = Date.now() % 1000000000 ^ Random.instances++ * 1000) {
        this.doubleUnit = 1.1102230246251565E-16;
        this.hi = 0;
        this.lo = 0;
        this.setSeed(seed);
    }

    // Internal scrambled state as a Long (used by generators as a derived seed)
    get seed() {
        const low32 = (this.lo + (this.hi & 0xFF) * TWO_24) | 0;
        const high16 = (this.hi >>> 8) & 0xFFFF;
        return Long.fromBits(low32, high16);
    }

    set seed(long) {
        this._setState(long);
    }

    _setState(long) {
        const low = long.low >>> 0;
        const high = long.high & 0xFFFF;
        this.lo = low & 0xFFFFFF;
        this.hi = ((low >>> 24) | (high << 8)) & 0xFFFFFF;
    }

    // Advance the state and return the top `bits` bits as a signed 32-bit int.
    _next(bits) {
        const lo = this.lo;
        const hi = this.hi;
        const loProd = lo * MUL_LO + ADDEND;
        const carry = Math.floor(loProd / TWO_24);
        const newLo = loProd - carry * TWO_24;
        const newHi = (hi * MUL_LO + lo * MUL_HI + carry) % TWO_24;
        this.lo = newLo;
        this.hi = newHi;

        // Full 48-bit state value (< 2^48, exact in a double)
        const state = newHi * TWO_24 + newLo;
        const result = Math.floor(state / POW2[48 - bits]);
        return result >= TWO_31 ? result - TWO_32 : result;
    }

    nextFloat() {
        return this._next(24) / TWO_24;
    }

    nextDouble() {
        return (this._next(26) * 134217728 + this._next(27)) * this.doubleUnit;
    }

    nextInt(max = -1) {
        if (max === -1) {
            return this._next(32);
        }

        const r = this._next(31);
        const m = max - 1;
        if ((max & m) === 0) {
            // bound is a power of 2
            return Math.floor((max * r) / TWO_31);
        }
        return r % max;
    }

    nextLong() {
        const a = this._next(32);
        const b = this._next(32);
        return Long.fromInt(a).shiftLeft(32).add(Long.fromInt(b));
    }

    next(bits) {
        return Long.fromNumber(this._next(bits));
    }

    setSeed(n) {
        let long;

        if (typeof n === "number") {
            long = Long.fromInt(n);
        } else if (n instanceof Long) {
            long = n;
        } else if (n && typeof n.low === "number" && typeof n.high === "number") {
            long = Long.fromBits(n.low, n.high);
        } else {
            long = Long.fromString(String(n));
        }

        this._setState(long.xor(MULTIPLIER_LONG).and(MASK_LONG));
    }
}
