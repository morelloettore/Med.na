"use client";

import React, { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { LogIn, Power, ShieldCheck, HeartPulse, Stethoscope, Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onEnter: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  const [animating, setAnimating] = useState(true);
  const [closedApp, setClosedApp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleExitApp = () => {
    setClosedApp(true);
  };

  if (closedApp) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white select-none">
        <div className="max-w-md space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 shadow-xl">
            <Power className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-200">Aplicação Encerrada</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Sua sessão no Med.na foi finalizada com segurança. Você pode fechar esta aba do navegador ou recarregar a página para reiniciar o sistema.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl text-xs border border-slate-700 transition-colors shadow-lg"
          >
            Reiniciar Sistema Med.na
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-6 text-white select-none">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Intro Animation Layer */}
      {animating ? (
        <div className="flex flex-col items-center justify-center space-y-6 text-center animate-pulse">
          <div className="transform scale-125 transition-all duration-700">
            <Logo variant="full" size="lg" showSubtitle={true} />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400/90 tracking-widest uppercase mt-4">
            <HeartPulse className="w-4 h-4 animate-bounce text-teal-400" />
            Iniciando Plataforma de Saúde Inteligente...
          </div>
        </div>
      ) : (
        /* Welcome Menu Card Layer */
        <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8 animate-fade-in relative z-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Bem-vindo ao Med.na
            </div>

            <div className="flex justify-center py-2">
              <Logo variant="full" size="md" showSubtitle={true} />
            </div>

            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Plataforma integrada de gestão hospitalar, telemedicina nativa criptografada e prontuário eletrônico unificado.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onEnter}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-3 text-sm group"
            >
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              Entrar no Sistema Med.na
            </button>

            <button
              onClick={handleExitApp}
              className="w-full py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-500/30 font-bold rounded-2xl transition-all flex items-center justify-center gap-2.5 text-xs"
            >
              <Power className="w-4 h-4" />
              Sair da Aplicação
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-[11px] text-slate-400 text-center font-medium">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Segurança ICP</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <HeartPulse className="w-4 h-4 text-sky-400" />
              <span>Telemedicina</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <span>Prontuários</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
