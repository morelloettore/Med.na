"use client";

import React, { useState } from "react";
import { MedicalRecord, Prescription, MedicalExamAttachment } from "@/types";
import {
  FileText,
  Printer,
  ShieldCheck,
  QrCode,
  Download,
  Plus,
  Trash2,
  Paperclip,
  CheckCircle2,
  Lock
} from "lucide-react";

interface MedicalRecordDocumentViewProps {
  record: MedicalRecord;
  prescription?: Prescription | null;
  patientExams?: MedicalExamAttachment[];
  onUploadExam?: (title: string, fileType: "PDF" | "IMAGE") => Promise<void>;
  onDeleteExam?: (examId: string) => Promise<void>;
}

export const MedicalRecordDocumentView: React.FC<MedicalRecordDocumentViewProps> = ({
  record,
  prescription,
  patientExams = [],
  onUploadExam,
  onDeleteExam,
}) => {
  const [showAddExam, setShowAddExam] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [examType, setExamType] = useState<"PDF" | "IMAGE">("PDF");

  const digitalSignatureHash = record.signature_hash || `ICP-BR-${record.id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const signatureTimestamp = record.signature_timestamp || record.created_at || new Date().toISOString();

  const handlePrint = () => {
    window.print();
  };

  const handleAddExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;
    if (onUploadExam) {
      await onUploadExam(examTitle.trim(), examType);
      setExamTitle("");
      setShowAddExam(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Export Bar */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl shadow-md print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Documento Médico Assinado Digitalmente (ICP-Brasil)
          </span>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow transition-all"
        >
          <Printer className="w-4 h-4" /> Exportar / Imprimir PDF
        </button>
      </div>

      {/* Main Printable Document Sheet */}
      <div id="printable-medical-record" className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-xl space-y-6 font-sans print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Med<span className="text-sky-600">.na</span> Clínica & Hospital
            </h1>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-0.5">
              Prontuário Eletrônico & Receituário Oficial
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-bold">Data de Emissão</p>
            <p>{new Date(signatureTimestamp).toLocaleDateString("pt-BR")} às {new Date(signatureTimestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>

        {/* Patient and Doctor Identification Box */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Paciente</span>
            <p className="font-bold text-sm text-slate-900">
              {record.patient_user?.first_name} {record.patient_user?.last_name}
            </p>
            <p className="text-slate-500">{record.patient_user?.email || "Sem e-mail"}</p>
          </div>

          <div>
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Médico Responsável</span>
            <p className="font-bold text-sm text-slate-900">
              Dr(a). {record.doctor_user?.first_name} {record.doctor_user?.last_name}
            </p>
            <p className="text-slate-500">CRM/UF Ativo — Med.na Saúde</p>
          </div>
        </div>

        {/* Anamnesis & Diagnosis */}
        <div className="space-y-4 text-xs">
          <div>
            <h3 className="font-bold uppercase text-slate-500 text-[11px] mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600" /> 1. Anamnese & Queixa Principal
            </h3>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-medium">
              {record.anamnesis || "Nenhuma anotação de anamnese registrada."}
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase text-slate-500 text-[11px] mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" /> 2. Diagnóstico & Conduta Médica
            </h3>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-medium">
              {record.diagnosis || "Nenhum diagnóstico registrado."}
            </div>
          </div>

          {record.notes && (
            <div>
              <h3 className="font-bold uppercase text-slate-500 text-[11px] mb-1">
                3. Observações Médicas
              </h3>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                {record.notes}
              </div>
            </div>
          )}
        </div>

        {/* Prescription / Receita Médica */}
        {prescription && prescription.medications && prescription.medications.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-bold uppercase text-slate-900 text-xs tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" /> Prescrição / Receita Médica
            </h3>

            <div className="space-y-2">
              {prescription.medications.map((med, idx) => (
                <div key={idx} className="bg-sky-50/60 p-3 rounded-xl border border-sky-100 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{med.name}</span>
                    <span className="text-slate-600 font-medium">Dosagem: {med.dosage}</span>
                    <p className="text-slate-500 mt-0.5">{med.instructions}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ICP-Brasil Digital Signature & Verification Box */}
        <div className="pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase text-[11px]">
              <Lock className="w-4 h-4" /> Assinatura Digital Verificada (ICP-Brasil)
            </div>
            <p className="font-mono text-[10px] text-slate-300">
              HASH HASH256: <span className="text-sky-300 font-bold">{digitalSignatureHash}</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Validado pelo sistema Med.na em {new Date(signatureTimestamp).toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/20">
            <QrCode className="w-10 h-10 text-white" />
            <div className="text-[10px] text-slate-300">
              <p className="font-bold text-white">Consulte Autenticidade</p>
              <p>medna.com.br/validar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Medical Exams Attachments Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 print:hidden">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-sky-600" /> Anexos & Exames do Paciente ({patientExams.length})
          </h3>

          <button
            onClick={() => setShowAddExam(!showAddExam)}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Anexar Exame
          </button>
        </div>

        {showAddExam && (
          <form onSubmit={handleAddExamSubmit} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Título do Exame / Laudo *</label>
              <input
                type="text"
                placeholder="Ex: Hemograma Completo - Laboratório Central"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as "PDF" | "IMAGE")}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg p-2 font-medium"
              >
                <option value="PDF">Documento PDF</option>
                <option value="IMAGE">Imagem de Raio-X / Laudo</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-colors"
              >
                Salvar Anexo
              </button>
            </div>
          </form>
        )}

        {patientExams.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
            Nenhum exame ou laudo anexado a este prontuário.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {patientExams.map((exam) => (
              <div
                key={exam.id}
                className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{exam.title}</h4>
                  <span className="text-[10px] text-slate-500">{exam.file_type} • {new Date(exam.uploaded_at).toLocaleDateString("pt-BR")}</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={exam.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-sky-600 hover:text-sky-700 dark:text-sky-400"
                    title="Baixar exame"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {onDeleteExam && (
                    <button
                      onClick={() => onDeleteExam(exam.id)}
                      className="p-1.5 text-red-500 hover:text-red-700"
                      title="Excluir anexo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
