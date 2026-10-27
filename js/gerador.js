/* FrutiMania – Gerador pseudoaleatório Mersenne Twister (equivalente ao random.Random do Python). */
'use strict';

/* =====================================================================
   1. GERADOR PSEUDOALEATÓRIO – Mersenne Twister (MT19937)
   Implementação equivalente à do Python (random.Random): mesma semente
   inteira => mesma sequência de randint(0, 4) do notebook.
   ===================================================================== */
class MersenneTwister {
  constructor(seed) {
    this.mt = new Uint32Array(624); this.idx = 625;
    this.initByArray([seed >>> 0]);
  }
  initGenrand(s) {
    const mt = this.mt; mt[0] = s >>> 0;
    for (let i = 1; i < 624; i++) {
      const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (Math.imul(1812433253, p) + i) >>> 0;
    }
    this.idx = 624;
  }
  initByArray(key) {
    const mt = this.mt; this.initGenrand(19650218);
    let i = 1, j = 0;
    for (let k = Math.max(624, key.length); k; k--) {
      const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(p, 1664525)) + key[j] + j) >>> 0;
      i++; j++;
      if (i >= 624) { mt[0] = mt[623]; i = 1; }
      if (j >= key.length) j = 0;
    }
    for (let k = 623; k; k--) {
      const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(p, 1566083941)) - i) >>> 0;
      i++;
      if (i >= 624) { mt[0] = mt[623]; i = 1; }
    }
    mt[0] = 0x80000000;
  }
  genrandUint32() {
    const mt = this.mt;
    if (this.idx >= 624) {
      for (let kk = 0; kk < 624; kk++) {
        const y = (mt[kk] & 0x80000000) | (mt[(kk + 1) % 624] & 0x7fffffff);
        mt[kk] = mt[(kk + 397) % 624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0);
      }
      this.idx = 0;
    }
    let y = mt[this.idx++];
    y ^= (y >>> 11); y ^= (y << 7) & 0x9d2c5680; y ^= (y << 15) & 0xefc60000; y ^= (y >>> 18);
    return y >>> 0;
  }
  getrandbits(k) { return this.genrandUint32() >>> (32 - k); }
  randbelow(n) { const k = Math.floor(Math.log2(n)) + 1; let r = this.getrandbits(k); while (r >= n) r = this.getrandbits(k); return r; }
  randint(a, b) { return a + this.randbelow(b - a + 1); }
}
