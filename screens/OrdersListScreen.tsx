import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { OrderTrafficLightBadge } from '../components/OrderTrafficLightBadge';
import { STATUS_LABELS } from '../services/orderStateMachine';
import { OrderStatus, TrafficLightColor, SalesOrder } from '../types/erp';
import {
  Search,
  Filter,
  FilePlus2,
  ExternalLink,
  MessageSquare,
  TableProperties,
  CheckSquare,
  Square,
  RotateCw,
  Building,
  ChevronDown,
} from 'lucide-react';

export const OrdersListScreen: React.FC = () => {
  const { orders, openOrderDetail, setActiveScreen, executeAction, refreshOrders } = useErp();
  const { currentCompany, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedSemaforo, setSelectedSemaforo] = useState<string>('todos');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Filtros combinados
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Busca por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchNum = String(order.numeroPedido).includes(query);
        const matchClient = order.clienteNome.toLowerCase().includes(query);
        const matchDoc = order.clienteCpfCnpj.includes(query);
        const matchNf = order.numeroNf?.includes(query);
        const matchBling = order.numeroOrcamentoBling?.includes(query);
        if (!matchNum && !matchClient && !matchDoc && !matchNf && !matchBling) {
          return false;
        }
      }

      // 2. Filtro de Status
      if (selectedStatus !== 'todos' && order.status !== selectedStatus) {
        return false;
      }

      // 3. Filtro de Semáforo SLA
      if (selectedSemaforo !== 'todos' && order.semaforoPrazo !== selectedSemaforo) {
        return false;
      }

      return true;
    });
  }, [orders, searchTerm, selectedStatus, selectedSemaforo]);

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchAction = (action: 'enviar_para_logistica') => {
    selectedOrderIds.forEach((id) => {
      executeAction(id, action);
    });
    setSelectedOrderIds([]);
  };

  return (
    <div className="space-y-4">
      {/* Topo: Título + Botão Novo Pedido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Pedidos de Venda</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Gerenciamento do pipeline comercial com sincronização Bling API e semáforo de prazo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshOrders()}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Atualizar lista"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveScreen('novo_pedido')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Busca Textual */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número do pedido, cliente, CPF/CNPJ, NF ou orçamento Bling..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Filtro por Semáforo SLA */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-600 shrink-0">Semáforo:</span>
            <select
              value={selectedSemaforo}
              onChange={(e) => setSelectedSemaforo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os prazos</option>
              <option value="verde">🟢 Verde (0 a 4 dias)</option>
              <option value="amarelo">🟡 Amarelo (4 a 9 dias)</option>
              <option value="vermelho">🔴 Vermelho (&gt; 9 dias)</option>
            </select>
          </div>
        </div>

        {/* Pílulas de Status da Máquina de Estados */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Status:</span>
          <button
            onClick={() => setSelectedStatus('todos')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === 'todos'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({orders.length})
          </button>

          {(
            [
              'conferencia_pagamento',
              'aprovacao_gerente',
              'novo',
              'pedido_gerado',
              'em_logistica',
              'aguardando_nf',
              'aguardando_envio',
              'coleta_final',
              'finalizado',
              'compras',
              'pagamento_nf',
              'cancelado',
            ] as OrderStatus[]
          ).map((st) => {
            const count = orders.filter((o) => o.status === st).length;
            const meta = STATUS_LABELS[st];
            const isSelected = selectedStatus === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Ações em Lote (quando houver itens selecionados) */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-2 text-blue-900 font-semibold">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>{selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'pedido selecionado' : 'pedidos selecionados'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchAction('enviar_para_logistica')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Enviar para Logística
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-1.5 text-slate-600 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Desmarcar todos
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Pedidos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-3 py-3 w-8">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-3"># Pedido</th>
                <th className="px-3 py-3">Prazo (SLA)</th>
                <th className="px-3 py-3">Origem / Bling</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Cidade / UF</th>
                <th className="px-3 py-3">Vendedor</th>
                <th className="px-3 py-3">Valor Total</th>
                <th className="px-3 py-3">NF-e</th>
                <th className="px-3 py-3">Transportadora</th>
                <th className="px-3 py-3">Status Atual</th>
                <th className="px-3 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusMeta = STATUS_LABELS[order.status];
                  const isChecked = selectedOrderIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleSelectOrder(order.id)}
                          className="text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3 font-bold text-blue-600 font-mono">
                        <button
                          onClick={() => openOrderDetail(order.id)}
                          className="hover:underline flex items-center gap-1"
                        >
                          #{order.numeroPedido}
                        </button>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <OrderTrafficLightBadge
                          color={order.semaforoPrazo}
                          days={order.diasCorridos}
                          showDetails={false}
                        />
                      </td>
                      <td className="px-3 py-3">
                        {order.origem === 'bling' ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                              Bling {order.numeroOrcamentoBling ? `#${order.numeroOrcamentoBling}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 uppercase">{order.origem}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800 max-w-[180px] truncate">
                        {order.clienteNome}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {order.clienteCidade}/{order.clienteUf}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {order.vendedorNome.split(' ')[0]}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        R$ {order.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {order.numeroNf ? (
                          <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                            NF {order.numeroNf}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600 max-w-[140px] truncate" title={order.transportadoraNome}>
                        {order.transportadoraNome}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => openOrderDetail(order.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Abrir <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
