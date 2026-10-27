/* FrutiMania – Fluxo do jogador: telas, sessão, giros, animação e fim de sessão. */
'use strict';

/* =====================================================================
   5. NAVEGAÇÃO ENTRE TELAS
   ===================================================================== */
const TELAS = ['tela-inicio', 'tela-saida', 'tela-nome', 'tela-saldo', 'tela-jogo', 'tela-admin'];
let telaAtual = 'tela-inicio';
function mostrar(id) {
  TELAS.forEach(t => $('#' + t).classList.toggle('hidden', t !== id));
  telaAtual = id;
  $('#top-game').hidden = id !== 'tela-jogo';
  $('#top-admin').hidden = id !== 'tela-admin';
  const h = $('#' + id + ' [tabindex="-1"]');
  if (h) h.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reduzirMovimento() ? 'auto' : 'smooth' });
  if (id === 'tela-inicio') renderInicio();
  if (id === 'tela-nome') renderNome();
  if (id === 'tela-saldo') renderSaldo();
  if (id === 'tela-jogo') renderJogo();
  if (id === 'tela-admin') renderAdmin();
}
$$('[data-go]').forEach(b => b.addEventListener('click', () => mostrar(b.dataset.go)));

/* ---------- Passo 1 ---------- */
function renderInicio() {
  const m = metricasTabela(DB.config.tabela);
  const frutasTxt = SIMBOLOS.map(s => fruta(s).emo + ' ' + s).join(', ');
  $('#hero-frutas').textContent = SIMBOLOS.slice().reverse().slice(0, 3).map(s => fruta(s).emo).join(' ');
  $('#lista-regras').innerHTML = [
    `3 rolos, cada um com 5 frutas em ordem fixa (${frutasTxt}); cada parada tem chance 1/5.`,
    'Só a linha central é avaliada, e só paga quando as três frutas são iguais.',
    'Cada giro custa 1 crédito fictício. Sem bônus, multiplicadores ou mudança de chances após perdas.',
    `Chance de algum prêmio em cada giro: ${pct(m.pPremio * 100, 0)} (5 trios em 125 combinações).`,
    `RTP desta máquina: ${pct(m.rtp, 1)} – em média, de cada 100 créditos apostados voltam ${fmt(m.rtp, 1)}. Lucro esperado do jogador: ${sinal(m.ex, v => fmt(v, 3))} crédito por giro.`
  ].map(t => `<li><span>${esc(t)}</span></li>`).join('');
  const s = sessaoAtiva();
  $('#box-continuar').classList.toggle('hidden', !s);
  if (s) $('#btn-continuar').textContent = `Continuar sessão de ${s.jogador} (saldo ${cred(s.saldo)})`;
}
$('#btn-sim').addEventListener('click', () => mostrar('tela-nome'));
$('#btn-nao').addEventListener('click', () => mostrar('tela-saida'));
$('#btn-continuar').addEventListener('click', () => { if (sessaoAtiva()) mostrar('tela-jogo'); });

/* ---------- Passo 2 ---------- */
let jogadorAtual = '';
function renderNome() {
  const inp = $('#inp-nome'); inp.value = jogadorAtual; inp.removeAttribute('aria-invalid'); $('#nome-erro').textContent = '';
  const nomes = [...new Set(DB.sessoes.slice().reverse().map(s => s.jogador))].slice(0, 6);
  $('#box-recentes').classList.toggle('hidden', nomes.length === 0);
  $('#recentes').innerHTML = nomes.map(n => `<button type="button" class="btn btn-ghost btn-sm" data-nome="${esc(n)}">${esc(n)}</button>`).join('');
  $$('#recentes [data-nome]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.nome; inp.focus(); }));
}
$('#form-nome').addEventListener('submit', e => {
  e.preventDefault();
  const inp = $('#inp-nome'); const v = inp.value.trim().replace(/\s+/g, ' ');
  if (v.length < 2 || v.length > 24) {
    inp.setAttribute('aria-invalid', 'true'); $('#nome-erro').textContent = 'Digite um nome com 2 a 24 caracteres.'; inp.focus(); return;
  }
  jogadorAtual = v; mostrar('tela-saldo');
});

/* ---------- Passo 3 ---------- */
let saldoEscolhido = null;
function renderSaldo() {
  $('#saldo-ola').textContent = `Olá, ${jogadorAtual}!`;
  const c = DB.config;
  const cards = c.saldos.map((v, i) => `
    <label class="opt"><input type="radio" name="saldo" value="${v}" ${i === 1 ? 'checked' : ''}>
      <span class="check" aria-hidden="true">✓</span>
      <span class="sub">Opção ${i + 1}</span><span class="val">${cred(v)}</span><span class="sub">créditos fictícios</span></label>`).join('') + `
    <label class="opt"><input type="radio" name="saldo" value="outro">
      <span class="check" aria-hidden="true">✓</span>
      <span class="sub">Outro valor</span><span class="sub">de 1 a ${cred(c.saldoMax)}</span>
      <input class="input" id="inp-outro" type="number" min="1" max="${c.saldoMax}" step="1" inputmode="numeric" aria-label="Outro valor de saldo, em créditos" placeholder="ex.: 30"></label>`;
  $('#opcoes-saldo').innerHTML = cards;
  $('#saldo-erro').textContent = '';
  $$('#opcoes-saldo input[name=saldo]').forEach(r => r.addEventListener('change', atualizarResumoSaldo));
  const outro = $('#inp-outro');
  outro.addEventListener('focus', () => { $('#opcoes-saldo input[value=outro]').checked = true; atualizarResumoSaldo(); });
  outro.addEventListener('input', atualizarResumoSaldo);
  atualizarResumoSaldo();
}
function lerSaldo() {
  const sel = $('#opcoes-saldo input[name=saldo]:checked'); if (!sel) return null;
  if (sel.value !== 'outro') return Number(sel.value);
  const v = Number($('#inp-outro').value);
  return (Number.isInteger(v) && v >= 1 && v <= DB.config.saldoMax) ? v : null;
}
function atualizarResumoSaldo() {
  const v = lerSaldo(); saldoEscolhido = v;
  const m = metricasTabela(DB.config.tabela);
  $('#saldo-resumo').textContent = v ? `${cred(v)} créditos` : '–';
  $('#saldo-resumo-2').textContent = v ? `Permite ${cred(v)} giros se não houver prêmios. Pela esperança, ${cred(v)} giros resultariam em média em ${sinal(m.ex * v, x => fmt(x, 1))} crédito(s).` : 'Escolha uma opção ou digite um valor inteiro válido.';
}
$('#form-saldo').addEventListener('submit', e => {
  e.preventDefault();
  const v = lerSaldo();
  if (!v) { $('#saldo-erro').textContent = `Escolha um saldo ou digite um número inteiro entre 1 e ${cred(DB.config.saldoMax)}.`; ($('#inp-outro') || $('#opcoes-saldo input')).focus(); return; }
  iniciarSessao(jogadorAtual, v); mostrar('tela-jogo');
});

/* =====================================================================
   6. SESSÃO E RODADAS
   ===================================================================== */
let rng = null, rngSessao = null, girando = false;
function sessaoAtiva() { return DB.sessoes.find(s => s.id === DB.ativa && s.status === 'ativa') || null; }
function novaSemente() {
  if (DB.config.sementeModo === 'fixa') return DB.config.sementeFixa >>> 0;
  const a = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(a); return a[0];
}
function iniciarSessao(jogador, saldo) {
  const atual = sessaoAtiva(); if (atual) finalizarSessao(atual, 'encerrada', false);
  DB.seq += 1;
  const s = {
    id: 'S-' + String(DB.seq).padStart(4, '0'), jogador, inicio: Date.now(), fim: null,
    saldoInicial: saldo, saldo, giros: 0, apostado: 0, premios: 0, nPremios: 0,
    semente: novaSemente(), tabela: { ...DB.config.tabela }, frutas: { ...DB.config.frutas }, status: 'ativa'
  };
  DB.sessoes.push(s); DB.ativa = s.id; salvar();
  rng = new MersenneTwister(s.semente); rngSessao = s.id;   // semente iniciada UMA vez por sessão
  $('#display').className = 'display'; $('#display').textContent = 'Pressione GIRAR para começar.';
  renderCarretel(janelasIniciais());
  anunciar(`Sessão ${s.id} iniciada com ${cred(saldo)} créditos.`);
}
function garantirRng(s) {
  if (rng && rngSessao === s.id) return;
  rng = new MersenneTwister(s.semente); rngSessao = s.id;
  for (let i = 0; i < s.giros * 3; i++) rng.randint(0, 4);    // retoma a sequência após recarregar a página
}
function janelasIniciais() {
  const s = sessaoAtiva(); if (!s) return [0, 1, 2];
  const ult = DB.rodadas.filter(r => r.s === s.id).pop();
  return ult ? ult.k : [4, 0, 2];
}
function girar() {
  const s = sessaoAtiva();
  if (girando || !s || telaAtual !== 'tela-jogo') return;
  if (s.saldo < APOSTA) { finalizarSessao(s, 'esgotada', true); return; }
  garantirRng(s);
  const posAnterior = janelasIniciais();
  girando = true; $('#btn-girar').disabled = true; $('#btn-encerrar').disabled = true;
  const ks = sortear(rng), c = centroDe(ks), p = pagamento(c, s.tabela), x = p - APOSTA;
  s.giros += 1; s.apostado += APOSTA; s.premios += p; if (p > 0) s.nPremios += 1;
  s.saldo = Math.round((s.saldo + x) * 1000) / 1000;
  DB.rodadas.push({ s: s.id, j: s.jogador, i: s.giros, t: Date.now(), k: ks, c: c.join(''), p, x, b: s.saldo, ep: metricasTabela(s.tabela).ep });
  salvar();
  $('#display').className = 'display'; $('#display').textContent = 'Girando… o resultado já foi sorteado.';
  animar(ks, posAnterior, () => {
    girando = false; $('#btn-girar').disabled = false; $('#btn-encerrar').disabled = false;
    mostrarResultado(s, c, p, x); renderPainelSessao();
    if (s.saldo < APOSTA) setTimeout(() => finalizarSessao(s, 'esgotada', true), 900);
  });
}
function mostrarResultado(s, c, p, x) {
  const d = $('#display');
  if (p > 0) {
    const f = fruta(c[0], s.frutas);
    d.className = 'display win';
    d.textContent = `✔ Trio de ${f.nome} (${c.join('–')})! Prêmio de ${cred(p)} créditos, lucro ${sinal(x)}. A chance no próximo giro continua 4%.`;
    anunciar(`Prêmio. Linha central: ${trioFala(c, s.frutas)}. Recebeu ${cred(p)} créditos. Saldo ${cred(s.saldo)}.`);
  } else {
    d.className = 'display loss';
    d.textContent = `✖ ${trioTexto(c, s.frutas)}: sem prêmio, ${sinal(x)} crédito.`;
    anunciar(`Sem prêmio. Linha central: ${trioFala(c, s.frutas)}. Saldo ${cred(s.saldo)}.`);
  }
}
function finalizarSessao(s, status, mostrarDialogo) {
  if (!s || s.status !== 'ativa') return;
  s.status = status; s.fim = Date.now(); if (DB.ativa === s.id) DB.ativa = null; salvar();
  if (mostrarDialogo) abrirFim(s);
}

/* ---------- Animação dos rolos (apenas apresentação) ---------- */
function renderCarretel(ks, girandoCol = [false, false, false]) {
  const s = sessaoAtiva(); const fr = s ? s.frutas : DB.config.frutas;
  ks.forEach((k, j) => {
    const col = $('#reel-' + j);
    col.classList.toggle('spinning', girandoCol[j]);
    col.innerHTML = janela(k).map((l, r) => `<div class="cell${r === 1 ? ' mid' : ''}"><span class="emo" aria-hidden="true">${fruta(l, fr).emo}</span><span class="tag">${l} · ${esc(fruta(l, fr).nome)}</span></div>`).join('');
  });
  const c = centroDe(ks);
  $('#reels').setAttribute('aria-label', `Tabuleiro 3 por 3. Linha central: ${trioFala(c, fr)}.`);
}
function animar(ks, inicio, fim) {
  const modo = DB.config.animacao;
  if (modo === 'nenhuma' || reduzirMovimento()) { renderCarretel(ks); fim(); return; }
  const passo = modo === 'rapida' ? 45 : 75, base = modo === 'rapida' ? 450 : 900, atraso = modo === 'rapida' ? 250 : 500;
  const pos = inicio.slice(); const parado = [false, false, false]; const t0 = performance.now();
  const timer = setInterval(() => {
    const t = performance.now() - t0;
    for (let j = 0; j < 3; j++) {
      if (!parado[j]) {
        if (t >= base + j * atraso) { parado[j] = true; pos[j] = ks[j]; }
        else pos[j] = (pos[j] + 4) % 5;   // rola no sentido da sequência circular
      }
    }
    renderCarretel(pos, parado.map(p => !p));
    if (parado.every(Boolean)) { clearInterval(timer); renderCarretel(ks); fim(); }
  }, passo);
}

/* ---------- Tela do jogo ---------- */
function renderJogo() {
  const s = sessaoAtiva();
  if (!s) { mostrar('tela-inicio'); return; }
  garantirRng(s);
  renderCarretel(janelasIniciais());
  $$('#seg-anim button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.anim === DB.config.animacao)));
  renderTabelaJogador(s);
  renderPainelSessao();
}
function renderTabelaJogador(s) {
  const m = metricasTabela(s.tabela);
  const linhas = SIMBOLOS.map(l => ({ l, p: Number(s.tabela[l]) || 0 }));
  $('#paytable tbody').innerHTML = linhas.map(({ l, p }) => `<tr><td>${trioTexto([l, l, l], s.frutas)}</td><td class="num">${cred(p)}</td><td class="num">${sinal(p - APOSTA)}</td><td class="num">1/125 (0,8%)</td></tr>`).join('') +
    `<tr><td>Qualquer outra tripla</td><td class="num">0</td><td class="num">−1</td><td class="num">120/125 (96%)</td></tr>`;
  $('#paytable-note').textContent = `E[P] = ${fmt(m.ep, 3)} crédito, RTP = ${pct(m.rtp, 1)}, lucro esperado E[X] = ${sinal(m.ex, v => fmt(v, 3))} por giro. RTP não é a chance de ganhar: a chance de prêmio é ${pct(m.pPremio * 100, 0)}.`;
}
function renderPainelSessao() {
  const s = sessaoAtiva() || DB.sessoes.find(x => x.id === rngSessao); if (!s) return;
  const m = metricasTabela(s.tabela);
  $('#h-jogador').textContent = s.jogador; $('#h-saldo').textContent = cred(s.saldo); $('#h-giros').textContent = s.giros;
  $('#sess-id').textContent = s.id;
  $('#s-saldo').textContent = cred(s.saldo); $('#s-saldo-ini').textContent = `inicial: ${cred(s.saldoInicial)}`;
  const res = s.saldo - s.saldoInicial;
  $('#s-res').textContent = sinal(res); $('#s-res').className = 'v ' + (res > 0 ? 'pos' : res < 0 ? 'neg' : '');
  $('#s-giros').textContent = s.giros; $('#s-premios').textContent = `${s.nPremios} com prêmio`;
  $('#s-esp').textContent = sinal(m.ex * s.giros, v => fmt(v, 2)); $('#s-esp-sub').textContent = `${fmt(m.ex, 3)} × ${s.giros} giros`;
  $('#s-freq').textContent = s.giros ? pct(s.nPremios / s.giros * 100, 1) : '–'; $('#s-freq-sub').textContent = `teórica ${pct(m.pPremio * 100, 0)}`;
  $('#s-rtp').textContent = s.giros ? pct(s.premios / s.apostado * 100, 1) : '–'; $('#s-rtp-sub').textContent = `teórico ${pct(m.rtp, 1)}`;
  $('#s-semente').textContent = s.semente;
  const rods = DB.rodadas.filter(r => r.s === s.id);
  $('#hist').innerHTML = rods.length ? rods.slice(-12).reverse().map(r =>
    `<li><span class="n">#${r.i}</span><span>${trioTexto(r.c.split(''), s.frutas)}</span><b class="${r.x > 0 ? 'pos' : 'neg'}">${r.x > 0 ? 'prêmio ' : ''}${sinal(r.x)}</b></li>`).join('') : '<li class="empty" style="justify-content:center">Nenhum giro ainda.</li>';
  desenharSpark(s, rods);
}
function desenharSpark(s, rods) {
  const ys = [s.saldoInicial, ...rods.map(r => r.b)];
  const W = 320, H = 120, pad = 8;
  const max = Math.max(...ys, s.saldoInicial) * 1.05 || 1, min = 0;
  const X = i => pad + (ys.length === 1 ? 0 : i * (W - 2 * pad) / (ys.length - 1));
  const Y = v => H - pad - (v - min) / (max - min) * (H - 2 * pad);
  const pts = ys.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  $('#spark').innerHTML = `<desc id="spark-desc">Saldo de ${cred(s.saldoInicial)} a ${cred(s.saldo)} em ${rods.length} giros</desc>
    <line x1="${pad}" x2="${W - pad}" y1="${Y(s.saldoInicial)}" y2="${Y(s.saldoInicial)}" stroke="#9A4F33" stroke-dasharray="4 3" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
    <line x1="${pad}" x2="${W - pad}" y1="${Y(0)}" y2="${Y(0)}" stroke="#D5C9B8" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <polyline points="${pts}" fill="none" stroke="#3B5E3C" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
}
$('#btn-girar').addEventListener('click', girar);
$('#btn-encerrar').addEventListener('click', () => { const s = sessaoAtiva(); if (s && !girando) finalizarSessao(s, 'encerrada', true); });
$$('#seg-anim button').forEach(b => b.addEventListener('click', () => {
  DB.config.animacao = b.dataset.anim; salvar();
  $$('#seg-anim button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
  anunciar('Animação: ' + b.textContent + '. A velocidade não altera as chances.');
}));
document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || telaAtual !== 'tela-jogo') return;
  if (document.querySelector('dialog[open]')) return;
  if (e.target.closest('button, input, select, textarea, a, [role=radio]')) return;
  e.preventDefault(); girar();
});
// Grupos de rádio (setas)
function radiosComSetas(sel) {
  const el = $(sel);
  el.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const bs = $$(sel + ' button'); const i = bs.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault(); const n = bs[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length]; n.focus(); n.click();
  });
}
radiosComSetas('#seg-anim'); radiosComSetas('#seg-periodo');

/* ---------- Fim de sessão ---------- */
let sessaoFim = null;
function abrirFim(s) {
  sessaoFim = s;
  const m = metricasTabela(s.tabela), res = s.saldo - s.saldoInicial;
  $('#dlg-fim-t').textContent = s.status === 'esgotada' ? 'Saldo esgotado' : 'Sessão encerrada';
  $('#dlg-fim-ic').textContent = res > 0 ? '🌿' : '🍂';
  $('#dlg-fim-d').textContent = s.status === 'esgotada' ? `${s.jogador}, o saldo ficou abaixo de 1 crédito e a sessão terminou.` : `${s.jogador}, sua sessão foi encerrada.`;
  $('#dlg-fim-stats').innerHTML = `
    <div class="stat"><div class="k">Giros</div><div class="v">${s.giros}</div><div class="s">${s.nPremios} com prêmio</div></div>
    <div class="stat"><div class="k">Saldo final</div><div class="v">${cred(s.saldo)}</div><div class="s">inicial ${cred(s.saldoInicial)}</div></div>
    <div class="stat"><div class="k">Resultado</div><div class="v ${res > 0 ? 'pos' : res < 0 ? 'neg' : ''}">${sinal(res)}</div><div class="s">${res > 0 ? 'ganho' : res < 0 ? 'perda' : 'empate'} na sessão</div></div>
    <div class="stat"><div class="k">Esperado</div><div class="v">${sinal(m.ex * s.giros, v => fmt(v, 1))}</div><div class="s">${fmt(m.ex, 3)} × ${s.giros} giros</div></div>`;
  $('#dlg-fim-edu').textContent = (res > 0
    ? 'Ganhos ocasionais acontecem: a desvantagem desta máquina é em expectativa, não em cada sessão. Repetir sessões tende a aproximar a média por giro de ' + fmt(m.ex, 2) + ' crédito.'
    : 'Esse resultado é compatível com as regras: em média, cada giro devolve ' + pct(m.rtp, 0) + ' do que foi apostado.') + ' Nenhuma sequência anterior muda a chance do próximo giro.';
  $('#dlg-fim').showModal(); $('#fim-nova').focus();
  anunciar($('#dlg-fim-t').textContent + '. Resultado ' + sinal(res) + ' créditos.');
}
$('#fim-nova').addEventListener('click', () => { $('#dlg-fim').close(); jogadorAtual = sessaoFim.jogador; mostrar('tela-saldo'); });
$('#fim-trocar').addEventListener('click', () => { $('#dlg-fim').close(); jogadorAtual = ''; mostrar('tela-nome'); });
$('#fim-sair').addEventListener('click', () => { $('#dlg-fim').close(); mostrar('tela-inicio'); });
$('#dlg-fim').addEventListener('cancel', e => { e.preventDefault(); $('#dlg-fim').close(); mostrar('tela-inicio'); });
