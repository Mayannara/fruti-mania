# FrutiMania – Máquina Estatística

Interface do simulador acadêmico do Trabalho I de Probabilidade e Estatística I (IFES – Campus Serra). É uma máquina de rolos didática, com regras públicas e **somente créditos fictícios**: 5 símbolos, só a linha central paga, aposta de 1 crédito e RTP de 84% na tabela base.

## Estrutura

```
index.html                 telas (início, nome, saldo, jogo e painel do administrador)
css/style.css              estilos (tons terrosos e verde musgo, responsivo)
js/gerador.js              gerador Mersenne Twister, equivalente ao random.Random do Python
js/modelo.js               regras do modelo: rolo, janela, pagamento, RTP e E[X]
js/armazenamento.js        gravação dos dados no localStorage
js/utils.js                formatação, avisos e acessibilidade
js/jogo.js                 fluxo do jogador, sessão, giros e animação
js/admin.js                painel do administrador e inicialização
favicon.svg                ícone da aba
.nojekyll                  faz o GitHub Pages servir os arquivos sem processamento
VERIFICACAO_INTERFACE.md   verificação de uso e de acessibilidade
```

Os scripts são carregados em ordem no fim do `index.html`, e cada um usa funções dos anteriores. Não há etapa de build nem dependências: os arquivos são servidos exatamente como estão.

## Rodar no computador

Basta abrir o `index.html` no navegador. Para simular o GitHub Pages localmente:

```bash
python -m http.server 8000
# acesse http://localhost:8000
```

## Uso

- **Jogador:** "Deseja jogar?" → nome → saldo inicial em créditos → máquina (botão GIRAR ou tecla Espaço).
- **Administrador:** link no rodapé, com PIN padrão `1234`. O painel tem lucro e perda da casa, tabela de pagamentos com RTP calculado na hora, semente fixa ou automática, histórico de giros, jogadores e exportação em CSV e JSON.
- **Dados:** ficam no navegador de quem usa o site (localStorage). Cada visitante tem seus próprios dados, e nada é enviado a servidor.

Com a semente fixa 2026, a sequência de giros é a mesma do Experimento 1 do notebook.

## Declaração de uso de Inteligência Artificial

Este trabalho contou com o apoio do assistente de IA **Claude (Anthropic)**, usado como ferramenta de apoio à programação e à revisão. 
As decisões sobre o modelo, a interpretação dos resultados e o texto do relatório são do grupo.

### Em que a IA ajudou

- **Revisão do notebook:** comparou o código com os requisitos obrigatórios do enunciado
  e apontou o que faltava (exibição de uma rodada, aviso de créditos fictícios, exportação
  em CSV, registro do ambiente, conferência da reprodução no E2, reutilização dos resultados
  do E1 no E5).
- **Interface web:** gerou o código HTML, CSS e JavaScript a partir do protótipo de tela
  feito pelo grupo, incluindo o painel do administrador, o salvamento local e a versão
  para celular, e realizou testes automáticos de acessibilidade.

### O que o grupo conferiu
- Executamos o notebook do início ao fim no Google Colab e confirmamos que os resultados
  batem com os valores de referência do enunciado (E[X] = −0,16, RTP = 84%, chance de
  prêmio = 4%, RTP de 92,4% na tabela +10%).
- Refizemos à mão os cálculos de probabilidade, esperança e RTP da Seção 6.
- Verificamos os totais exigidos: 10.000 contagens no E1, 100 participantes no E3 e
  9.999 pares no E4.
- Testamos a interface: fluxo do jogador, painel do administrador, uso só com teclado e
  versão para celular. Também conferimos que a semente 2026 reproduz os mesmos resultados
  do Experimento 1.
- Lemos e discutimos o código para que todos os integrantes consigam explicá-lo.

### O que não foi feito com IA
- O protótipo de tela, a escolha do tema e das cores.
- A interpretação dos experimentos e a discussão crítica do relatório.
- A pesquisa e a leitura das fontes citadas
- Decisões de comportamento do protótipo


