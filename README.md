# Gerador de Etiquetas de Código de Barras (GTIN-13 & GTIN-14)

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

Uma aplicação web moderna e eficiente para geração em massa de etiquetas de código de barras. Projetada para atender tanto o varejo (**GTIN-13/EAN**) quanto a logística (**GTIN-14/DUN-14**), oferecendo validação em tempo real e geração de PDFs configuráveis prontos para impressão em folhas A4.

---

## 🚀 Funcionalidades Principais

### 1. Modos de Operação Duplos
O sistema adapta sua interface e validação conforme a necessidade:
*   **Modo Varejo (GTIN-13):** Interface Azul (Indigo). Gera códigos EAN-13 padrão para produtos unitários.
*   **Modo Logística (GTIN-14):** Interface Amarela (Amber). Gera códigos ITF-14 (com bordas de sustentação) para caixas de embarque e pallets.

### 2. Importação Flexível de Dados
*   **Unitário:** Adicione itens um por um com validação imediata do dígito verificador.
*   **Em Massa:** Importe centenas de itens de uma vez copiando e colando de planilhas (Excel/CSV). O sistema identifica automaticamente descrições e códigos válidos no texto.

### 3. Validação Inteligente
*   Algoritmos de verificação de checksum (Módulo 10) específicos para 13 e 14 dígitos.
*   Feedback visual imediato (ícones de sucesso/erro) ao digitar.

### 4. Layout de Impressão Configurável
*   Controle total sobre colunas e linhas por página.
*   Visualização prévia (Preview) da grade A4 em tempo real.
*   Ajuste automático do tamanho da fonte da descrição para caber na etiqueta sem cortes.
*   Predefinições rápidas (ex: 21 etiquetas por página, 40 por página, etc.).

### 5. Privacidade e Performance
*   **Processamento Client-Side:** Todos os dados são processados no navegador do usuário. Nenhuma informação é enviada para servidores externos.
*   Geração de PDF otimizada usando `jspdf`.

---

## 🛠️ Stack Tecnológica

O projeto foi construído utilizando as tecnologias mais modernas do ecossistema React:

*   **Core:** React 19 + TypeScript
*   **Estilização:** Tailwind CSS (Design responsivo e theming dinâmico)
*   **Ícones:** Lucide React
*   **Geração de PDF:** jsPDF
*   **Renderização de Barcodes:** JsBarcode (Suporte a EAN13 e ITF14)
*   **Util:** UUID (Geração de IDs únicos)

---

## 📦 Como Rodar o Projeto

Este projeto utiliza módulos ES e pode ser executado em qualquer ambiente que suporte React.

### Pré-requisitos
*   Node.js (v18 ou superior recomendado)
*   npm ou yarn

### Instalação

1.  Clone o repositório:
    ```bash
    git clone https://github.com/seu-usuario/gerador-etiquetas.git
    cd gerador-etiquetas
    ```

2.  Instale as dependências:
    ```bash
    npm install
    # ou
    yarn install
    ```

3.  Rode o servidor de desenvolvimento:
    ```bash
    npm run dev
    # ou
    yarn dev
    ```

4.  Acesse `http://localhost:5173` no seu navegador.

---

## 📖 Guia de Uso

1.  **Escolha o Tipo de Código:**
    *   No topo da página, selecione entre **GTIN-13** (Varejo) ou **GTIN-14** (Logística). A cor do tema mudará para indicar o modo ativo.

2.  **Adicione Itens:**
    *   Use a aba "Adicionar Unitário" para inserções rápidas.
    *   Use a aba "Importar em Massa" para colar listas no formato `Descrição, Código`.

3.  **Configure o Layout:**
    *   Ajuste o número de colunas e linhas para corresponder à sua folha de etiquetas (ex: Pimaco, Colacril).
    *   Observe o "Preview da Página A4" para garantir que a distribuição está correta.

4.  **Gerar PDF:**
    *   Clique em "Baixar PDF" na lista de itens. O arquivo será gerado e baixado automaticamente.

---

## 🎨 Estrutura do Projeto

```
src/
├── components/
│   ├── BarcodeForm.tsx    # Formulário de entrada (Unitário/Massa)
│   ├── BarcodeList.tsx    # Lista de itens e ações
│   └── LayoutControl.tsx  # Configuração de grade e preview
├── utils/
│   ├── pdfGenerator.ts    # Lógica de renderização do PDF (jsPDF)
│   └── validators.ts      # Algoritmos de validação de GTIN
├── types.ts               # Definições de Tipos TypeScript
├── App.tsx                # Componente Principal e Gestão de Estado
└── index.tsx              # Ponto de entrada
```

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar, modificar e distribuir.

---

Desenvolvido com foco em produtividade e UX.