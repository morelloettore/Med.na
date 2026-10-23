"use client";

import React from "react";
import { X, ShieldCheck, Lock, FileText, CheckCircle2 } from "lucide-react";

interface LegalDocsModalProps {
  docType: "PRIVACY" | "TERMS" | "ICP_BRASIL" | null;
  onClose: () => void;
}

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({ docType, onClose }) => {
  if (!docType) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {docType === "PRIVACY" && (
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="p-2.5 bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Política de Privacidade & LGPD</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Proteção integral de dados de saúde no sistema Med.na</p>
              </div>
            </div>

            <div className="text-xs leading-relaxed space-y-3">
              <p>
                <strong>1. Tratamento de Dados de Saúde (LGPD):</strong> O Med.na coleta e armazena apenas as informações estritamente necessárias para a prestação dos serviços médicos e gestão clínica (CPF, histórico de consultas, carteirinhas de convênios e prontuários eletrônicos).
              </p>
              <p>
                <strong>2. Sigilo Médico e Criptografia:</strong> As transmissões de áudio, vídeo e chat da Telemedicina são criptografadas de ponta a ponta via protocolos WebRTC. Nenhum fluxo de mídia da teleconsulta é gravado nos servidores da plataforma.
              </p>
              <p>
                <strong>3. Controle de Acesso por Perfil (RBAC):</strong> O acesso às suas informações de saúde é estritamente isolado. Pacientes acessam apenas seus próprios agendamentos e documentos; médicos visualizam a prontuários apenas dos pacientes sob seus cuidados; e a recepção gerencia dados operacionais para check-in e convênios.
              </p>
              <p>
                <strong>4. Direitos do Titular:</strong> O paciente pode consultar seus dados, solicitar exportação de prescrições e prontuários em formato PDF e alterar dados cadastrais a qualquer momento na Área do Paciente.
              </p>
            </div>
          </div>
        )}

        {docType === "TERMS" && (
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="p-2.5 bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Termos de Uso da Plataforma</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Regras de agendamento, atendimento e cancelamento</p>
              </div>
            </div>

            <div className="text-xs leading-relaxed space-y-3">
              <p>
                <strong>1. Agendamento e Horários:</strong> As consultas presenciais e por telemedicina no Med.na são marcadas em tempo real. O sistema valida os horários disponíveis impedindo agendamentos em horários passados ou em duplicidade para o mesmo médico ou paciente.
              </p>
              <p>
                <strong>2. Regra de Cancelamento (48h):</strong> Conforme a política da clínica, cancelamentos de consultas devem ser realizados com no mínimo <strong>2 dias (48 horas) de antecedência</strong> na Área do Paciente. Para urgências após este prazo, o paciente deve contatar a recepção.
              </p>
              <p>
                <strong>3. Cadastro e Aprovação de Perfis Profissionais:</strong> Perfis de Médicos, Funcionários e Administradores passam por análise e aprovação prévia para ativação da conta, garantindo a autenticidade e responsabilidade dos profissionais cadastrados.
              </p>
              <p>
                <strong>4. Convênios Credenciados:</strong> Os atendimentos vinculados a planos de saúde exigem validação do número da carteirinha ativa no sistema antes da realização da consulta.
              </p>
            </div>
          </div>
        )}

        {docType === "ICP_BRASIL" && (
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="p-2.5 bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Padrão Telemedicina & Assinatura ICP-Brasil</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Validade jurídica de receitas e prontuários eletrônicos</p>
              </div>
            </div>

            <div className="text-xs leading-relaxed space-y-3">
              <p>
                <strong>1. Assinatura Digital do Médico:</strong> Todos os prontuários, receitas médicas e prescrições de medicamentos emitidos pelos médicos da clínica Med.na recebem carimbo de data/hora oficial e código HASH criptográfico SHA-256 compatível com certificados digitais ICP-Brasil.
              </p>
              <p>
                <strong>2. Validade em Farmácias e Unidades de Saúde:</strong> As receitas emitidas no portal contêm detalhamento de posologia, registro CRM do médico e código de verificação autenticável em todo o território nacional.
              </p>
              <p>
                <strong>3. Acesso do Paciente:</strong> Após o encerramento da consulta médica pelo profissional, o documento assinado fica imediatamente disponível para visualização e download na aba &quot;Minhas Consultas&quot; do paciente.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs transition-colors shadow-md"
        >
          Compreendido e Fechar
        </button>
      </div>
    </div>
  );
};
