/* FrutiMania – Regras públicas da máquina (Seção 5 do enunciado): rolo, janela, pagamento e métricas. */
'use strict';

/* =====================================================================
   2. MODELO (Seção 5 do enunciado) – regras fixas
   ===================================================================== */
const SIMBOLOS = ['A', 'B', 'C', 'D', 'E'];
const APOSTA = 1;
const FRUTAS = {
  banana: { emo: '🍌', nome: 'Banana' }, maca: { emo: '🍎', nome: 'Maçã' }, abacaxi: { emo: '🍍', nome: 'Abacaxi' },
  uva: { emo: '🍇', nome: 'Uva' }, morango: { emo: '🍓', nome: 'Morango' }, melancia: { emo: '🍉', nome: 'Melancia' }
};
const TABELAS_PRONTAS = {
  base: { A: 5, B: 10, C: 15, D: 25, E: 50 },
  mais10: { A: 5.5, B: 11, C: 16.5, D: 27.5, E: 55 },
  plana: { A: 21, B: 21, C: 21, D: 21, E: 21 },
  concentrada: { A: 0, B: 0, C: 0, D: 0, E: 105 }
};
const CONFIG_PADRAO = {
  tabela: { ...TABELAS_PRONTAS.base },
  frutas: { A: 'banana', B: 'maca', C: 'abacaxi', D: 'uva', E: 'morango' },
  saldos: [20, 50, 100], saldoMax: 1000,
  sementeModo: 'auto', sementeFixa: 2026,
  pin: '1234', animacao: 'normal'
};

function janela(k) { return [0, 1, 2].map(d => SIMBOLOS[(k + d) % 5]); }   // topo, centro, base
function sortear(rng) { return [rng.randint(0, 4), rng.randint(0, 4), rng.randint(0, 4)]; }
function centroDe(ks) { return ks.map(k => SIMBOLOS[(k + 1) % 5]); }
function pagamento(centro, tabela) { return (centro[0] === centro[1] && centro[1] === centro[2]) ? (Number(tabela[centro[0]]) || 0) : 0; }
function metricasTabela(tab) {
  const ps = SIMBOLOS.map(s => Number(tab[s]) || 0);
  const ep = ps.reduce((a, b) => a + b, 0) / 125;
  const ep2 = ps.reduce((a, b) => a + b * b, 0) / 125;
  const pPremio = ps.filter(p => p > 0).length / 125;
  return { ep, rtp: ep / APOSTA * 100, ex: ep - APOSTA, vantagem: (APOSTA - ep) / APOSTA * 100, dp: Math.sqrt(Math.max(0, ep2 - ep * ep)), pPremio };
}
