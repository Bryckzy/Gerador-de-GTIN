Gerador de GTIN 13/14 – Etiquetas em PDF

Uma aplicação desenvolvida em React + TypeScript (Vite) para gerar códigos GTIN-13 e GTIN-14, organizar múltiplas etiquetas e exportá-las em PDF conforme a grade escolhida pelo usuário (ex.: 10 × 5 em folha A4).

O sistema permite adicionar códigos individualmente ou em massa via copiar e colar — ideal para grandes volumes e operações logísticas.

🚀 Funcionalidades
🔢 Geração de GTIN

Criação automática de GTIN-13 e GTIN-14

Cálculo do dígito verificador (checksum)

Edição manual de códigos, quando necessário

📥 Entrada de Dados

Adição individual de GTIN

Importação em massa via copiar/colar (sem CSV)

Detecção e limpeza automática de linhas inválidas

Lista editável com opção de remoção

🖨️ Geração de Etiquetas em PDF

Escolha da grade de impressão (ex.: 10×5 por página A4)

Renderização de:

Código de barras

Valor GTIN abaixo do código

Uso de PDF pronto para impressão (A4 ou layout personalizado)

⚙️ Customização

Quantidade de cópias por item

Tamanho e espaçamento das etiquetas

Formato GTIN (13/14)

Ajuste de margens conforme impressora

🧱 Tecnologias Utilizadas

React + TypeScript

Vite

pdf-lib (ou jsPDF, dependendo da sua implementação)

JsBarcode / bwip-js para geração dos códigos

CSS modular ou TailwindCSS (dependendo da implementação atual)

📦 Instalação
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo
npm install

▶️ Executar o projeto
npm run dev


Aplicação disponível em:

https://gerador-de-gtin.vercel.app

🗂️ Estrutura do Projeto
/components
/utils
App.tsx
index.tsx
index.html
vite.config.ts
tsconfig.json
types.ts
metadata.json
package.json
README.md

🧭 Como Usar

Selecione se vai trabalhar com GTIN-13 ou GTIN-14

Adicione códigos:

Digitando individualmente, ou

Colando vários GTINs de uma só vez (uma linha por código)

Escolha a grade de etiquetas (ex.: 10 × 5 A4)

Clique em Gerar PDF

Baixe ou imprima diretamente o arquivo gerado

🤝 Contribuições

Pull requests são bem-vindos!
Sinta-se à vontade para abrir issues com melhorias, bugs ou novas ideias.

📄 Licença

Distribuído sob a licença MIT.
