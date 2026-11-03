import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useErp } from '../context/ErpContext';
import { api } from '../services/api';
import {
  UserCog,
  ShieldCheck,
  Lock,
  Unlock,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Building,
  Search,
  KeyRound,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { User, UserSector, CompanyId, PermissionScope } from '../types/erp';

const SUGESTOES_FUNCAO = [
  'Gerente de Vendas',
  'Supervisor de Vendas',
  'Consultor de Vendas Interno',
  'Gerente de Logística',
  'Líder de Expedição',
  'Operador de Separação',
  'Conferente de Cargas',
  'Gerente Financeiro',
  'Analista de Crédito e Cobrança',
  'Comprador de Peças & Ferramentas',
  'Atendente SAC / Pós-Venda',
  'Operador de Caixa',
];

export const UsersScreen: React.FC = () => {
  const { allUsers, currentUser, switchUser, unlockUserAccount, resetUserPassword, refreshUsers } = useAuth();
  const { addToast } = useErp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [funcao, setFuncao] = useState('');
  const [setor, setSetor] = useState<UserSector>('vendedor');
  const [empresa, setEmpresa] = useState<CompanyId | 'TODAS'>('FC');
  const [escopo, setEscopo] = useState<PermissionScope>('restrito');
  const [initialPassword, setInitialPassword] = useState('123456');

  const filteredUsers = allUsers.filter((u) => {
    if (selectedSector !== 'todos' && u.setor !== selectedSector) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.funcao && u.funcao.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleUnlock = (user: User) => {
    unlockUserAccount(user.id);
    addToast({
      tipo: 'sucesso',
      titulo: 'Usuário Desbloqueado',
      descricao: `O usuário ${user.nome} (${user.username}) teve as tentativas falhas resetadas e foi desbloqueado.`,
    });
  };

  const handleResetPassword = (user: User) => {
    const ok = resetUserPassword(user.id);
    if (ok) {
      addToast({
        tipo: 'alerta',
        titulo: 'Senha Redefinida para 123456',
        descricao: `A senha de ${user.username} foi redefinida para "123456". O usuário será obrigado a criar uma nova senha no próximo acesso.`,
      });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    // Checagem case-insensitive de username único
    const exists = allUsers.some((u) => u.username.toLowerCase() === cleanUser);
    if (exists) {
      addToast({
        tipo: 'erro',
        titulo: 'Nome de Usuário Já Existe',
        descricao: `O login "${cleanUser}" já está em uso no sistema (verificação case-insensitive).`,
      });
      return;
    }

    api.saveUser({
      nome,
      email,
      username: cleanUser,
      funcao: funcao.trim() || 'Colaborador Operacional',
      setor,
      empresa,
      escopo,
      initialPassword: initialPassword || '123456',
    });

    refreshUsers();
    setShowAddModal(false);
    setNome('');
    setEmail('');
    setUsername('');
    setFuncao('');
    setInitialPassword('123456');

    addToast({
      tipo: 'sucesso',
      titulo: 'Colaborador Cadastrado',
      descricao: `Usuário ${cleanUser} criado com a função "${funcao || 'Colaborador'}" e senha provisória "123456".`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Topo do Cadastro de Usuários */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Gestão de Colaboradores, Funções &amp; Setores</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {allUsers.length} {allUsers.length === 1 ? 'Usuário Ativo' : 'Usuários Ativos'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de colaboradores com atribuição de função personalizada, escopos por empresa (FC/LA), login case-insensitive e troca obrigatória de senha no 1º login.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors self-start cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Usuário &amp; Função</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, username, e-mail ou função/cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos os Setores ({allUsers.length})</option>
          <option value="root">Root / Administrador ({allUsers.filter((u) => u.setor === 'root').length})</option>
          <option value="vendedor">Vendedor ({allUsers.filter((u) => u.setor === 'vendedor').length})</option>
          <option value="financeiro">Financeiro ({allUsers.filter((u) => u.setor === 'financeiro').length})</option>
          <option value="separador">Separador ({allUsers.filter((u) => u.setor === 'separador').length})</option>
          <option value="logistica">Logística ({allUsers.filter((u) => u.setor === 'logistica').length})</option>
          <option value="gerente_logistica">Gerente de Logística ({allUsers.filter((u) => u.setor === 'gerente_logistica').length})</option>
          <option value="comprador">Comprador ({allUsers.filter((u) => u.setor === 'comprador').length})</option>
          <option value="conferente">Conferente ({allUsers.filter((u) => u.setor === 'conferente').length})</option>
          <option value="sac">SAC ({allUsers.filter((u) => u.setor === 'sac').length})</option>
        </select>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Colaborador / Nome</th>
                <th className="px-4 py-3">Função / Cargo</th>
                <th className="px-4 py-3">Login (Case-Insensitive)</th>
                <th className="px-4 py-3">Setor</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Escopo</th>
                <th className="px-4 py-3">Segurança &amp; Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Nenhum colaborador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isLocked = u.bloqueadoAte && u.bloqueadoAte > Date.now();
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.nome.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block flex items-center gap-1.5">
                              {u.nome}
                              {u.isRoot && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                                  Root
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold">
                                  Você
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Função / Cargo */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          <Briefcase className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{u.funcao || 'Operacional'}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-blue-600">
                        {u.username}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 uppercase">
                          {u.setor}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.empresa === 'FC'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : u.empresa === 'LA'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {u.empresa === 'TODAS' ? 'FC & LA' : u.empresa}
                        </span>
                      </td>

                      <td className="px-4 py-3 uppercase text-slate-600 font-medium text-[11px]">
                        {u.escopo}
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                              <Lock className="w-3 h-3 text-rose-600" />
                              Bloqueado (Rate-Limit)
                            </span>
                          ) : u.precisaAlterarSenha ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              1º Acesso Pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Ativo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLocked && (
                            <button
                              onClick={() => handleUnlock(u)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title="Resetar tentativas falhas e desbloquear login"
                            >
                              <Unlock className="w-3 h-3" /> Desbloquear
                            </button>
                          )}

                          <button
                            onClick={() => handleResetPassword(u)}
                            className="px-2.5 py-1 border border-slate-300 hover:bg-slate-100 rounded text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                            title="Resetar senha para 123456 (obriga troca no próximo login)"
                          >
                            <KeyRound className="w-3 h-3 text-slate-500" />
                            <span>Resetar Senha</span>
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => switchUser(u)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer"
                            >
                              Simular
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Usuário com Campo de Criar Função */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Cadastrar Novo Colaborador</h3>
                <p className="text-[11px] text-slate-500">Crie o usuário, atribua a função e setor correspondente.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Costa Ribeiro"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  placeholder="mariana.costa@ferramentascuritiba.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Login de Acesso (Case-Insensitive) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: mariana.costa"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  O colaborador poderá digitar com maiúsculas ou minúsculas no login.
                </span>
              </div>

              {/* CAMPO DE CRIAR FUNÇÃO (Gerente de Vendas, etc.) */}
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-blue-950 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>Criar Função / Cargo Personalizado *</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-medium">Livre ou Sugestão</span>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Ex: Gerente de Vendas, Operador de Expedição, Supervisor SAC..."
                  value={funcao}
                  onChange={(e) => setFuncao(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Chips de Sugestão de Função para Clique Rápido */}
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Sugestões rápidas de funções:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {SUGESTOES_FUNCAO.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setFuncao(sug)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          funcao === sug
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-700'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Setor Operacional</label>
                  <select
                    value={setor}
                    onChange={(e) => setSetor(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="vendedor">vendedor</option>
                    <option value="financeiro">financeiro</option>
                    <option value="separador">separador</option>
                    <option value="logistica">logistica</option>
                    <option value="gerente_logistica">gerente_logistica</option>
                    <option value="comprador">comprador</option>
                    <option value="conferente">conferente</option>
                    <option value="sac">sac</option>
                    <option value="root">root (Acesso Geral)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Empresa</label>
                  <select
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FC">FC (Matriz)</option>
                    <option value="LA">LA (Abastecimento)</option>
                    <option value="TODAS">TODAS (Acesso Geral)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Escopo de Acesso</label>
                <select
                  value={escopo}
                  onChange={(e) => setEscopo(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="restrito">Restrito (apenas pedidos próprios / setor)</option>
                  <option value="todas">Todas (visão ampla da empresa)</option>
                </select>
              </div>

              {/* Informação sobre Senha Provisória e Troca Obrigatória */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Senha Inicial Provisória: 123456</span>
                </div>
                <p className="text-[10px] text-amber-700">
                  O colaborador receberá a senha padrão <strong>123456</strong> e o sistema exigirá <strong>obrigatoriamente</strong> a troca para uma nova senha pessoal no primeiro acesso.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Cadastrar Colaborador &amp; Função
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
