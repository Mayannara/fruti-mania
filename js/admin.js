/* FrutiMania – Painel do administrador: métricas, regras, histórico, jogadores e dados. Inicializa a aplicação. */
'use strict';

/* =====================================================================
   7. ADMINISTRADOR
   ===================================================================== */
let telaAntesAdmin = 'tela-inicio', periodo = 'tudo', abaAdmin = 'tab-visao', pagina = 0, rascunho = null;
$('#btn-admin').addEventListener('click', () => {
  if (telaAtual === 'tela-admin') return;
  if (girando) return;
  $('#inp-pin').value = ''; $('#pin-erro').textContent = ''; $('#inp-pin').removeAttribute('aria-invalid');
  $('#dlg-pin').showModal(); $('#inp-pin').focus();
});
$('#pin-cancel').addEventListener('click', () => $('#dlg-pin').close());
$('#form-pin').addEventListener('submit', e => {
  e.preventDefault();
  if ($('#inp-pin').value === String(DB.config.pin)) {
    $('#dlg-pin').close(); telaAntesAdmin = telaAtual === 'tela-saida' ? 'tela-inicio' : telaAtual; rascunho = null; mostrar('tela-admin');
  } else { $('#pin-erro').textContent = 'PIN incorreto.'; $('#inp-pin').setAttribute('aria-invalid', 'true'); $('#inp-pin').select(); }
});
$('#btn-admin-sair').addEventListener('click', () => {
  const destino = (telaAntesAdmin === 'tela-jogo' && !sessaoAtiva()) ? 'tela-inicio' : telaAntesAdmin;
  mostrar(destino);
});

// Abas acessíveis
const ABAS = ['tab-visao', 'tab-regras', 'tab-hist', 'tab-jog', 'tab-dados'];
function ativarAba(id, foco = false) {
  abaAdmin = id;
  ABAS.forEach(t => {
    const b = $('#' + t), sel = t === id;
    b.setAttribute('aria-selected', String(sel)); b.tabIndex = sel ? 0 : -1;
    $('#' + b.getAttribute('aria-controls')).hidden = !sel;
  });
  if (foco) $('#' + id).focus();
  renderAba();
}
ABAS.forEach(t => $('#' + t).addEventListener('click', () => ativarAba(t)));
$('#tabs').addEventListener('keydown', e => {
  const i = ABAS.indexOf(document.activeElement.id); if (i < 0) return;
  let n = null;
  if (e.key === 'ArrowRight') n = (i + 1) % ABAS.length; else if (e.key === 'ArrowLeft') n = (i + ABAS.length - 1) % ABAS.length;
  else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = ABAS.length - 1;
  if (n !== null) { e.preventDefault(); ativarAba(ABAS[n], true); }
});
$$('#seg-periodo button').forEach(b => b.addEventListener('click', () => {
  periodo = b.dataset.p; pagina = 0;
  $$('#seg-periodo button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
  renderAba();
}));

function inicioPeriodo() {
  if (periodo === 'hoje') return dia(Date.now());
  if (periodo === '7d') return dia(Date.now()) - 6 * 864e5;
  return 0;
}
function rodadasPeriodo() { const t0 = inicioPeriodo(); return DB.rodadas.filter(r => r.t >= t0); }
function sessoesPeriodo() { const t0 = inicioPeriodo(); return DB.sessoes.filter(s => s.inicio >= t0 || (s.fim || Date.now()) >= t0); }

function renderAdmin() {
  $$('#seg-periodo button').forEach(x => x.setAttribute('aria-checked', String(x.dataset.p === periodo)));
  ativarAba(abaAdmin);
}
function renderAba() {
  if (abaAdmin === 'tab-visao') renderVisao();
  if (abaAdmin === 'tab-regras') renderRegras();
  if (abaAdmin === 'tab-hist') renderHist();
  if (abaAdmin === 'tab-jog') renderJogadores();
  if (abaAdmin === 'tab-dados') renderDados();
}

/* ---------- Visão geral ---------- */
function renderVisao() {
  const rods = rodadasPeriodo(), ses = sessoesPeriodo();
  const apostado = rods.length * APOSTA, pago = rods.reduce((a, r) => a + r.p, 0), casa = apostado - pago;
  const nPrem = rods.filter(r => r.p > 0).length;
  const esperadoCasa = rods.reduce((a, r) => a + (APOSTA - r.ep), 0);
  const mAtual = metricasTabela(DB.config.tabela);
  const sesComGiro = ses.filter(s => s.giros > 0).length || 1;
  $('#kpis').innerHTML = `
    <div class="kpi"><span class="k">Total apostado</span><span class="v">${cred(apostado)}</span><span class="s">créditos fictícios (entradas)</span></div>
    <div class="kpi"><span class="k">Total pago em prêmios</span><span class="v">${cred(pago)}</span><span class="s">RTP observado: <b>${apostado ? pct(pago / apostado * 100, 1) : '–'}</b> (tabela atual ${pct(mAtual.rtp, 1)})</span></div>
    <div class="kpi hero ${casa < 0 ? 'loss' : ''}"><span class="k">${casa >= 0 ? 'Lucro da casa' : 'Perda da casa'}</span><span class="v">${sinal(casa)}</span><span class="s">${apostado ? `${casa >= 0 ? 'margem' : 'déficit'} de ${pct(Math.abs(casa) / apostado * 100, 1)} do apostado · esperado ${sinal(esperadoCasa, v => fmt(v, 1))}` : 'sem giros no período'}</span></div>
    <div class="kpi"><span class="k">Total de giros</span><span class="v">${nf(0).format(rods.length)}</span><span class="s">${fmt(rods.length / sesComGiro, 1)} giros por sessão · ${ses.length} ${ses.length === 1 ? 'sessão' : 'sessões'}</span></div>
    <div class="kpi"><span class="k">Frequência de prêmio</span><span class="v">${rods.length ? pct(nPrem / rods.length * 100, 2) : '–'}</span><span class="s">${nPrem} ${nPrem === 1 ? 'giro premiado' : 'giros premiados'} · teórica ${pct(mAtual.pPremio * 100, 0)}</span></div>`;
  desenharAcumulado(rods);
  desenharDias();
  // distribuição de saldos
  const cont = {}; ses.forEach(s => cont[s.saldoInicial] = (cont[s.saldoInicial] || 0) + 1);
  const total = ses.length;
  const cores = ['#4A7347', '#B88235', '#BC6C4D', '#253D26', '#8A7B6A', '#D49B44'];
  const chaves = Object.keys(cont).map(Number).sort((a, b) => a - b);
  $('#dist-saldos').innerHTML = total ? `
    <div style="display:flex;height:14px;border-radius:7px;overflow:hidden;background:var(--surface-3)" aria-hidden="true">${chaves.map((k, i) => `<div style="width:${cont[k] / total * 100}%;background:${cores[i % cores.length]}"></div>`).join('')}</div>
    <ul class="history" style="margin-top:10px;max-height:none">${chaves.map((k, i) => `<li><span style="display:flex;gap:8px;align-items:center"><i class="sw box" style="background:${cores[i % cores.length]}"></i>Saldo inicial ${cred(k)}</span><b>${cont[k]} ${cont[k] === 1 ? 'sessão' : 'sessões'} · ${pct(cont[k] / total * 100, 0)}</b></li>`).join('')}</ul>` : '<p class="empty">Nenhuma sessão no período.</p>';
  // integridade
  const freq = { A: 0, B: 0, C: 0, D: 0, E: 0 }; rods.forEach(r => r.c.split('').forEach(l => freq[l]++));
  const tot = rods.length * 3;
  $('#integridade').innerHTML = (tot ? SIMBOLOS.map(l => {
    const f = freq[l] / tot * 100;
    return `<div class="freq-row"><span>${fruta(l).emo} ${l}</span><div class="bar-bg" role="img" aria-label="${l}: ${pct(f, 1)} observado, referência 20%"><div class="bar-fg" style="width:${Math.min(100, f / 40 * 100)}%"></div><div class="bar-ref" style="left:50%"></div></div><b style="text-align:right">${pct(f, 1)}</b></div>`;
  }).join('') + `<p class="note">Barra = frequência observada em ${nf(0).format(tot)} células centrais; traço vertical = 20%. A escala vai de 0% a 40%.</p>` : '<p class="empty">Sem giros no período.</p>') +
    `<p class="note">Verificações: probabilidades somam 125/125 = 1 · ${rods.every(r => r.p === pagamento(r.c.split(''), (DB.sessoes.find(s => s.id === r.s) || {}).tabela || DB.config.tabela)) ? '✔ todos os pagamentos registrados conferem com a tabela da sessão' : '✖ há pagamentos que não conferem'} · ${rods.every(r => Math.abs(r.x - (r.p - APOSTA)) < 1e-9) ? '✔ lucro = prêmio − 1 em todos os giros' : '✖ lucro inconsistente'}.</p>`;
}
function desenharAcumulado(rods) {
  const svg = $('#chart-acum'), W = 640, H = 260, L = 56, R = 14, T = 14, B = 34;
  if (!rods.length) { svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="#5C5247" font-size="14">Sem giros no período</text>`; $('#acum-note').textContent = ''; return; }
  let o = 0, e = 0; const obs = [0], esp = [0];
  rods.forEach(r => { o += APOSTA - r.p; e += APOSTA - r.ep; obs.push(o); esp.push(e); });
  const n = obs.length - 1, lo = Math.min(0, ...obs, ...esp), hi = Math.max(1, ...obs, ...esp);
  const X = i => L + i * (W - L - R) / Math.max(1, n), Y = v => T + (hi - v) / (hi - lo || 1) * (H - T - B);
  const ticks = 4, grid = [];
  for (let i = 0; i <= ticks; i++) { const v = lo + (hi - lo) * i / ticks; grid.push(`<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#E2D9CC"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#5C5247">${fmt(v, Math.abs(hi - lo) < 10 ? 1 : 0)}</text>`); }
  const linha = arr => arr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  svg.innerHTML = `<desc id="chart-acum-desc">Resultado acumulado da casa: observado ${sinal(o)} e esperado ${sinal(e, v => fmt(v, 1))} após ${n} giros.</desc>${grid.join('')}
    <line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="#8A7B6A" stroke-width="1"/>
    <polyline points="${linha(esp)}" fill="none" stroke="#241C15" stroke-width="1.6" stroke-dasharray="6 4"/>
    <polyline points="${linha(obs)}" fill="none" stroke="#3B5E3C" stroke-width="2.4" stroke-linejoin="round"/>
    <text x="${L}" y="${H - 10}" font-size="11" fill="#5C5247">giro 1</text><text x="${W - R}" y="${H - 10}" font-size="11" fill="#5C5247" text-anchor="end">giro ${nf(0).format(n)}</text>
    <text x="${(L + W - R) / 2}" y="${H - 10}" font-size="11" fill="#5C5247" text-anchor="middle">giros no período (créditos no eixo vertical)</text>`;
  $('#acum-note').textContent = `Após ${nf(0).format(n)} giros: observado ${sinal(o)} crédito(s) para a casa; esperado ${sinal(e, v => fmt(v, 1))}. A diferença (${sinal(o - e, v => fmt(v, 1))}) é variação amostral: prêmios raros e altos fazem o resultado oscilar em torno da tendência.`;
}
function desenharDias() {
  const hoje = dia(Date.now()), dias = [];
  for (let i = 6; i >= 0; i--) {
    const d0 = hoje - i * 864e5; const rs = DB.rodadas.filter(r => r.t >= d0 && r.t < d0 + 864e5);
    dias.push({ d0, ap: rs.length * APOSTA, pr: rs.reduce((a, r) => a + r.p, 0) });
  }
  const svg = $('#chart-dias'), W = 420, H = 220, L = 40, B = 28, T = 10, R = 8;
  const max = Math.max(1, ...dias.map(d => Math.max(d.ap, d.pr)));
  const cw = (W - L - R) / 7, bw = cw * 0.32;
  const Y = v => T + (1 - v / max) * (H - T - B);
  let g = '';
  for (let i = 0; i <= 3; i++) { const v = max * i / 3; g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#E2D9CC"/><text x="${L - 5}" y="${Y(v) + 4}" font-size="10" text-anchor="end" fill="#5C5247">${fmt(v, 0)}</text>`; }
  dias.forEach((d, i) => {
    const x = L + i * cw + cw / 2, nome = new Date(d.d0).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
    g += `<rect x="${x - bw - 1}" y="${Y(d.ap)}" width="${bw}" height="${H - B - Y(d.ap)}" rx="2" fill="#3B5E3C"><title>Apostado: ${cred(d.ap)}</title></rect>
          <rect x="${x + 1}" y="${Y(d.pr)}" width="${bw}" height="${H - B - Y(d.pr)}" rx="2" fill="#BC6C4D"><title>Prêmios: ${cred(d.pr)}</title></rect>
          <text x="${x}" y="${H - 10}" font-size="10" text-anchor="middle" fill="${i === 6 ? '#253D26' : '#5C5247'}" font-weight="${i === 6 ? 700 : 400}">${nome}</text>`;
  });
  svg.innerHTML = `<desc id="chart-dias-desc">Apostado e prêmios nos últimos 7 dias; valores na tabela abaixo.</desc>` + g;
  $('#tab-dias').innerHTML = `<thead><tr><th scope="col">Dia</th><th scope="col" class="num">Apostado</th><th scope="col" class="num">Prêmios</th><th scope="col" class="num">Resultado da casa</th></tr></thead><tbody>` +
    dias.map(d => { const c = d.ap - d.pr; return `<tr><td>${new Date(d.d0).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td><td class="num">${cred(d.ap)}</td><td class="num">${cred(d.pr)}</td><td class="num ${c > 0 ? 'pos' : c < 0 ? 'neg' : ''}">${c > 0 ? 'lucro ' : c < 0 ? 'perda ' : ''}${sinal(c)}</td></tr>`; }).join('') + '</tbody>';
}

/* ---------- Regras ---------- */
function renderRegras() {
  if (!rascunho) rascunho = structuredClone(DB.config);
  const r = rascunho;
  $('#cfg-s0').value = r.saldos[0]; $('#cfg-s1').value = r.saldos[1]; $('#cfg-s2').value = r.saldos[2]; $('#cfg-smax').value = r.saldoMax;
  $$('input[name=cfg-seed-modo]').forEach(x => x.checked = x.value === r.sementeModo);
  $('#cfg-seed').value = r.sementeFixa; $('#cfg-seed').disabled = r.sementeModo !== 'fixa';
  $('#cfg-pin').value = '';
  const opts = l => Object.entries(FRUTAS).map(([id, f]) => `<option value="${id}" ${r.frutas[l] === id ? 'selected' : ''}>${f.emo} ${f.nome}</option>`).join('');
  $('#pay-edit tbody').innerHTML = SIMBOLOS.map(l => `<tr>
      <th scope="row" style="font-size:1rem;color:var(--ink)">${l}–${l}–${l}</th>
      <td><label class="sr-only" for="fr-${l}">Fruta da letra ${l}</label><select class="input" id="fr-${l}" data-l="${l}">${opts(l)}</select></td>
      <td><label class="sr-only" for="pg-${l}">Prêmio do trio ${l}</label><input class="input" id="pg-${l}" data-l="${l}" type="number" min="0" max="10000" step="0.5" value="${r.tabela[l]}"></td>
      <td class="num" id="x-${l}"></td><td class="num" id="c-${l}"></td></tr>`).join('');
  $$('#pay-edit select').forEach(s => s.addEventListener('change', () => { r.frutas[s.dataset.l] = s.value; validarRegras(); }));
  $$('#pay-edit input').forEach(i => i.addEventListener('input', () => { r.tabela[i.dataset.l] = i.value === '' ? NaN : Number(i.value); atualizarMetricasRegras(); }));
  atualizarMetricasRegras();
}
function atualizarMetricasRegras() {
  const r = rascunho; const ok = SIMBOLOS.every(l => Number.isFinite(r.tabela[l]) && r.tabela[l] >= 0);
  SIMBOLOS.forEach(l => { const p = r.tabela[l]; $('#x-' + l).textContent = Number.isFinite(p) ? sinal(p - 1) : '–'; $('#c-' + l).textContent = Number.isFinite(p) ? fmt(p / 125, 3) : '–'; });
  if (!ok) { $('#metricas-regras').innerHTML = ''; $('#regras-veredito').textContent = ''; validarRegras(); return; }
  const m = metricasTabela(r.tabela);
  $('#metricas-regras').innerHTML = `
    <div class="stat"><div class="k">Chance de prêmio</div><div class="v">${pct(m.pPremio * 100, 1)}</div><div class="s">trios que pagam / 125</div></div>
    <div class="stat"><div class="k">Prêmio esperado E[P]</div><div class="v">${fmt(m.ep, 3)}</div><div class="s">soma dos prêmios / 125</div></div>
    <div class="stat"><div class="k">RTP</div><div class="v">${pct(m.rtp, 2)}</div><div class="s">E[P] / aposta</div></div>
    <div class="stat"><div class="k">E[X] do jogador</div><div class="v ${m.ex < 0 ? 'neg' : m.ex > 0 ? 'pos' : ''}">${sinal(m.ex, v => fmt(v, 3))}</div><div class="s">por giro</div></div>
    <div class="stat"><div class="k">Vantagem da casa</div><div class="v">${pct(m.vantagem, 2)}</div><div class="s">1 − RTP</div></div>
    <div class="stat"><div class="k">Desvio-padrão DP(X)</div><div class="v">${fmt(m.dp, 3)}</div><div class="s">dispersão por giro</div></div>`;
  const ver = m.rtp < 100 - 1e-9 ? ['terra', 'Desfavorável ao jogador em expectativa: a casa tem vantagem.'] : m.rtp > 100 + 1e-9 ? ['gold', 'Favorável ao jogador em expectativa: a casa teria prejuízo esperado.'] : ['moss', 'Neutro: esperança zero para jogador e casa.'];
  $('#regras-veredito').innerHTML = `<span class="badge ${ver[0]}">${m.rtp < 100 ? 'RTP < 100%' : m.rtp > 100 ? 'RTP > 100%' : 'RTP = 100%'}</span> ${ver[1]} Mudar pagamentos altera o RTP sem mudar a chance de prêmio.`;
  validarRegras();
}
function validarRegras() {
  const r = rascunho, erros = [];
  if (!SIMBOLOS.every(l => Number.isFinite(r.tabela[l]) && r.tabela[l] >= 0 && r.tabela[l] <= 10000)) erros.push('Os prêmios devem ser números entre 0 e 10.000.');
  if (new Set(SIMBOLOS.map(l => r.frutas[l])).size !== 5) erros.push('Cada letra precisa de uma fruta diferente.');
  $('#regras-erro').textContent = erros.join(' ');
  return erros.length === 0;
}
$$('[data-preset]').forEach(b => b.addEventListener('click', () => { rascunho.tabela = { ...TABELAS_PRONTAS[b.dataset.preset] }; renderRegras(); anunciar('Tabela ' + b.textContent + ' carregada. Clique em salvar para aplicar.'); }));
$$('input[name=cfg-seed-modo]').forEach(x => x.addEventListener('change', () => { rascunho.sementeModo = x.value; $('#cfg-seed').disabled = x.value !== 'fixa'; }));
$('#btn-descartar').addEventListener('click', () => { rascunho = null; renderRegras(); toast('Alterações descartadas.'); });
$('#btn-restaurar').addEventListener('click', () => {
  const pin = rascunho.pin; rascunho = structuredClone(CONFIG_PADRAO); rascunho.pin = pin; rascunho.animacao = DB.config.animacao;
  renderRegras(); toast('Padrões carregados (tabela base, RTP 84%). Clique em Salvar para aplicar.');
});
$('#btn-salvar').addEventListener('click', () => {
  const r = rascunho;
  const saldos = ['#cfg-s0', '#cfg-s1', '#cfg-s2'].map(s => Number($(s).value)); const smax = Number($('#cfg-smax').value);
  const seed = Number($('#cfg-seed').value); const pin = $('#cfg-pin').value.trim();
  const erros = [];
  if (!validarRegras()) erros.push($('#regras-erro').textContent);
  if (!saldos.every(v => Number.isInteger(v) && v >= 1 && v <= 100000) || new Set(saldos).size !== 3) erros.push('Saldos: três inteiros diferentes entre 1 e 100.000.');
  if (!Number.isInteger(smax) || smax < 1 || smax > 100000) erros.push('Máximo de saldo inválido.');
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) erros.push('Semente deve ser inteira entre 0 e 4.294.967.295.');
  if (pin && !/^\d{4,8}$/.test(pin)) erros.push('PIN deve ter de 4 a 8 dígitos.');
  if (erros.length) { $('#regras-erro').textContent = erros.join(' '); $('#regras-erro').scrollIntoView({ block: 'center' }); return; }
  r.saldos = saldos.sort((a, b) => a - b); r.saldoMax = Math.max(smax, ...r.saldos); r.sementeFixa = seed; if (pin) r.pin = pin;
  r.animacao = DB.config.animacao;
  DB.config = structuredClone(r); salvar(); rascunho = null; renderRegras();
  toast(sessaoAtiva() ? 'Regras salvas. Valem a partir da próxima sessão (a sessão em andamento mantém sua tabela).' : 'Regras salvas. Valem a partir da próxima sessão.');
});

/* ---------- Histórico ---------- */
const POR_PAG = 15;
function renderHist() {
  const jogs = [...new Set(DB.rodadas.map(r => r.j))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const atual = $('#f-jog').value;
  $('#f-jog').innerHTML = '<option value="">Todos</option>' + jogs.map(j => `<option ${j === atual ? 'selected' : ''}>${esc(j)}</option>`).join('');
  const f = $('#f-jog').value;
  const rods = rodadasPeriodo().filter(r => !f || r.j === f).slice().reverse();
  const pags = Math.max(1, Math.ceil(rods.length / POR_PAG)); pagina = Math.min(pagina, pags - 1);
  const pg = rods.slice(pagina * POR_PAG, (pagina + 1) * POR_PAG);
  const sesMap = Object.fromEntries(DB.sessoes.map(s => [s.id, s]));
  $('#tab-rod').innerHTML = `<caption class="sr-only">Giros registrados, do mais recente ao mais antigo</caption><thead><tr><th scope="col">Sessão</th><th scope="col">Jogador</th><th scope="col" class="num">Giro</th><th scope="col">Paradas K</th><th scope="col">Linha central</th><th scope="col" class="num">Prêmio P</th><th scope="col" class="num">Lucro X</th><th scope="col" class="num">Saldo</th><th scope="col">Situação</th><th scope="col">Data/hora</th></tr></thead><tbody>` +
    (pg.length ? pg.map(r => `<tr><td>${r.s}</td><td>${esc(r.j)}</td><td class="num">${r.i}</td><td>${r.k.join(', ')}</td><td>${trioTexto(r.c.split(''), (sesMap[r.s] || {}).frutas)}</td><td class="num">${cred(r.p)}</td><td class="num ${r.x > 0 ? 'pos' : 'neg'}">${sinal(r.x)}</td><td class="num">${cred(r.b)}</td><td>${r.p > 0 ? '<span class="badge moss">✔ prêmio</span>' : '<span class="badge terra">✖ sem prêmio</span>'}</td><td>${dataHora(r.t)}</td></tr>`).join('') : '<tr><td colspan="10" class="empty">Nenhum giro no período.</td></tr>') + '</tbody>';
  $('#pg-info').textContent = `${nf(0).format(rods.length)} giro(s) · página ${pagina + 1} de ${pags}`;
  $('#pg-prev').disabled = pagina === 0; $('#pg-next').disabled = pagina >= pags - 1;
}
$('#f-jog').addEventListener('change', () => { pagina = 0; renderHist(); });
$('#pg-prev').addEventListener('click', () => { pagina--; renderHist(); });
$('#pg-next').addEventListener('click', () => { pagina++; renderHist(); });

/* ---------- Jogadores e sessões ---------- */
function renderJogadores() {
  const rods = rodadasPeriodo(), por = {};
  rods.forEach(r => { const o = por[r.j] || (por[r.j] = { giros: 0, ap: 0, pr: 0, np: 0, ses: new Set() }); o.giros++; o.ap += APOSTA; o.pr += r.p; if (r.p > 0) o.np++; o.ses.add(r.s); });
  const lista = Object.entries(por).sort((a, b) => b[1].giros - a[1].giros);
  $('#tab-jog').innerHTML = `<thead><tr><th scope="col">Jogador</th><th scope="col" class="num">Sessões</th><th scope="col" class="num">Giros</th><th scope="col" class="num">Apostado</th><th scope="col" class="num">Prêmios</th><th scope="col" class="num">Resultado do jogador</th><th scope="col" class="num">RTP observado</th><th scope="col" class="num">Freq. prêmio</th></tr></thead><tbody>` +
    (lista.length ? lista.map(([j, o]) => { const res = o.pr - o.ap; return `<tr><td>${esc(j)}</td><td class="num">${o.ses.size}</td><td class="num">${o.giros}</td><td class="num">${cred(o.ap)}</td><td class="num">${cred(o.pr)}</td><td class="num ${res > 0 ? 'pos' : res < 0 ? 'neg' : ''}">${res > 0 ? 'ganho ' : res < 0 ? 'perda ' : ''}${sinal(res)}</td><td class="num">${pct(o.pr / o.ap * 100, 1)}</td><td class="num">${pct(o.np / o.giros * 100, 1)}</td></tr>`; }).join('') : '<tr><td colspan="8" class="empty">Nenhum jogador no período.</td></tr>') + '</tbody>';
  const ses = sessoesPeriodo().slice().reverse();
  const st = { ativa: '<span class="badge gold">● em andamento</span>', encerrada: '<span class="badge moss">■ encerrada</span>', esgotada: '<span class="badge terra">▼ saldo esgotado</span>' };
  $('#tab-ses').innerHTML = `<thead><tr><th scope="col">Sessão</th><th scope="col">Jogador</th><th scope="col">Início</th><th scope="col" class="num">Saldo inicial</th><th scope="col" class="num">Saldo final</th><th scope="col" class="num">Giros</th><th scope="col" class="num">RTP da tabela</th><th scope="col" class="num">Semente</th><th scope="col">Situação</th></tr></thead><tbody>` +
    (ses.length ? ses.map(s => `<tr><td>${s.id}</td><td>${esc(s.jogador)}</td><td>${dataHora(s.inicio)}</td><td class="num">${cred(s.saldoInicial)}</td><td class="num">${cred(s.saldo)}</td><td class="num">${s.giros}</td><td class="num">${pct(metricasTabela(s.tabela).rtp, 1)}</td><td class="num">${s.semente}</td><td>${st[s.status]}</td></tr>`).join('') : '<tr><td colspan="9" class="empty">Nenhuma sessão no período.</td></tr>') + '</tbody>';
}

/* ---------- Dados ---------- */
function renderDados() {
  let bytes = 0; try { bytes = (localStorage.getItem(CHAVE) || '').length * 2; } catch (e) { armazenamentoOk = false; }
  $('#armaz').innerHTML = `
    <div class="stat"><div class="k">Sessões</div><div class="v">${DB.sessoes.length}</div></div>
    <div class="stat"><div class="k">Giros</div><div class="v">${nf(0).format(DB.rodadas.length)}</div></div>
    <div class="stat"><div class="k">Jogadores</div><div class="v">${new Set(DB.sessoes.map(s => s.jogador)).size}</div></div>
    <div class="stat"><div class="k">Espaço usado</div><div class="v">${fmt(bytes / 1024, 0)} KB</div><div class="s">limite típico ≈ 5 MB</div></div>`;
  $('#armaz-status').textContent = armazenamentoOk ? '✔ Armazenamento local disponível; os dados são salvos a cada giro.' : '✖ Este navegador bloqueou o armazenamento local (ex.: janela anônima). Os dados valem só até fechar a página; exporte um backup.';
}
function baixar(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo }); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function csv(linhas) { return '﻿' + linhas.map(l => l.map(v => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n'); }
$('#btn-csv-rod').addEventListener('click', () => {
  const f = $('#f-jog').value; const rods = rodadasPeriodo().filter(r => !f || r.j === f);
  baixar('giros_frutimania.csv', csv([['sessao', 'jogador', 'giro', 'k1', 'k2', 'k3', 'centro', 'premio_P', 'lucro_X', 'saldo_apos', 'E_P_tabela', 'data_hora_iso'],
    ...rods.map(r => [r.s, r.j, r.i, ...r.k, r.c.split('').join('-'), r.p, r.x, r.b, r.ep, new Date(r.t).toISOString()])]), 'text/csv;charset=utf-8');
});
$('#btn-csv-ses').addEventListener('click', () => {
  baixar('sessoes_frutimania.csv', csv([['sessao', 'jogador', 'inicio_iso', 'fim_iso', 'saldo_inicial', 'saldo_final', 'giros', 'apostado', 'premios', 'giros_premiados', 'semente', 'gerador', 'RTP_tabela_%', 'tabela_A_B_C_D_E', 'situacao'],
    ...sessoesPeriodo().map(s => [s.id, s.jogador, new Date(s.inicio).toISOString(), s.fim ? new Date(s.fim).toISOString() : '', s.saldoInicial, s.saldo, s.giros, s.apostado, s.premios, s.nPremios, s.semente, 'MT19937 (compatível com random.Random do Python)', metricasTabela(s.tabela).rtp, SIMBOLOS.map(l => s.tabela[l]).join('/'), s.status])]), 'text/csv;charset=utf-8');
});
$('#btn-json').addEventListener('click', () => {
  const copia = structuredClone(DB); copia.exportadoEm = new Date().toISOString(); copia.versao = 1;
  baixar('backup_frutimania.json', JSON.stringify(copia, null, 2), 'application/json');
});
$('#inp-import').addEventListener('change', async e => {
  const arq = e.target.files[0]; if (!arq) return;
  try {
    const d = JSON.parse(await arq.text());
    if (!Array.isArray(d.sessoes) || !Array.isArray(d.rodadas) || typeof d.config !== 'object') throw new Error('formato');
    confirmar('Importar backup?', `O arquivo tem ${d.sessoes.length} sessões e ${d.rodadas.length} giros. Os dados atuais deste navegador serão substituídos.`, () => {
      DB = { config: { ...structuredClone(CONFIG_PADRAO), ...d.config }, sessoes: d.sessoes, rodadas: d.rodadas, ativa: d.ativa || null, seq: d.seq || d.sessoes.length };
      rng = null; rngSessao = null; salvar(); renderAba(); toast('Backup importado.');
    });
  } catch (err) { toast('Arquivo inválido: não é um backup da FrutiMania.'); }
  e.target.value = '';
});
$('#btn-limpar').addEventListener('click', () => confirmar('Apagar sessões e giros?', 'Todo o histórico deste navegador será apagado (a configuração das regras é mantida). Esta ação não pode ser desfeita; exporte um backup antes, se precisar.', () => {
  DB.sessoes = []; DB.rodadas = []; DB.ativa = null; DB.seq = 0; rng = null; rngSessao = null; salvar(); renderAba(); toast('Histórico apagado.');
}));
let acaoConfirmar = null;
function confirmar(titulo, texto, acao) { $('#dlg-c-t').textContent = titulo; $('#dlg-c-d').textContent = texto; acaoConfirmar = acao; $('#dlg-confirm').showModal(); $('#c-cancel').focus(); }
$('#c-ok').addEventListener('click', () => { $('#dlg-confirm').close(); if (acaoConfirmar) acaoConfirmar(); acaoConfirmar = null; });
$('#c-cancel').addEventListener('click', () => { $('#dlg-confirm').close(); acaoConfirmar = null; });

/* Sincroniza entre abas do navegador */
window.addEventListener('storage', e => { if (e.key === CHAVE) { DB = carregar(); rng = null; if (telaAtual === 'tela-admin') renderAba(); } });

/* Início */
renderCarretel([4, 0, 2]);
mostrar('tela-inicio');
$('#main').blur();
