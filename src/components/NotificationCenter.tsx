"use client";

import React, { useState } from "react";
import { AppNotification } from "@/types";
import {
  Bell,
  X,
  CheckCircle2,
  Calendar,
  Video,
  FileText,
  AlertCircle,
  Trash2
} from "lucide-react";

const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    user_id: "all",
    title: "Consulta Agendada",
    message: "Sua consulta com Dr(a). Maria Santos foi agendada para hoje às 14:00.",
    type: "APPOINTMENT",
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "notif-2",
    user_id: "all",
    title: "Telemedicina Disponível",
    message: "A sala virtual da sua teleconsulta já está pronta para uso.",
    type: "TELEMEDICINE",
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "notif-3",
    user_id: "all",
    title: "Nova Receita Emitida",
    message: "Você possui uma prescrição médica assinada digitalmente (ICP-Brasil).",
    type: "PRESCRIPTION",
    read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(DEMO_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Central de Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-600" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Notificações ({unreadCount})
              </h4>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                Marcar lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhuma notificação por enquanto.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex gap-3 text-xs transition-colors ${
                    !n.read ? "bg-sky-50/50 dark:bg-sky-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.type === "APPOINTMENT" && <Calendar className="w-4 h-4 text-sky-600" />}
                    {n.type === "TELEMEDICINE" && <Video className="w-4 h-4 text-emerald-600" />}
                    {n.type === "PRESCRIPTION" && <FileText className="w-4 h-4 text-purple-600" />}
                    {n.type === "SYSTEM" && <AlertCircle className="w-4 h-4 text-amber-600" />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 dark:text-white">{n.title}</span>
                      <button
                        onClick={() => clearNotification(n.id)}
                        className="text-slate-400 hover:text-red-500 text-[10px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug">{n.message}</p>
                    <span className="block text-[9px] text-slate-400">
                      {new Date(n.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
