# App Scholar

Aplicativo mobile desenvolvido com Expo + React Native (TypeScript) e backend em Node.js/Express com PostgreSQL. Projeto educativo para simular fluxos acadêmicos: autenticação, cadastros, visualização de boletim e administração de dados.

## Estado atual (resumo)
- Login com JWT (Alunos, Professores, Administrador via variável de ambiente).
- Tela de **Admin** com visualização dos dados e edição mínima (Alunos, Disciplinas, Notas).
- Tela de visualização adaptativa para **Professor** (ver suas disciplinas e alunos) e **Aluno** (ver seu boletim e dados).
- Professores podem atualizar/inserir notas apenas nas suas disciplinas.
- Tabela `matriculas` adicionada para representar matrícula de aluno em disciplina.
- Scripts para iniciar o Expo forçando o IP LAN (`scripts/expoStartLan.js`) para resolver problemas de conexão do Expo Go.

## Tecnologias
- Expo / React Native
- TypeScript
- React Navigation (Tabs + Stack)
- Node.js / Express
- PostgreSQL (Docker)
- JWT, bcrypt
- Jest + Supertest (testes backend)

## Funcionalidades principais
- Autenticação (JWT) e middleware de autorização (`requireAdmin`, `requireProfessor`, `requireAluno`).
- CRUD básico para `alunos`, `professores`, `disciplinas`, `notas` — admin pode criar/editar registros.
- Visualização por papel: Admin / Professor / Aluno.
- API documentada na prática com rotas em `backend/routes`.

## Como executar (desenvolvimento)

1) Subir o banco (Docker Compose)

```bash
cd backend/database
docker compose up -d
```

Aplicar schema e seeds (no host Windows/PowerShell):

```powershell
Get-Content schema.sql | docker exec -i app-scholar-postgres psql -U postgres -d app_scholar
Get-Content seed.sql | docker exec -i app-scholar-postgres psql -U postgres -d app_scholar
```

2) Backend

```bash
cd backend
npm install
npm run db:init   # popula schema e seeds usando database/initDb.js
npm run dev       # roda server (server.js)
```

Observações:
- Variáveis de ambiente em `backend/.env` (copie de `backend/.env.example`).
- Em desenvolvimento é útil configurar `JWT_SECRET` e `ADMIN_PASSWORD_HASH`.

3) Frontend (Expo)

```bash
npm install
# iniciar expo normalmente
npx expo start
# ou usar o script que força IP LAN quando houver problemas de update remoto
npm run start:lan:8081:clean
```

Scripts úteis (raiz): veja `package.json` e `scripts/expoStartLan.js`.

## Como o admin atualiza um registro (ex.: alterar nome de professor)

Opções:

- Pela UI (app): abra **Dados (Admin)** — há botões "Editar" para registros (Alunos, Disciplinas, Notas). A edição de `Professor` pode ser adicionada à UI se preferir (posso implementar).

- Pela API (exemplo cURL):

1) Obtenha token (login):

```bash
curl -s -X POST http://localhost:3333/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@email.com","senha":"SUA_SENHA"}'
```

2) Atualizar professor (PUT):

```bash
curl -i -X PUT http://localhost:3333/api/professores/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU_TOKEN_AQUI>" \
  -d '{"nome":"Novo Nome","titulacao":"Doutor","area":"Matematica","tempo_docencia":8,"email":"prof@example.com"}'
```

Resposta: JSON com mensagem e o objeto `professor` atualizado.

Rotas importantes (backend):
- `POST /api/login`
- `POST /api/alunos`, `GET /api/alunos`, `PUT /api/alunos/:id` (admin)
- `POST /api/professores`, `GET /api/professores`, `PUT /api/professores/:id` (admin)
- `POST /api/disciplinas`, `GET /api/disciplinas`, `PUT /api/disciplinas/:id` (admin)
- `GET /api/notas`, `PUT /api/notas` (professor), `PUT /api/notas/admin` (admin upsert)

## Testes
- Backend: `cd backend && npm test` (Jest + Supertest). Os testes de integração do backend existem em `backend/__tests__/app.test.js`.
- Frontend: use `npx tsc --noEmit` para checar tipagem.

## Notas de segurança / recomendações rápidas
- Nunca commit secrets: remova `backend/.env` do repositório e use variáveis seguras (Vault / GitHub Secrets) — rotacione `JWT_SECRET` se já vazou.
- Atualize dependências (ver `npm-audit-report.json`) e corrija vulnerabilidades (expo, uuid, etc.).
- Defina limites de payload JSON: `app.use(express.json({ limit: '16kb' }))` no backend para reduzir risco de DoS.
- Aplique rate-limiting também em rotas de criação/atualização sensíveis.
- Use hashes fortes para `ADMIN_PASSWORD_HASH` e evite senhas padrão em produção.

## Estrutura do repositório
Veja a estrutura resumida em `backend/` e `src/` (frontend) — os arquivos de rota e controller estão em `backend/routes` e `backend/controllers`.

## Contribuir
- Abra uma branch por feature e faça PRs pequenos.
- Testes: adicione testes Jest para endpoints novos e mantenha a cobertura das regras de autorização.

---
Projeto criado para estudo e demonstração. Se quiser, eu atualizo o `AdminDataScreen` para incluir edição de `Professores` na UI e adiciono validações/UX adicionais.
