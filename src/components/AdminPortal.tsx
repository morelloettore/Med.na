"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Specialty, Location, HealthInsurance, User } from "@/types";
import {
  ShieldAlert,
  Building,
  Stethoscope,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Activity,
  Calendar
} from "lucide-react";

export const AdminPortal = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"specialties" | "locations" | "insurances" | "users">("specialties");

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Forms State
  const [newSpecName, setNewSpecName] = useState("");
  const [newLocName, setNewLocName] = useState("");
  const [newLocSt, setNewLocSt] = useState("");
  const [newLocCity, setNewLocCity] = useState("");
  const [newLocState, setNewLocState] = useState("SP");
  const [newLocPhone, setNewLocPhone] = useState("");

  const [newInsName, setNewInsName] = useState("");
  const [newAnsCode, setNewAnsCode] = useState("");
  const [newCnpj, setNewCnpj] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const { data: specs } = await supabase.from("specialties").select("*").order("name");
      if (specs) setSpecialties(specs);

      const { data: locs } = await supabase.from("locations").select("*").order("name");
      if (locs) setLocations(locs);

      const { data: ins } = await supabase.from("health_insurances").select("*").order("name");
      if (ins) setInsurances(ins);

      const { data: usr } = await supabase.from("users").select("*").order("first_name");
      if (usr) setUsers(usr);
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName) return;

    try {
      const { error } = await supabase.from("specialties").insert({ name: newSpecName });
      if (error) throw error;
      setNewSpecName("");
      loadAllData();
    } catch (err: any) {
      alert("Erro ao adicionar especialidade: " + err.message);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocSt || !newLocCity) return;

    try {
      const { error } = await supabase.from("locations").insert({
        name: newLocName,
        address_st: newLocSt,
        address_city: newLocCity,
        address_state: newLocState,
        phone: newLocPhone
      });
      if (error) throw error;

      setNewLocName("");
      setNewLocSt("");
      setNewLocCity("");
      setNewLocPhone("");
      loadAllData();
    } catch (err: any) {
      alert("Erro ao adicionar unidade hospitalar: " + err.message);
    }
  };

  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInsName) return;

    try {
      const { error } = await supabase.from("health_insurances").insert({
        name: newInsName,
        ans_code: newAnsCode || null,
        cnpj: newCnpj || null
      });
      if (error) throw error;

      setNewInsName("");
      setNewAnsCode("");
      setNewCnpj("");
      loadAllData();
    } catch (err: any) {
      alert("Erro ao cadastrar convênio: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          Painel do Administrador Geral
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold">
          Administração Med.na
        </h2>
        <p className="text-purple-200 text-sm mt-1 max-w-xl">
          Gerencie a infraestrutura hospitalar, unidades de atendimento, especialidades médicas e cadastros de convênios.
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 mb-6 space-x-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("specialties")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "specialties"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Especialidades ({specialties.length})
        </button>
        <button
          onClick={() => setActiveTab("locations")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "locations"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building className="w-4 h-4" /> Unidades & Hospitais ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab("insurances")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "insurances"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" /> Convênios & Operadoras ({insurances.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" /> Usuários ({users.length})
        </button>
      </div>

      {/* TAB 1: SPECIALTIES */}
      {activeTab === "specialties" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Especialidades Médicas Cadastradas</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {specialties.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                  <span className="text-xs text-slate-400 font-mono">ID: {s.id.substring(0, 8)}...</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
            <h4 className="font-bold text-slate-900 text-base mb-4">Nova Especialidade</h4>
            <form onSubmit={handleAddSpecialty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nome</label>
                <input
                  type="text"
                  placeholder="Ex: Endocrinologia"
                  value={newSpecName}
                  onChange={(e) => setNewSpecName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm transition-colors"
              >
                Cadastrar Especialidade
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: LOCATIONS */}
      {activeTab === "locations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {locations.map((l) => (
              <div key={l.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{l.name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{l.address_st} - {l.address_city}/{l.address_state}</p>
                  <p className="text-xs text-slate-500 mt-1">Tel: {l.phone}</p>
                </div>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold uppercase">Unidade Ativa</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
            <h4 className="font-bold text-slate-900 text-base mb-4">Cadastrar Nova Unidade</h4>
            <form onSubmit={handleAddLocation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nome da Unidade</label>
                <input
                  type="text"
                  placeholder="Ex: Med.na Unidade Pinheiros"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Endereço</label>
                <input
                  type="text"
                  placeholder="Ex: R. Teodoro Sampaio, 1200"
                  value={newLocSt}
                  onChange={(e) => setNewLocSt(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={newLocCity}
                    onChange={(e) => setNewLocCity(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newLocState}
                    onChange={(e) => setNewLocState(e.target.value.toUpperCase())}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Telefone</label>
                <input
                  type="text"
                  placeholder="(11) 3000-4000"
                  value={newLocPhone}
                  onChange={(e) => setNewLocPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
              >
                Salvar Unidade
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: INSURANCES */}
      {activeTab === "insurances" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Operadoras e Convênios Aceitos</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {insurances.map((i) => (
                <div key={i.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{i.name}</h4>
                    <p className="text-xs text-slate-500">Cód ANS: {i.ans_code || "N/A"} | CNPJ: {i.cnpj || "N/A"}</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase">Credenciado</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
            <h4 className="font-bold text-slate-900 text-base mb-4">Cadastrar Convênio</h4>
            <form onSubmit={handleAddInsurance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nome da Operadora</label>
                <input
                  type="text"
                  placeholder="Ex: NotreDame Intermédica"
                  value={newInsName}
                  onChange={(e) => setNewInsName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Código ANS</label>
                <input
                  type="text"
                  placeholder="Ex: 352501"
                  value={newAnsCode}
                  onChange={(e) => setNewAnsCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">CNPJ</label>
                <input
                  type="text"
                  placeholder="00000000000000"
                  value={newCnpj}
                  onChange={(e) => setNewCnpj(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
              >
                Cadastrar Convênio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: USERS */}
      {activeTab === "users" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-base">Todos os Usuários Cadastrados no Sistema</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Telefone</th>
                  <th className="px-6 py-3">Papel / Role</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{u.first_name} {u.last_name}</td>
                    <td className="px-6 py-3.5 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3.5 text-slate-500 text-xs">{u.phone || "N/A"}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === "ADMIN" ? "bg-purple-100 text-purple-800" : u.role === "DOCTOR" ? "bg-emerald-100 text-emerald-800" : u.role === "EMPLOYEE" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-emerald-600 font-bold">Ativo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
