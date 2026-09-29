# Med.na
Aplicação de um sistema de uma clínica médica, onde será feito agendamentos, gerenciamento de horários e etc...


# Stack Tecnológica - Med.na
Bem-vindo à documentação da stack tecnológica do projeto **Med.na**.
Abaixo estão os links para o detalhamento completo de cada camada do sistema:
- **[Frontend](frontend.md)**: Tecnologias de interface de usuário, gerenciamento de estado e
bibliotecas de componentes.
- **[Backend](backend.md)**: Arquitetura do servidor, autenticação, controle de acesso (RBAC) e API
REST.
- **[Banco de Dados](database.md)**: SGBD relacional, ORM, caching e modelagem de dados.
---
## Resumo Geral da Stack
| Camada | Tecnologias Principais
|
| :----------------- |
:----------------------------------------------------------------------------------------- |
| **Frontend** | Next.js (React), TypeScript, Tailwind CSS, Shadcn/UI, React Hook Form, Zod,
TanStack Query |
| **Backend** | Node.js, NestJS / Fastify, TypeScript, Prisma ORM, JWT, OpenAPI / Swagger
|
| **Banco de Dados** | PostgreSQL, Redis, Prisma Migrations
|
---
# Stack do Frontend - Med.na
Documentação detalhada das tecnologias e ferramentas utilizadas na camada de Frontend da aplicação
**Med.na**.
---
## Tecnologias Principais
| Tecnologia | Função / Descrição
|
| :----------------------- |
:------------------------------------------------------------------------
-------------------------------------------------------- |
| **Next.js (React)** | Framework React com suporte a Server-Side Rendering (SSR), Static Site
Generation (SSG) e App Router para alta performance e SEO. |
| **TypeScript** | Superset JavaScript que adiciona tipagem estática, garantindo maior
segurança e facilidade de manutenção no código. |
| **Tailwind CSS** | Framework CSS utilitário para estilização ágil, responsiva e
customizável. |
| **Shadcn/UI & Radix UI** | Biblioteca de componentes acessíveis e customizáveis baseados em
Tailwind
CSS. |
---
## Gerenciamento de Estado e Formulários
| Ferramenta | Utilização
|
| :------------------------------- |
:----------------------------------------------------------------
----------------------------------------- |
| **TanStack Query (React Query)** | Gerenciamento de estado assíncrono, cache de dados e
sincronização com a API backend. |
| **Zustand** | Gerenciamento de estado global leve para armazenar dados da
sessão do usuário e preferências da interface. |
| **React Hook Form** | Manipulação e controle de performance em formulários.
|
| **Zod** | Validação de esquemas e tipos em conjunto com o React Hook Form.
|
---
## Comunicação e Utilitários
- **Axios / Fetch API**: Cliente HTTP para comunicação com os endpoints do Backend.
Stack Tecnológica - Med.na (markdown bruto) Página 2
- **Lucide React**: Biblioteca de ícones modernos e leves.
- **Date-fns / Day.js**: Manipulação e formatação de datas e horários (crucial para o sistema de
agendamento de consultas virtuais).
---
## Testes e Qualidade de Código
- **Vitest / Jest**: Testes unitários de componentes e utilitários.
- **React Testing Library**: Testes de renderização e comportamento de componentes.
- **Playwright / Cypress**: Testes de ponta a ponta (E2E) simulando a jornada do paciente, médico,
funcionário e administrador.
- **ESLint & Prettier**: Padronização e qualidade de código.
---
# Stack de Banco de Dados - Med.na
Documentação detalhada das tecnologias de armazenamento, persistência e gerenciamento de dados da
aplicação **Med.na**.
---
## Banco de Dados Relacional (SGBD)
| Tecnologia | Função / Descrição
|
| :------------- |
:----------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------
------ |
| **PostgreSQL** | Sistema Gerenciador de Banco de Dados Relacional (SGBD) principal, escolhido por
sua confiabilidade, consistência ACID e suporte avançado a dados estruturados e semi-estruturados
(JSONB). |
---
## ORM e Migrações
| Ferramenta | Função / Descrição
|
| :-------------------- |
:---------------------------------------------------------------------------
----------------------------------------------------------------------- |
| **Prisma ORM** | Object-Relational Mapping (ORM) moderno para Node.js/TypeScript.
Proporciona
consultas type-safe, gerenciamento de esquemas declarativos e migrações automatizadas. |
| **Prisma Migrations** | Controle de versão do esquema do banco de dados relacional.
|
---
## Caching e Sessões (In-Memory)
| Tecnologia | Função / Descrição
|
| :--------- |
:--------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------
------------ |
| **Redis** | Armazenamento chave-valor em memória para gerenciamento de sessões, cache de dados
frequentemente acessados (como horários disponíveis de médicos) e controle de taxa de requisições
(rate limiting). |
---
## Modelagem Principal de Dados
O banco de dados relacional gerencia as seguintes entidades e relacionamentos principais:
- **Usuários & Perfis**: Autenticação unificada com papéis (`PATIENT`, `EMPLOYEE`, `DOCTOR`,
`ADMIN`).
- **Médicos & Especialidades**: Vinculação entre profissionais de saúde e suas respectivas
especialidades e locais de atendimento.
Stack Tecnológica - Med.na (markdown bruto) Página 3
- **Consultas & Agendamentos**: Registro completo do ciclo de vida dos agendamentos (status:
agendado,
confirmado, finalizado, cancelado), incluindo suporte a telemedicina.
- **Prontuários Eletrônicos**: Histórico clínico, anamneses, diagnósticos e prescrições por
consulta.
- **Planos de Saúde & Convênios**: Cadastro de operadoras, validação de carteirinhas e verificação
de
cobertura.
---
# Stack do Backend - Med.na
Documentação detalhada das tecnologias e ferramentas utilizadas na camada de Backend da aplicação
**Med.na**.
---
## Tecnologias Principais
| Tecnologia | Função / Descrição
|
| :----------------------------- |
:------------------------------------------------------------------
---------------------------------------------------------------------- |
| **Node.js** | Ambiente de execução JavaScript server-side.
|
| **NestJS / Fastify / Express** | Framework Node.js estruturado em arquitetura modular, com suporte
nativo a TypeScript, Injeção de Dependência e facilidade de manutenção. |
| **TypeScript** | Linguagem principal do backend, assegurando tipagem estática ponta
a ponta. |
---
## Autenticação, Autorização e Segurança
- **JWT (JSON Web Tokens)**: Autenticação stateless baseada em tokens.
- **Bcrypt / Argon2**: Hashing seguro de senhas dos usuários.
- **RBAC (Role-Based Access Control)**: Controle de acesso granular baseado nas 4 funções do sistema
(Paciente, Funcionário, Médico e Administrador).
- **Helmet & CORS**: Camada de proteção de headers HTTP e controle de origem das requisições.
---
## Documentação e Comunicação
- **OpenAPI / Swagger**: Documentação interativa e automatizada de todas as rotas da API REST.
- **Zod / class-validator**: Validação e sanitização de dados de entrada nas requisições (DTOs).
---
## Testes e Qualidade
- **Jest / Vitest**: Framework para execução de testes unitários e de integração.
- **Supertest**: Testes das rotas HTTP da API.
- **ESLint & Prettier**: Garantia das convenções de código e estilo.
