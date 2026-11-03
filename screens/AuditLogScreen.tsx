import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { History, Search, Filter, Shield } from 'lucide-react';
import { TransitionLog } from '../types/erp';

export const AuditLogScreen: React.FC = () => {
  const { orders } = useErp();
  const { currentCompany } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Coleta todos os logs de transição de todos os pedidos
  const allLogs: (TransitionLog & { numeroPedido: number; clienteNome: string })[] = [];
  orders.forEach((o) => {
    o.historicoTransicoes.forEach((log) => {
      allLogs.push({
        ...log,
        numeroPedido: o.numeroPedido,
        clienteNome: o.clienteNome,
      });
    });
  });

  allLogs.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

  const filteredLogs = allLogs.filter((log) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        String(log.numeroPedido).includes(q) ||
        log.acao.toLowerCase().includes(q) ||
        log.usuarioNome.toLowerCase().includes(q) ||
        log.setorUsuario.toLowerCase().includes(q) ||
        log.clienteNome.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Auditoria &amp; Log Global de Transições</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Rastreabilidade das 22 Ações
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Registro cronológico imutável de todas as transições de status executadas no Saleon ({currentCompany}).
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por pedido #, ação (ex: marcar_nf_gerada), colaborador ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3"># Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Ação Executada</th>
                <th className="px-4 py-3">Transição (De &rarr; Para)</th>
                <th className="px-4 py-3">Colaborador / Setor</th>
                <th className="px-4 py-3">Detalhes / Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.dataHora).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">#{log.numeroPedido}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{log.clienteNome}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    <span className="font-semibold text-slate-700">{log.statusAnterior}</span> &rarr;{' '}
                    <strong className="text-blue-700">{log.statusNovo}</strong>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <strong className="text-slate-800">{log.usuarioNome}</strong>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      ({log.setorUsuario})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 italic max-w-xs truncate">
                    {log.detalhes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
