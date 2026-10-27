# Interface acessível – FrutiMania (extra da Seção 10)

## Como executar
- **Online:** publique a pasta no GitHub Pages (passo a passo no `README.md`) e abra o link do site.
- **No computador:** abra o `index.html` em um navegador atual (Chrome, Edge, Firefox ou Safari). Não precisa de servidor nem de instalação. Sem internet, só as fontes trocam para as do sistema.
- **Jogo:** Passo 1 (deseja jogar?) → Passo 2 (nome) → Passo 3 (saldo fictício) → máquina.
- **Administrador:** link "Área do administrador" no rodapé. O PIN padrão é `1234` e pode ser trocado na aba Regras.
- **Dados:** ficam salvos no próprio navegador (localStorage) a cada giro. Na aba Dados do painel há exportação para CSV e JSON, importação de backup e limpeza.

## Fidelidade ao modelo do enunciado (Seção 5)
- O rolo é circular, com 5 símbolos (A–E), e cada parada K tem chance 1/5. A janela mostra R[K], R[(K+1) mod 5] e R[(K+2) mod 5].
- Só a linha central é avaliada, e só paga com três símbolos iguais. A aposta é fixa em 1 crédito. Não há bônus, multiplicadores nem mudança de chances. O resultado é sorteado antes da animação, e a velocidade da animação não altera as chances.
- A semente é iniciada uma única vez por sessão e fica registrada. O gerador é o Mersenne Twister (MT19937), implementado de forma equivalente ao `random.Random` do Python. Isso foi conferido com 30.000 sorteios de `randint(0, 4)` em 7 sementes, todos idênticos. Com a semente fixa 2026, a interface reproduz exatamente o Experimento 1 do notebook (lucro médio de −0,1315 em 10.000 giros).
- O administrador só altera os pagamentos, as frutas de cada letra, os saldos oferecidos, a semente e o PIN. O RTP, o E[X], a vantagem da casa e o DP(X) são recalculados na hora e valem a partir da próxima sessão.

## Recursos de acessibilidade
| Requisito do extra | Como foi atendido |
|---|---|
| Interação por teclado | Todo o fluxo funciona com Tab, Enter e Espaço. Espaço gira a máquina. As abas do painel usam setas, Home e End. Os seletores de animação e de período usam setas. Há um link "Pular para o conteúdo". Os diálogos (`<dialog>`) prendem o foco e fecham com Esc. Ao trocar de tela, o foco vai para o título. |
| Contraste adequado | Todos os pares de cor de texto atingem pelo menos 4,5:1 (WCAG 2.1 AA). Tabela abaixo. |
| Informação que não depende só de cor | Resultados mostram ✔/✖ e as palavras "prêmio" ou "sem prêmio". Valores têm sinal (+/−) e as palavras "lucro", "perda" ou "ganho". Cada fruta aparece com sua letra (A–E) e seu nome. A linha central tem contorno e legenda escrita. As situações das sessões têm ícone e texto. |
| Leitores de tela | Uma região `aria-live` anuncia cada resultado ("Sem prêmio. Linha central: Maçã B, Uva D, Banana A. Saldo 16"). O tabuleiro tem descrição textual. Os gráficos têm `<desc>`, e o balanço diário também aparece como tabela. Os campos têm rótulos e mensagens de erro associadas. |
| Movimento | Respeita `prefers-reduced-motion` e oferece a opção "Sem animação". |
| Responsividade | O layout se adapta de 320 px a desktop. As tabelas largas rolam dentro do próprio quadro, sem rolagem horizontal da página. |

### Contraste (razão calculada pela fórmula da WCAG)
| Uso | Cores | Razão |
|---|---|---|
| Texto principal | #241C15 sobre #FAF7F2 | 15,7:1 |
| Texto secundário | #5C5247 sobre #FAF7F2 | 7,1:1 |
| Texto secundário em card | #5C5247 sobre #F2ECE1 | 6,5:1 |
| Verde musgo (títulos) | #253D26 sobre #FAF7F2 | 11,1:1 |
| Verde musgo (valores) | #3B5E3C sobre #F2ECE1 | 6,3:1 |
| Branco sobre botão verde | #FFFFFF sobre #3B5E3C | 7,4:1 |
| Branco sobre destaque do painel | #FFFFFF sobre #253D26 | 11,8:1 |
| Terracota (perdas) em alerta | #9A4F33 sobre #F5E3DA | 4,8:1 |
| Terracota (perdas) | #9A4F33 sobre #FAF7F2 | 5,6:1 |
| Mostarda (valores) | #7E5414 sobre #F2ECE1 | 5,6:1 |
| Contorno de foco | #7E5414 sobre #F7F4EE | 6,0:1 |

## Verificação de uso realizada
O teste foi automatizado com Playwright (Chromium) em duas telas: desktop (1366 × 900) e celular (375 × 780).

1. **Somente teclado:** do carregamento até "Sim, quero jogar" usando Tab e Enter. Em seguida, nome e saldo foram digitados e o giro foi feito com Espaço. ✔
2. **Validação de formulários:** o nome vazio mostrou "Digite um nome com 2 a 24 caracteres." e o campo foi marcado com `aria-invalid`. O saldo "outro valor = 30" foi aceito. ✔
3. **Jogo:** 14 giros. Saldo, resultado, esperado, frequência e RTP da sessão foram atualizados. ✔
4. **Persistência:** a página foi recarregada no meio da sessão. Apareceu "Continuar sessão de Maya", com os mesmos 14 giros e o gerador retomando a mesma sequência. ✔
5. **Encerramento:** o diálogo de fim de sessão mostrou o resultado e o valor esperado. ✔
6. **Administrador:** o PIN errado foi recusado e o correto (1234) liberou o painel. A tabela +10% mostrou RTP de 92,40% e E[X] de −0,076, conferindo com o E5. A semente fixa 2026 foi salva, e os 10 primeiros lucros da nova sessão foram [−1, −1, 4, −1, −1, −1, −1, −1, −1, −1], iguais aos do notebook. ✔
7. **Auditoria automática com axe-core 4.10** (regras WCAG 2.0 A/AA e 2.1 AA): **0 violações** nas telas de início, nome, saldo e jogo e nas 5 abas do painel. Uma violação encontrada na primeira rodada, uma lista rolável sem foco por teclado, foi corrigida. ✔
8. **Layout:** sem rolagem horizontal da página nas duas larguras. ✔
9. **Erros de JavaScript:** nenhum. Os únicos avisos foram as fontes externas, bloqueadas de propósito para simular uso sem internet. ✔

## Limitações
- O PIN do administrador é uma proteção didática, não um mecanismo de segurança. O código-fonte e o localStorage podem ser lidos por quem usa o computador.
- Os dados ficam só no navegador em que o jogo foi usado. Janelas anônimas ou a limpeza de dados do site apagam o histórico, e o painel avisa quando o armazenamento está indisponível.
- A verificação foi automatizada. Um teste com usuários reais e leitores de tela (NVDA ou VoiceOver) complementaria a avaliação.
