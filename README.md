# Gestão de Ativos e Manutenção

Este é um sistema completo para gestão de ativos, manutenção, controle de estoque e gerenciamento de chamados. Desenvolvido com React, TypeScript, Tailwind CSS e Shadcn/UI no frontend, e Supabase como backend para banco de dados, autenticação e funções de borda.

## Funcionalidades Principais

*   **Gestão de Ativos:** Cadastre, visualize e gerencie todos os ativos da sua empresa, incluindo informações detalhadas, histórico de manutenção e compras.
*   **Controle de Manutenção:** Agende, acompanhe e registre manutenções preventivas, corretivas e preditivas. Utilize um quadro Kanban intuitivo para visualizar o status das manutenções.
*   **Gestão de Estoque:** Monitore o estoque de produtos e peças, com baixa automática ao serem utilizados em manutenções e restauração em caso de cancelamento.
*   **Gestão de Compras:** Registre todas as compras de ativos e produtos, associando-os a ativos específicos ou ao estoque geral.
*   **Chamados de Manutenção:** Permita que usuários externos ou internos abram chamados de manutenção através de um formulário público personalizável. Gerencie esses chamados em um quadro Kanban separado.
*   **Dashboard Inteligente:** Visualize KPIs importantes, gráficos de custos de manutenção e distribuição de ativos. **Novo:** Cards destacados para chamados abertos com contadores em tempo real e navegação rápida.
*   **Perfil de Usuário com Avatar:** **Novo:** Sistema completo de upload de fotos de perfil com validação, preview e exibição na barra superior e sidebar.
*   **Gestão de Departamentos e Usuários:** Organize seus usuários em departamentos e convide novos membros para o sistema.
*   **Configurações Avançadas:** Personalize o perfil do usuário, avatar, logo da empresa, favicon, som de notificação e campos do formulário público de chamados.
*   **Notificações em Tempo Real:** Sistema de notificações com som personalizado e contadores visuais.
*   **Autenticação Segura:** Utiliza o Supabase Auth para gerenciamento de usuários e sessões.

## Tecnologias Utilizadas

*   **Frontend:** React, TypeScript, Vite
*   **Estilização:** Tailwind CSS, Shadcn/UI
*   **Gerenciamento de Estado/Dados:** React Query
*   **Roteamento:** React Router DOM
*   **Backend:** Supabase (Auth, Database, Storage, Edge Functions)
*   **Outros:** Zod (validação de formulários), date-fns (manipulação de datas), Recharts (gráficos), jsPDF (geração de PDF).

## 🆕 Novas Funcionalidades Implementadas

### Sistema de Avatar de Usuário
- **Upload de Fotos:** Interface intuitiva para upload de fotos de perfil com validação de tipo e tamanho
- **Preview em Tempo Real:** Visualização imediata da foto selecionada antes do upload
- **Validação Inteligente:** Suporte para JPG, PNG, GIF e WebP com limite de 5MB
- **Fallback Elegante:** Exibição de iniciais do usuário quando não há foto
- **Integração Completa:** Avatar exibido na barra superior e sidebar do sistema
- **Storage Seguro:** Upload direto para Supabase Storage com políticas RLS configuradas

### Dashboard Inteligente
- **Cards de Alerta:** Notificações destacadas para chamados abertos que requerem atenção
- **Contadores em Tempo Real:** Visualização instantânea de chamados abertos, em andamento e agendados
- **Navegação Rápida:** Botões diretos para gerenciar chamados e acessar funcionalidades
- **Status Visual:** Cores e ícones diferenciados por status dos chamados
- **Design Responsivo:** Adaptação perfeita para desktop e mobile

### Melhorias na Interface
- **Botões Otimizados:** Design mais elegante para ações de edição e exclusão
- **Tema Dark/Light:** Suporte completo para ambos os temas
- **Feedback Visual:** Estados de loading e mensagens de sucesso/erro
- **Acessibilidade:** Melhor suporte para screen readers e navegação por teclado

## Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas:

*   [Node.js](https://nodejs.org/en/) (versão 20 ou superior)
*   [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/) ou [pnpm](https://pnpm.io/)
*   [Git](https://git-scm.com/)
*   [Docker](https://www.docker.com/products/docker-desktop) (opcional, para implantação)
*   Uma conta [Supabase](https://supabase.com/)

## Instalação e Configuração

Siga os passos abaixo para configurar e executar a aplicação.

### 1. Clonar o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd nome-do-seu-projeto
```

### 2. Instalar Dependências

```bash
# Usando npm
npm install

# Ou usando Yarn
yarn install

# Ou usando pnpm
pnpm install
```

### 3. Configurar o Supabase

Você precisará de um projeto Supabase. Se ainda não tiver um, crie um novo no [Supabase Dashboard](https://app.supabase.com/).

#### a. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_SUPABASE_URL="SUA_URL_DO_SUPABASE"
VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_DO_SUPABASE"
```

Você pode encontrar esses valores no seu projeto Supabase em `Settings > API`.

#### b. Migrações do Banco de Dados

As migrações do banco de dados já estão incluídas na pasta `supabase/migrations`. Você pode aplicá-las usando a CLI do Supabase ou copiando e colando o conteúdo dos arquivos `.sql` no SQL Editor do seu projeto Supabase.

**Passos para aplicar via SQL Editor:**
1.  Acesse o [Supabase Dashboard](https://app.supabase.com/).
2.  Selecione seu projeto.
3.  Vá para `SQL Editor`.
4.  Abra cada arquivo `.sql` da pasta `supabase/migrations` em ordem numérica (ex: `0000_...sql`, `0001_...sql`, etc.).
5.  Copie o conteúdo de cada arquivo e execute-o no SQL Editor.

**Certifique-se de que todas as políticas de Row Level Security (RLS) sejam aplicadas conforme definido nas migrações para garantir a segurança dos dados.**

#### c. Configuração de Storage (Armazenamento)

Para o upload de logos da empresa e avatares de usuários, você precisará configurar buckets de armazenamento:

**Bucket para Logos da Empresa:**
1.  No Supabase Dashboard, vá para `Storage`.
2.  Crie um novo bucket chamado `company_assets`.
3.  Defina as políticas de acesso para este bucket. As migrações já incluem políticas para permitir upload e download de arquivos públicos.

**Bucket para Avatares de Usuários:**
1.  Crie um segundo bucket chamado `avatars`.
2.  Configure as políticas RLS para permitir que usuários autenticados façam upload de seus próprios avatares.
3.  As migrações incluem políticas automáticas para este bucket.

**Nota:** Os buckets são criados automaticamente pelas migrações do banco de dados, mas você pode verificar se foram criados corretamente no Supabase Dashboard.

#### d. Edge Functions

A aplicação utiliza uma Edge Function para convidar usuários.

1.  No Supabase Dashboard, vá para `Edge Functions`.
2.  Crie uma nova função chamada `invite-user`.
3.  Copie o conteúdo do arquivo `supabase/functions/invite-user/index.ts` para a função.
4.  Certifique-se de que as variáveis de ambiente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estejam configuradas como segredos para a Edge Function. Elas são geralmente configuradas automaticamente pelo Supabase, mas verifique em `Edge Functions > Manage Secrets`.

### 4. Executar a Aplicação Localmente

```bash
# Iniciar o servidor de desenvolvimento
npm run dev
# ou yarn dev
# ou pnpm dev
```

A aplicação estará disponível em `http://localhost:8080` (ou outra porta, se configurada).

## 🚀 Como Usar as Novas Funcionalidades

### Upload de Avatar
1. **Acesse Configurações:** Vá para o menu lateral e clique em "Configurações"
2. **Abra a aba Perfil:** Selecione a aba "Perfil" nas configurações
3. **Adicione sua foto:** Clique em "Adicionar" na seção de foto do perfil
4. **Selecione uma imagem:** Escolha uma foto (JPG, PNG, GIF ou WebP até 5MB)
5. **Confirme o upload:** A foto será enviada automaticamente e aparecerá na barra superior

### Dashboard Inteligente
1. **Visualize chamados abertos:** O dashboard mostra automaticamente cards de alerta quando há chamados pendentes
2. **Acesse rapidamente:** Use os botões "Ver Chamados" para ir direto à gestão de chamados
3. **Monitore status:** Acompanhe contadores em tempo real de chamados abertos, em andamento e agendados
4. **Navegação intuitiva:** Clique nos cards para acessar funcionalidades específicas

### Personalização Avançada
1. **Logo da empresa:** Configure o logo na aba "Identidade Visual" das configurações
2. **Favicon personalizado:** Faça upload de um favicon personalizado
3. **Som de notificação:** Configure um som personalizado para notificações
4. **Campos customizados:** Adicione campos personalizados ao formulário público de chamados

### 5. Implantação com Docker (Opcional)

Para implantar a aplicação em um servidor VPS usando Docker:

#### a. Construir a Imagem Docker

No diretório raiz do projeto, execute, **passando as variáveis de ambiente do Supabase como argumentos de build**:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="SUA_URL_DO_SUPABASE" \
  --build-arg VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_DO_SUPABASE" \
  -t seu-app-react .
```

Substitua `seu-app-react` pelo nome que você deseja dar à sua imagem e preencha com suas chaves do Supabase.

#### b. Executar o Contêiner Docker

Após a construção, você pode executar seu aplicativo:

```bash
docker run -d -p 80:80 seu-app-react
```

Isso iniciará o contêiner em segundo plano (`-d`) e mapeará a porta 80 do seu contêiner para a porta 80 do seu host.

#### c. Acessar a Aplicação

Seu aplicativo estará acessível no navegador em `http://localhost` (ou no IP do seu VPS, se estiver executando lá).

### 6. Implantação com Easypanel

O Easypanel simplifica a implantação de aplicações Docker. Siga estes passos:

1.  **Crie um novo serviço no Easypanel:**
    *   No seu painel Easypanel, clique em "Add New Service".
    *   Selecione "Docker" como o tipo de serviço.

2.  **Configure o repositório Git:**
    *   Conecte seu repositório Git (GitHub, GitLab, etc.) onde seu código está hospedado.
    *   Selecione o branch que deseja implantar (ex: `main` ou `master`).

3.  **Configurações de Build:**
    *   **Build Type:** Selecione "Dockerfile".
    *   **Dockerfile Path:** Mantenha o padrão `./Dockerfile` (assumindo que seu `Dockerfile` está na raiz do projeto).
    *   **Build Context:** Mantenha o padrão `./`.

4.  **Configurações de Rede:**
    *   **Port:** Defina a porta como `80`. Seu `Dockerfile` e `nginx.conf` já estão configurados para expor e servir na porta 80.

5.  **Variáveis de Ambiente (Build Time):**
    *   **IMPORTANTE:** Adicione as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na seção de variáveis de ambiente do Easypanel e certifique-se de que elas estejam configuradas para serem usadas no **Build Time**.
    *   Certifique-se de que esses valores correspondam aos do seu projeto Supabase.

6.  **Implantação:**
    *   Após configurar, o Easypanel fará o pull do seu código, construirá a imagem Docker usando o `Dockerfile` e implantará o serviço.
    *   Monitore os logs de build e implantação no Easypanel para garantir que tudo ocorra sem erros.

Com essas configurações, seu aplicativo será implantado e estará acessível através do domínio configurado no Easypanel.

## 📋 Changelog

### Versão 2.0.0 - Outubro 2025

#### ✨ Novas Funcionalidades
- **Sistema de Avatar de Usuário**
  - Upload de fotos de perfil com validação
  - Preview em tempo real
  - Exibição na barra superior e sidebar
  - Fallback com iniciais do usuário
  - Storage seguro no Supabase

- **Dashboard Inteligente**
  - Cards de alerta para chamados abertos
  - Contadores em tempo real
  - Navegação rápida para gestão de chamados
  - Status visual com cores e ícones

#### 🎨 Melhorias na Interface
- Botões de ação otimizados
- Suporte aprimorado para temas dark/light
- Feedback visual melhorado
- Acessibilidade aprimorada

#### 🔧 Melhorias Técnicas
- Configuração automática de buckets de storage
- Políticas RLS otimizadas
- Validação de upload aprimorada
- Performance melhorada

---

Esperamos que este guia ajude você a configurar e usar o sistema de Gestão de Ativos e Manutenção!