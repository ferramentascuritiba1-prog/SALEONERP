import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { STATUS_LABELS } from '../services/orderStateMachine';
import { OrderAction, OrderStatus } from '../types/erp';
import { FileSpreadsheet, CheckSquare, Square, Play, ShieldAlert, AlertTriangle } from 'lucide-react';

export const BulkEditorScreen: React.FC = () => {
  const { orders, executeAction, addToast, refreshOrders } = useErp();
  const { currentUser, currentCompany } = useAuth();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetAction, setTargetAction] = useState<OrderAction>('enviar_para_logistica');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const handleExecuteBulk = () => {
    if (selectedIds.length === 0) return;
    let count = 0;
    selectedIds.forEach((id) => {
      const ok = executeAction(id, targetAction);
      if (ok) count++;
    });
    addToast({
      tipo: 'sucesso',
      titulo: 'Edição Mestre Concluída',
      descricao: `${count} pedidos processados com a ação "${targetAction.replace(/_/g, ' ')}".`,
    });
    setSelectedIds([]);
    refreshOrders();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Edição Mestre de Pedidos (Bulk Actions)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Operações em Lote
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Execução em lote de transições de status com registro individual de auditoria na esteira ({currentCompany}).
          </p>
        </div>
      </div>

      {/* Painel de Controle em Lote */}
      <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100">
              {selectedIds.length} {selectedIds.length === 1 ? 'pedido selecionado' : 'pedidos selecionados'} para alteração
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-slate-300 font-semibold">Ação a Executar em Massa:</label>
            <select
              value={targetAction}
              onChange={(e) => setTargetAction(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white border border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="enviar_para_logistica">Enviar para Logística (Separação)</option>
              <option value="conferir_logistica">Concluir Conferência</option>
              <option value="despachar_coleta">Despachar Coleta</option>
              <option value="confirmar_conferencia_pagamento">Aprovar Pagamento</option>
              <option value="sincronizar_bling">Sincronizar em Lote com Bling</option>
            </select>

            <button
              disabled={selectedIds.length === 0}
              onClick={handleExecuteBulk}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Play className="w-3.5 h-3.5" />
              Executar em Massa
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Pedidos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900"
          >
            {selectedIds.length === orders.length && orders.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>Selecionar Todos os Pedidos ({orders.length})</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">#</th>
                <th className="px-4 py-3"># Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">Status Atual</th>
                <th className="px-4 py-3">Transportadora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => {
                const isSelected = selectedIds.includes(o.id);
                const statusMeta = STATUS_LABELS[o.status];
                return (
                  <tr
                    key={o.id}
                    onClick={() => toggleSelect(o.id)}
                    className={`cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">#{o.numeroPedido}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{o.clienteNome}</td>
                    <td className="px-4 py-3 font-mono font-bold">R$ {o.valorTotal.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.transportadoraNome}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
