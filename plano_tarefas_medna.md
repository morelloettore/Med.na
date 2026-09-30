# 🗂️ Plano de Tarefas - Med.na (ex-Kaukamed)
> Documento de execução para agente de IA. Cada tarefa = 1 unidade de trabalho atômica.
> Regra do agente: **só avance para a próxima tarefa quando a anterior estiver verde nos testes.**

---

## 📐 FASE 0 — Fundação (setup)

- [ ] **0.1 — Monorepo e tooling**
  - Inicializar monorepo (pnpm workspaces ou Turborepo): `apps/web` (Next.js) + `apps/api` (NestJS) + `packages/shared` (tipos/constants compartilhados)
  - TypeScript strict em todos os pacotes
  - ESLint + Prettier configurados com commits padronizados
  - **Aceite:** `pnpm dev` sobe web e api; `pnpm lint` passa sem erros.

- [ ] **0.2 — Variáveis de ambiente**
  - `.env.example` em api (DATABASE_URL, REDIS_URL, JWT_SECRET) e web (NEXT_PUBLIC_API_URL)
  - Validar env com Zod no boot da API (falha rápido se faltar algo)
  - **Aceite:** API não sobe com env inválida e mensagem clara.

- [ ] **0.3 — Docker Compose**
  - Serviços: `postgres:16`, `redis:7`, `api`, `web`
  - **Aceite:** `docker compose up` sobe stack completa funcional.

---

## 🗄️ FASE 1 — Banco de Dados (PostgreSQL + Redis)

- [ ] **1.1 — Prisma setup**
  - Instalar Prisma, apontar para `DATABASE_URL`, criar `schema.prisma` com base no `schema.sql` fornecido
  - Mapear os 4 enums Prisma (`UserRole`, `AppointmentStatus`, `AppointmentMode`, `InsuranceCardStatus`)
  - **Aceite:** `prisma migrate dev` gera migration sem erros; `prisma generate` ok.

- [ ] **1.2 — Seed de dados**
  - Script `prisma/seed.ts`: 1 admin, 2 funcionários, 5 médicos com especialidades, 10 pacientes, 3 convênios, especialidades (Cardiologia, Pediatria, Dermatologia...), agendas recorrentes
  - Senhas hasheadas com Argon2
  - **Aceite:** `pnpm seed` popula banco com dados consistentes (FKs válidas).

- [ ] **1.3 — Redis (cache de disponibilidade)**
  - Módulo `CacheModule`: conexão Redis (ioredis) com healthcheck
  - Key pattern: `availability:{doctorId}:{yyyy-mm-dd}` → slots ocupados (TTL 24h)
  - **Aceite:** teste de integração grava/lê key no Redis.

---

## 🔐 FASE 2 — Autenticação & RBAC (Backend)

- [ ] **2.1 — Módulo Auth: registro e login**
  - `POST /auth/register` (paciente), `POST /auth/login` → `{ accessToken, refreshToken }`
  - Hash Argon2, JWT (access 15min / refresh 7d, refresh rotativo com tabela `refresh_tokens`)
  - **Aceite:** testes unitários (hash/verify) + e2e (login retorna JWT válido).

- [ ] **2.2 — JWT Guard + CurrentUser decorator**
  - `JwtAuthGuard` global + `@Public()` decorator para rotas abertas
  - `@CurrentUser()` extrai `userId` e `role` do token
  - **Aceite:** rota protegida sem token → 401; com token → user injetado.

- [ ] **2.3 — RBAC Guard**
  - `@Roles('DOCTOR', 'ADMIN')` guard de autorização
  - Tabela/verificação de role feita no token (evita query extra)
  - **Aceite:** testes: PATIENT acessa rota de ADMIN → 403.

- [ ] **2.4 — Perfil do usuário**
  - `GET /me` → dados do usuário + perfil (patient/employee/doctor)
  - `PATCH /me` → atualizar telefone/endereço (validação Zod/class-validator)
  - **Aceite:** e2e cobrindo leitura e update.

---

## 👥 FASE 3 — Módulos de Domínio (Backend)

- [ ] **3.1 — Especialidades & Médicos (read)**
  - `GET /specialties` (lista)
  - `GET /doctors?specialtyId=&insuranceId=` (filtros) — incluir agenda do dia
  - **Aceite:** filtros combinados retornam médicos corretos (teste de integração).

- [ ] **3.2 — Agenda do médico (availability engine)**
  - Gerar slots a partir de `doctor_schedules` (weekday/start/end/slot_minutes)
  - Subtrair slots ocupados (`appointments` SCHEDULED/CONFIRMED) + cache Redis
  - `GET /doctors/:id/availability?date=YYYY-MM-DD` → slots livres
  - **Aceite:** médico com agenda 14h–18h, slots 30min, 1 consulta 15h → 7 livres (não 8).

- [ ] **3.3 — Agendamento de consulta**
  - `POST /appointments`: valida slot livre (transação + lock), cria appointment SCHEDULED
  - Conflito de horário → 409; modo TELEMEDICINE gera `telemedicine_url` (UUID)
  - **Aceite:** teste de concorrência — 2 requisições simultâneas, só 1 cria.

- [ ] **3.4 — Ciclo de vida da consulta**
  - `PATCH /appointments/:id/confirm | complete | cancel` (transições válidas: SCHEDULED→CONFIRMED→COMPLETED; →CANCELED de qualquer estado ativo)
  - Cancelamento exige `cancel_reason` + registra `canceled_by/at`
  - **Aceite:** transições inválidas → 422; apenas EMPLOYEE/ADMIN confirma; só DOCTOR completa.

- [ ] **3.5 — Listagens de consultas (por papel)**
  - `GET /appointments` (scope por role: patient vê só as suas; doctor vê as suas; employee/admin vê tudo, com filtros `status`, `date`, paginação)
  - **Aceite:** testes de RBAC em listagem.

- [ ] **3.6 — Convênios**
  - CRUD `health_insurances` (ADMIN) + `GET /insurances` (público)
  - `POST /patients/:id/insurances` vincular carteirinha (valida número único)
  - `GET /insurances/:id/validate?cardNumber=` → ativa/expirada/suspensa
  - **Aceite:** validação de carteirinha expirada retorna EXPIRED.

- [ ] **3.7 — Prontuário eletrônico**
  - `POST /appointments/:id/record` (só DOCTOR da consulta, só se COMPLETED)
  - `GET /patients/:id/records` (DOCTOR/ADMIN; patient vê o próprio resumo)
  - Campos: anamnesis, diagnosis, notes
  - **Aceite:** patient não cria prontuário → 403; record duplicado por consulta → 409.

- [ ] **3.8 — Prescrições**
  - `POST /records/:id/prescriptions` — medications como array validado por Zod
  - `GET /records/:id/prescriptions`
  - **Aceite:** schema de medication inválido → 400; leitura restrita a quem pode ver o prontuário.

---

## 📚 FASE 4 — Documentação & Qualidade (Backend)

- [ ] **4.1 — Swagger/OpenAPI**
  - `@nestjs/swagger` em todas as rotas com DTOs documentados, tags por módulo, auth bearer
  - **Aceite:** `/docs` renderiza todos os endpoints com schemas corretos.

- [ ] **4.2 — Testes de API (Supertest)**
  - Cobertura mínima: auth, RBAC, availability, agendamento (concorrência), ciclo de vida, prontuário
  - **Aceite:** `pnpm test:cov` ≥ 70% nos módulos de domínio.

- [ ] **4.3 — Segurança HTTP**
  - Helmet, CORS restrito (origem do web app), rate limiting (throttler no login)
  - **Aceite:** headers security presentes; login limitado a 5/min/IP.

---

## 🎨 FASE 5 — Frontend (Next.js App Router)

- [ ] **5.1 — Design system base**
  - Tailwind + Shadcn/UI instalados, tema (cores Med.na), layout raiz com fonte
  - **Aceite:** página inicial renderiza componentes Shadcn sem warnings.

- [ ] **5.2 — Cliente HTTP + estado servidor**
  - Axios/fetch wrapper com interceptor de token + refresh automático
  - TanStack Query configurado (staleTime, cache keys por recurso)
  - **Aceite:** chamada autenticada inclui `Authorization: Bearer`.

- [ ] **5.3 — Auth no frontend**
  - Páginas `/login`, `/register` (React Hook Form + Zod)
  - Zustand store de sessão (user, role, tokens) com persist
  - Route guards por role (middleware Next.js redirecionando)
  - **Aceite:** usuário deslogado acessa `/dashboard` → redirect para `/login`.

- [ ] **5.4 — Fluxo do paciente**
  - `/doctors` → busca com filtros (especialidade, convênio)
  - `/doctors/[id]` → calendário de disponibilidade → agendar consulta
  - `/appointments` → lista com status, cancelar (com motivo)
  - **Aceite:** jornada completa e2e (Playwright): login → agendar → ver na lista.

- [ ] **5.5 — Fluxo do médico**
  - `/doctor/schedule` → agenda do dia/semana
  - `/appointments/[id]` → iniciar telemedicina (link) ou concluir presencial
  - `/appointments/[id]/record` → anamnese + diagnóstico + prescrição (medicamentos dinâmicos)
  - **Aceite:** médico conclui consulta e emite prescrição com 2+ medicamentos.

- [ ] **5.6 — Fluxo do funcionário/admin**
  - `/admin/appointments` → confirmar/cancelar, filtro por status/data/doutor
  - CRUD de convênios (`/admin/insurances`), validação de carteirinha
  - `/admin/doctors` → cadastro de médico + especialidades + agenda
  - **Aceite:** funcionário confirma consulta pendente; admin cria convênio.

- [ ] **5.7 — Telemedicina (tela de sala)**
  - `/telemedicine/[token]` → sala simples com link externo (Jitsi Meet embutido ou similar)
  - Acesso restrito: paciente e médico daquela consulta
  - **Aceite:** terceiro usuário com token → 403; token inválido → 404.

---

## 🧪 FASE 6 — E2E & Polimento

- [ ] **6.1 — Playwright por persona**
  - Suites: `patient.spec.ts`, `doctor.spec.ts`, `employee.spec.ts`, `admin.spec.ts`
  - Cenário crítico: agendamento → confirmação → telemedicina → prontuário → prescrição
  - **Aceite:** 4 suites verdes no CI.

- [ ] **6.2 — Tratamento de erros e loading**
  - Toasts de erro/sucesso (sonner), skeletons de loading, empty states
  - **Aceite:** nenhuma tela fica em branco; erro de API exibe mensagem amigável.

- [ ] **6.3 — README + docs de deploy**
  - README raiz: arquitetura, como rodar, variáveis, usuários seed
  - **Aceite:** dev novo sobe o projeto só com o README.

---

## ✅ Definition of Done (global)
1. Código passa em `lint` + `typecheck` + testes da fase
2. Rotas novas documentadas no Swagger
3. Nenhum segredo hardcoded
4. Validação Zod/class-validator em TODO input
5. Queries com Prisma type-safe (sem `as any`)

## ⚠️ Restrições para o agente
- NUNCA inventar campos fora do `schema.prisma` — se precisar, criar migration primeiro
- Sempre checar conflito de agendamento em transação
- RBAC em TODO endpoint (nunca confiar no frontend)
- Respeitar cache Redis: invalidar `availability:*` ao criar/cancelar consulta
