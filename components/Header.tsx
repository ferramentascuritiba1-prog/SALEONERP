import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useErp } from '../context/ErpContext';
import {
  Building,
  Store,
  Users,
  Search,
  Bell,
  CheckCircle2,
  Layers,
  LogOut,
  ChevronDown,
  ShieldCheck,
  ScrollText,
  Lock,
  MoonStar,
  SunMedium,
  Activity,
} from 'lucide-react';
import { CompanyId, User } from '../types/erp';

export const Header: React.FC = () => {
  const { currentUser, currentCompany, switchCompany, allUsers, switchUser, logout, lockoutTimer } = useAuth();
  const { lastHeartbeat, isPollingActive, setActiveScreen, counts, theme, toggleTheme } = useErp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  const filteredUsers = allUsers.filter(
    (u) =>
      u.nome.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.setor.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      setActiveScreen('pedidos');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Esquerda: Logo + Seletor Multiempresa FC / LA */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base">Saleon</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                ERP v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Operação Integrada &amp; Bling API</p>
          </div>
        </div>

        {/* Multi-inquilino / Empresa Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => switchCompany('FC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentCompany === 'FC'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>FC (Matriz)</span>
          </button>
          <button
            onClick={() => switchCompany('LA')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentCompany === 'LA'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>LA (Abastecimento)</span>
          </button>
        </div>
      </div>

      {/* Centro: Busca Global */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
        <form onSubmit={handleGlobalSearch} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar pedido #, NF, cliente ou CPF..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-sans"
          />
        </form>
      </div>

      {/* Direita: Heartbeat, Atalho de Entregáveis, Seletor dos Usuários & Perfil */}
      <div className="flex items-center gap-3">
        {/* Status ao vivo / Polling */}
        <div
          title={`Atualização em tempo real ativa. Último ciclo: ${lastHeartbeat}`}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPollingActive ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPollingActive ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </span>
          <span className="text-[11px] font-medium text-slate-700">Ao vivo ({lastHeartbeat})</span>
        </div>

        {/* Atalho para Entregáveis da Arquitetura */}
        <button
          onClick={() => setActiveScreen('arquitetura_docs')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors"
          title="Ver Entregáveis: DDL, ER, Catálogo de 104 rotas, 22 transições e Dívida Técnica"
        >
          <ScrollText className="w-3.5 h-3.5 text-indigo-600" />
          <span>7 Entregáveis</span>
        </button>

        {/* Botão de Alternância de Tema: Claro vs Preto */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title={theme === 'dark' ? 'Alternar para Tema Claro' : 'Alternar para Tema Preto'}
        >
          {theme === 'dark' ? (
            <SunMedium className="w-3.5 h-3.5 text-amber-300" />
          ) : (
            <MoonStar className="w-3.5 h-3.5 text-slate-700" />
          )}
          <span className="hidden sm:inline">{theme === 'dark' ? 'Tema Preto' : 'Tema Claro'}</span>
        </button>

        {/* Dropdown de Usuário / Colaborador */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-heading">
                {currentUser.nome.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800 leading-none">{currentUser.nome}</span>
                  {currentUser.isRoot && <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {currentUser.funcao || currentUser.setor} • {currentUser.empresa}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-slate-100 mb-2">
                  <p className="text-xs font-bold text-slate-900">Colaboradores do Sistema</p>
                  <p className="text-[11px] text-slate-500">
                    {allUsers.length} {allUsers.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
                  </p>
                  <input
                    type="text"
                    placeholder="Filtrar por nome, login ou função..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="mt-2 w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredUsers.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                          isCurrent ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{u.nome}</span>
                            {u.isRoot && (
                              <span className="text-[9px] px-1 rounded bg-purple-100 text-purple-700">Root</span>
                            )}
                            {u.precisaAlterarSenha && (
                              <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-700 font-medium">
                                1º Acesso
                              </span>
                            )}
                            {u.bloqueadoAte && u.bloqueadoAte > Date.now() && (
                              <span className="text-[9px] px-1 rounded bg-red-100 text-red-700 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Travado
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {u.username} • {u.funcao || u.setor} • {u.empresa}
                          </span>
                        </div>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between items-center px-2">
                  <button
                    onClick={() => {
                      setActiveScreen('usuarios');
                      setShowUserDropdown(false);
                    }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Gerenciar Usuários &amp; Setores
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair / Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
