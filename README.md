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

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (por exemplo, `frutimania`) e envie estes arquivos para a raiz, com o `index.html` no primeiro nível:
   ```bash
   git init
   git add .
   git commit -m "Interface da Máquina Estatística"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/frutimania.git
   git push -u origin main
   ```
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Source: Deploy from a branch**, depois **Branch: `main`**, pasta **`/ (root)`**, e clique em **Save**.
4. Depois de 1 ou 2 minutos, o site fica disponível em `https://SEU-USUARIO.github.io/frutimania/`.

Se preferir manter tudo no mesmo repositório do notebook, coloque estes arquivos numa pasta `docs/` e escolha a pasta **`/docs`** no passo 3.

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

## Uso de IA

Declarar aqui, conforme a Seção 9 do enunciado, em que a IA ajudou e o que foi conferido pelo grupo.
