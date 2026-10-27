/* FrutiMania – Leitura e gravação dos dados no localStorage do navegador. */
'use strict';

/* =====================================================================
   3. ARMAZENAMENTO LOCAL
   ===================================================================== */
const CHAVE = 'frutimania.maquinaEstatistica.v1';
let armazenamentoOk = true;
function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) {
      const d = JSON.parse(raw);
      return { config: { ...structuredClone(CONFIG_PADRAO), ...(d.config || {}) }, sessoes: d.sessoes || [], rodadas: d.rodadas || [], ativa: d.ativa || null, seq: d.seq || 0 };
    }
  } catch (e) { armazenamentoOk = false; }
  return { config: structuredClone(CONFIG_PADRAO), sessoes: [], rodadas: [], ativa: null, seq: 0 };
}
let DB = carregar();
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(DB)); armazenamentoOk = true; }
  catch (e) { armazenamentoOk = false; toast('Não foi possível salvar no navegador (armazenamento cheio ou bloqueado). Exporte um backup.'); }
}
