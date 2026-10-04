# Med.na - Sistema Médico & Gestão Hospitalar

Med.na é uma aplicação web moderna para agendamento de consultas virtuais e presenciais, gestão hospitalar, prontuário eletrônico e controle de convênios médicos.

---

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend / Banco de Dados**: Supabase (PostgreSQL), Criptografia AES/XOR para credenciais públicas
- **Deploy**: GitHub Pages (`output: "export"`) & Vercel

---

## 🔐 Logins de Demonstração para Avaliação (Professores)

A tela de login possui botões de **1 clique** para facilitar a navegação em cada papel do sistema:

| Perfil / Papel | E-mail de Teste | Senha de Teste | O que é possível testar |
|:---|:---|:---|:---|
| **Administrador** | `admin@medna.com` | `admin123` | Cadastro de hospitais, especialidades, convênios e usuários. |
| **Paciente** | `paciente1@medna.com` | `paciente123` | Agendamento de consultas presenciais e telemedicina, gestão de carteirinhas. |
| **Médico** | `maria.santos@medna.com` | `medna123` | Atendimento, preenchimento de prontuário eletrônico e prescrição médica. |
| **Recepção / Funcionário** | `funcionario@medna.com` | `func123` | Confirmação e cancelamento de consultas, fila de atendimento e busca. |

---

## 📋 Registro de Erros e Roadmap (Backlog)

Consulte o arquivo **[Backlog](./Backlog)** na raiz do projeto para visualizar:
1. A lista completa de erros encontrados e corrigidos.
2. Comprovação do nível de funcionamento de **50%+** das funcionalidades ativas.
3. Lista detalhada com o roadmap das etapas pendentes para a aplicação ficar 100% completa.

---

## 🛠️ Como Executar Localmente

```bash
# 1. Instalar dependências
pnpm install

# 2. Executar em modo desenvolvimento
pnpm dev

# 3. Gerar a build de produção (export estático)
pnpm run build
```
