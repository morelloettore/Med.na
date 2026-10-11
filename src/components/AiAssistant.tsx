"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, Bot, User, HelpCircle, Activity, ShieldAlert, PhoneCall, Stethoscope } from "lucide-react";

interface Message {
  sender: "bot" | "user";
  text: string;
  time: string;
}

const FAQ_SUGGESTIONS = [
  "Como agendar consulta presencial ou telemedicina?",
  "Como vincular meu plano / carteirinha de saúde?",
  "Onde consultar prontuário e receita médica ICP-Brasil?",
  "Como utilizar a sala de telemedicina WebRTC?",
  "Onde ver escalas e agenda dos médicos?",
  "Como realizar o check-in na recepção?",
];

export const AiAssistant = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Olá! Sou o Assistente Med.na IA 🤖. Estou aqui para guiar você em todas as áreas do sistema médico hospitalar. Como posso te ajudar hoje?",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");

  if (!isOpen) return null;

  const getAiResponse = (query: string): string => {
    const lower = query.toLowerCase();

    if (lower.includes("emergência") || lower.includes("urgência") || lower.includes("samu") || lower.includes("socorro")) {
      return "⚠️ **IMPORTANTE DE EMERGÊNCIA**: Caso você esteja vivenciando uma emergência médica grave (dor no peito, falta de ar severa ou trauma), ligue imediatamente para o SAMU (192) ou procure o Pronto-Socorro mais próximo!";
    }

    if (lower.includes("agendar") || lower.includes("consulta") || lower.includes("marcar")) {
      return "📅 **Como Agendar Consultas**:\n1. Acesse a 'Área do Paciente'.\n2. Clique no botão 'Agendar Nova Consulta'.\n3. Escolha a especialidade, o médico, a unidade ou opção de Telemedicina.\n4. Selecione o convênio ou atendimento particular e confirme a data/horário disponível.";
    }

    if (lower.includes("plano") || lower.includes("carteirinha") || lower.includes("convênio") || lower.includes("operadora")) {
      return "💳 **Planos e Convênios**:\nPara cadastrar ou vincular um plano de saúde, navegue até a seção 'Minhas Carteirinhas de Convênio' no Portal do Paciente. Digite o nome da operadora e o número da carteirinha. Os atendimentos vinculados serão processados com os benefícios do seu plano!";
    }

    if (lower.includes("prontuário") || lower.includes("receita") || lower.includes("icp") || lower.includes("pdf") || lower.includes("prescrição")) {
      return "📄 **Prontuários e Assinatura Digital ICP-Brasil**:\nTodos os prontuários, atestados e prescrições emitidos pelos médicos no Med.na possuem código HASH SHA-256 e selo de conformidade ICP-Brasil. Você pode visualizá-los e exportá-los em formato PDF na opção 'Prontuários e Documentos'.";
    }

    if (lower.includes("telemedicina") || lower.includes("sala") || lower.includes("vídeo") || lower.includes("chamada") || lower.includes("webrtc")) {
      return "💻 **Sala de Teleconsulta Virtual**:\nA sala de telemedicina do Med.na é nativa e criptografada (WebRTC). Ao chegar o horário agendado, clique em 'Entrar na Teleconsulta Nativa'. Você passará por uma checagem de câmera/microfone antes de se conectar diretamente com o médico!";
    }

    if (lower.includes("medico") || lower.includes("médico") || lower.includes("escala") || lower.includes("horário")) {
      return "🩺 **Portal do Médico e Escalas**:\nMédicos podem visualizar a Agenda Virtual em formatos Mês/Semana/Dia, emitir prontuários com receitas, anexar exames e configurar seus turnos de atendimento no painel 'Escala Médica'.";
    }

    if (lower.includes("recepção") || lower.includes("funcionário") || lower.includes("check-in") || lower.includes("fila")) {
      return "🏢 **Recepção e Funcionários**:\nNa Área do Funcionário, a equipe de recepção pode confirmar chegadas, realizar check-in na fila de espera, validar carteirinhas de convênio e gerenciar os status das consultas em tempo real.";
    }

    if (lower.includes("admin") || lower.includes("administrador") || lower.includes("relatório") || lower.includes("unidade")) {
      return "📊 **Painel Administrativo**:\nAdministradores têm acesso ao Dashboard Executivo de métricas, cadastro de novas unidades hospitalares, especialidades médicas, operadoras de convênio e controle de usuários do sistema.";
    }

    return "🤖 Entendi sua solicitação! O sistema Med.na conta com gestão de consultas, telemedicina, prontuário eletrônico com assinatura digital e suporte a 4 perfis de usuários (Paciente, Médico, Funcionário e Admin). Como posso detalhar mais para você?";
  };

  const handleSend = (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    const userMsg: Message = {
      sender: "user",
      text: messageText,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");

    setTimeout(() => {
      const botAnswer = getAiResponse(messageText);
      const botMsg: Message = {
        sender: "bot",
        text: botAnswer,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[540px] overflow-hidden transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 p-4 text-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Sparkles className="w-5 h-5 text-teal-200" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1">
              Assistente Med.na <span className="text-teal-300 font-black">IA</span>
            </h3>
            <p className="text-[10px] text-teal-100/80 font-semibold tracking-wider uppercase">Suporte Médico Virtual 24/7</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-teal-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50 dark:bg-slate-950/60">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.sender === "bot" && (
              <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                m.sender === "user"
                  ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-none font-medium"
                  : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none"
              }`}
            >
              <p>{m.text}</p>
              <span className="block text-[9px] mt-1.5 text-right opacity-70 font-semibold">{m.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Quick Chips */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        {FAQ_SUGGESTIONS.map((faq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(faq)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-300 rounded-xl shrink-0 border border-slate-200/80 dark:border-slate-700 font-semibold transition-colors"
          >
            {faq}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre agendamento, receitas..."
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
        <button
          type="submit"
          className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
