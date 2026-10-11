"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, Bot, User, HelpCircle, Activity } from "lucide-react";

interface Message {
  sender: "bot" | "user";
  text: string;
  time: string;
}

const FAQ_SUGGESTIONS = [
  "Como agendar uma consulta presencial ou por telemedicina?",
  "Como vincular meu plano de saúde / carteirinha?",
  "Onde acesso o prontuário eletrônico e a receita médica?",
  "Como funciona a sala virtual de telemedicina?",
];

export const AiAssistant = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Olá! Sou o Assistente Virtual Med.na IA 🤖. Como posso ajudar você hoje no sistema de gestão clínica?",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");

  if (!isOpen) return null;

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

    // Simulate AI Smart Reply based on query
    setTimeout(() => {
      let botAnswer = "Entendi sua dúvida! O Med.na é uma plataforma integrada. Você pode navegar pelo menu superior para acessar as áreas de agendamentos, planos de saúde ou prontuários.";
      const lower = messageText.toLowerCase();

      if (lower.includes("agendar") || lower.includes("consulta")) {
        botAnswer = "Para agendar uma consulta: Acesse a aba 'Agendar Consulta' na Área do Paciente, escolha a especialidade, médico, convênio e modalidade (Presencial ou Telemedicina) e confirme o horário livre.";
      } else if (lower.includes("plano") || lower.includes("carteirinha") || lower.includes("convênio")) {
        botAnswer = "Para adicionar um convênio: Vá em 'Planos & Convênios', escolha sua operadora e preencha o número da carteirinha. Você poderá usá-la imediatamente para isentar valores de consultas.";
      } else if (lower.includes("prontuário") || lower.includes("receita") || lower.includes("pdf")) {
        botAnswer = "Prontuários e prescrições médicas possuem Assinatura Digital ICP-Brasil e validação por QR Code! Podem ser gerados e baixados em PDF a qualquer momento na consulta realizada.";
      } else if (lower.includes("telemedicina") || lower.includes("sala") || lower.includes("vídeo")) {
        botAnswer = "A Telemedicina do Med.na é nativa com suporte WebRTC! Ao chegar o horário da consulta, clique em 'Entrar na Teleconsulta Nativa' para abrir a sala virtual criptografada.";
      }

      const botMsg: Message = {
        sender: "bot",
        text: botAnswer,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-700 to-blue-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sky-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Assistente Med.na IA</h3>
            <p className="text-[10px] text-sky-100 font-medium">Suporte Inteligente 24/7</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-sky-100 hover:text-white rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.sender === "bot" && (
              <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 text-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                m.sender === "user"
                  ? "bg-sky-600 text-white rounded-br-none"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none"
              }`}
            >
              <p>{m.text}</p>
              <span className="block text-[9px] mt-1 text-right opacity-70">{m.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Quick Chips */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        {FAQ_SUGGESTIONS.map((faq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(faq)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-200 rounded-full shrink-0 border border-slate-200 dark:border-slate-600 transition-colors"
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
        className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte ao assistente sobre o sistema..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          className="p-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
