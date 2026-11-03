import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Headphones, Plus, AlertCircle, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import { SACTicket } from '../types/erp';

export const SacScreen: React.FC = () => {
  const { currentCompany, currentUser } = useAuth();
  const { addToast } = useErp();

  const [tickets, setTickets] = useState<SACTicket[]>(() => api.getSacTickets(currentCompany));
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [numeroPedido, setNumeroPedido] = useState(10410);
  const [clienteNome, setClienteNome] = useState('');
  const [motivo, setMotivo] = useState<SACTicket['motivo']>('ATRASO');
  const [prioridade, setPrioridade] = useState<SACTicket['prioridade']>('MEDIA');
  const [descricao, setDescricao] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const created = api.createSacTicket({
      rootId: currentCompany,
      numeroPedido: Number(numeroPedido),
      clienteNome: clienteNome || 'Cliente SAC',
      motivo,
      prioridade,
      descricao,
      responsavelNome: currentUser.nome,
    });
    setTickets(api.getSacTickets(currentCompany));
    setShowModal(false);
    setDescricao('');
    addToast({
      tipo: 'sucesso',
      titulo: 'Chamado SAC Aberto',
      descricao: `Ticket #${created.id} registrado com sucesso para o pedido #${numeroPedido}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">SAC &amp; Pós-Venda Operacional</h1>
          <p className="text-xs text-slate-500">
            Abertura de chamados, tratativas de avarias no transporte, extravios e devoluções.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Abrir Chamado SAC</span>
        </button>
      </div>

      {/* Cards Resumo SAC */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Chamados em Aberto / Análise</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {tickets.filter((t) => t.status !== 'RESOLVIDO' && t.status !== 'CANCELADO').length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Aguardando resolução</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Avarias &amp; Extravios (Transporte)</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {tickets.filter((t) => t.motivo === 'AVARIA' || t.motivo === 'EXTRAVIO').length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Acionamento de seguro de carga</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Resolvidos / Concluídos</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {tickets.filter((t) => t.status === 'RESOLVIDO').length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Comprovante anexado</span>
        </div>
      </div>

      {/* Tabela de Ocorrências SAC */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Histórico de Chamados SAC</h2>
          <span className="text-xs text-slate-500 font-semibold">{tickets.length} chamados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3"># Chamado</th>
                <th className="px-4 py-3"># Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Descrição da Ocorrência</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Nenhum chamado de SAC registrado.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.id}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">#{t.numeroPedido}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{t.clienteNome}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                        {t.motivo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.prioridade === 'ALTA' || t.prioridade === 'URGENTE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {t.prioridade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{t.descricao}</td>
                    <td className="px-4 py-3 text-slate-700">{t.responsavelNome}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          t.status === 'RESOLVIDO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Abertura de Chamado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Novo Chamado no SAC</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1"># Número do Pedido</label>
                  <input
                    type="number"
                    required
                    value={numeroPedido}
                    onChange={(e) => setNumeroPedido(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Motivo do Chamado</label>
                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ATRASO">Atraso na Entrega</option>
                    <option value="AVARIA">Avaria no Transporte</option>
                    <option value="EXTRAVIO">Extravio de Mercadoria</option>
                    <option value="PRODUTO_ERRADO">Produto Divergente</option>
                    <option value="DEVOLUCAO">Devolução Comercial</option>
                    <option value="DUVIDA">Dúvida Técnica / Manual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente ou empresa"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente (Linha de Produção Parada)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Ocorrido</label>
                <textarea
                  required
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva a solicitação do cliente..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs"
                >
                  Salvar Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
