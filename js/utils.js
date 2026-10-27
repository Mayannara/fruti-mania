/* FrutiMania – Funções auxiliares de formatação, acessibilidade e avisos. */
'use strict';

/* =====================================================================
   4. UTILITÁRIOS
   ===================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const nf = (d = 0) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
function fmt(n, d = 2) { return nf(d).format(n); }
function cred(n) { return Number.isInteger(Math.round(n * 1000) / 1000) ? nf(0).format(n) : nf(2).format(n); }
function sinal(n, f = cred) { return (n > 0 ? '+' : n < 0 ? '−' : '') + f(Math.abs(n)); }
function pct(x, d = 2) { return fmt(x, d) + '%'; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function anunciar(msg) { const el = $('#sr'); el.textContent = ''; setTimeout(() => el.textContent = msg, 30); }
function fruta(letra, frutas = DB.config.frutas) { return FRUTAS[frutas[letra]] || { emo: letra, nome: letra }; }
function trioTexto(c, frutas) { return c.map(l => fruta(l, frutas).emo + l).join(' – '); }
function trioFala(c, frutas) { return c.map(l => fruta(l, frutas).nome + ' ' + l).join(', '); }
function dataHora(t) { return new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }); }
function dia(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
let toastT;
function toast(msg) { anunciar(msg); $('#toast-msg').textContent = msg; $('#toast').classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => $('#toast').classList.remove('show'), 3500); }
function reduzirMovimento() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
