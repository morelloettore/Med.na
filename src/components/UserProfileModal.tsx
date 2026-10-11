"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { X, User as UserIcon, Phone, Mail, Shield, CheckCircle2 } from "lucide-react";

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const { setCurrentUser } = useAuth();
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [phone, setPhone] = useState(user.phone || "");
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...user,
      first_name: firstName,
      last_name: lastName,
      phone,
    };
    setCurrentUser(updated);
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-sky-700 to-blue-600 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <UserIcon className="w-5 h-5 text-sky-200" />
            <h3 className="font-bold text-base">Perfil & Configurações de Conta</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {savedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Informações salvas com sucesso!
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Sobrenome
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              E-mail cadastrado
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-lg p-2.5 text-xs font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Telefone / Whatsapp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Papel / Perfil no Sistema
            </label>
            <span className="inline-block px-3 py-1 bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold text-xs rounded-full border border-sky-200 dark:border-sky-800 uppercase">
              {user.role}
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md mt-2"
          >
            Salvar Alterações do Perfil
          </button>
        </form>
      </div>
    </div>
  );
};
