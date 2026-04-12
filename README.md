# App Scholar

Aplicativo mobile desenvolvido com React Native + Expo para simulacao de fluxos academicos: autenticacao, dashboard de modulos, cadastros e consulta de boletim.

## Objetivo

Entregar uma base funcional e organizada para evolucao de um sistema escolar mobile, focando em UI/UX, componentizacao e uso de hooks.

## Tecnologias

- Expo
- React Native
- TypeScript
- React Navigation (Native Stack + Bottom Tabs)
- Hooks: useState, useEffect, useContext

## Funcionalidades implementadas

- Login com validacao de campos obrigatorios
- Autenticacao simulada com bloqueio da tela de login apos autenticar
- Dashboard com atalhos para os modulos principais
- Cadastro de Alunos
- Cadastro de Professores
- Cadastro de Disciplinas
- Consulta de Boletim com dados mockados e carregamento simulado
- Componentes reutilizaveis de interface (botao, input, card, container)

## Credenciais de acesso (mock)

- Email/Login: admin@email.com
- Senha: 123

## Estrutura do projeto

```text
/src
  /components
    AppButton.tsx
    AppInput.tsx
    DashboardCard.tsx
    ScreenContainer.tsx
  /context
    AuthContext.tsx
  /hooks
    useFormFields.ts
  /navigation
    AppNavigator.tsx
    types.ts
  /screens
    DashboardScreen.tsx
    LoginScreen.tsx
    ReportCardScreen.tsx
    StudentRegistrationScreen.tsx
    SubjectRegistrationScreen.tsx
    TeacherRegistrationScreen.tsx
  /services
    authService.ts
    mockData.ts
  /styles
    index.ts
    theme.ts
```

## Como executar

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar o projeto

```bash
npx expo start
```

### 3. Rodar em plataforma especifica (opcional)

```bash
npm run android
npm run ios
npm run web
```

## Fluxo de navegacao

1. O app inicia na tela de Login.
2. Com credenciais validas, o usuario e autenticado.
3. A navegacao muda para a area principal com abas.
4. O Dashboard permite acesso direto aos modulos.

## Validacoes e feedback visual

- Campos obrigatorios com mensagens de erro por input
- Alertas de sucesso nas acoes de submissao
- Estados de carregamento na autenticacao e no boletim
- Feedback visual em botoes com efeito de toque

## Dados mockados

Os dados sao simulados localmente em services:

- authService.ts: autenticacao fake
- mockData.ts: itens do boletim

## Comandos uteis

```bash
npx tsc --noEmit
```

Usado para validar tipagem TypeScript sem gerar build.

## Melhorias sugeridas

- Persistencia local (AsyncStorage)
- Integracao com API real
- Mascaras de campos (telefone, CEP)
- Validacoes avancadas (email, formatos numericos)
- Logout com confirmacao
- Testes de componentes e navegacao

## Licenca

Projeto de estudo e demonstracao.
