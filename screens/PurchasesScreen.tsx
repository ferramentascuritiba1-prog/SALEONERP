import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { AccessDenied403 } from '../components/AccessDenied403';
import { api } from '../services/api';
import {
  PackageSearch,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { InventoryShortage } from '../types/erp';

export const PurchasesScreen: React.FC = () => {
  const { currentUser, currentCompany } = useAuth();
  const { executeAction, addToast, refreshOrders } = useErp();

  // Validação de Permissão: Comprador ou Root. Demais setores recebem HTTP 403!
  const isAuthorized = currentUser.isRoot || currentUser.setor === 'comprador';

  if (!isAuthorized) {
    return (
      <AccessDenied403
        telaNome="Compras (Resumo e Itens Faltantes)"
        setoresPermitidos={['comprador', 'root']}
        sugestaoUsuarioSetor="comprador"
      />
    );
  }

  const [shortages, setShortages] = useState<InventoryShortage[]>(() =>
    api.getShortages(currentCompany)
  );

  const reloadShortages = () => {
    setShortages(api.getShortages(currentCompany));
  };

  const handleUpdateStatus = (shortageId: string, novoStatus: InventoryShortage['status']) => {
    api.updateShortageStatus(shortageId, novoStatus);
    reloadShortages();
    addToast({
      tipo: 'sucesso',
      titulo: 'Status de Compra Atualizado',
      descricao: `Item de suprimento atualizado para ${novoStatus}.`,
    });
  };

  const handleReceiveStockAndReleaseOrder = (shortage: InventoryShortage) => {
    // 1. Marca falta como RECEBIDO
    api.updateShortageStatus(shortage.id, 'RECEBIDO');
    // 2. Aciona a ação retornar_compras no pedido correspondente
    executeAction(shortage.pedidoId, 'retornar_compras');
    reloadShortages();
    refreshOrders();

    addToast({
      tipo: 'sucesso',
      titulo: 'Estoque Suprido & Pedido Liberado',
      descricao: `Pedido #${shortage.numeroPedido} retirado do desvio de compras e devolvido à logística!`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              Setor de Compras &amp; Controle de Itens Faltantes
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">
              Acesso Exclusivo: Comprador &amp; Root
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Monitoramento de rupturas físicas detectadas na esteira de separação e reposição de fornecedores.
          </p>
        </div>

        <button
          onClick={reloadShortages}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Faltas</span>
        </button>
      </div>

      {/* Resumo de Faltas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Itens em Ruptura Pendente</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {shortages.filter((s) => s.status === 'PENDENTE').length} itens
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Aguardando cotação de fornecedor</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Ordens de Compra Emitidas</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {shortages.filter((s) => s.status === 'COMPRADO' || s.status === 'COTADO').length} pedidos
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Em trânsito com fornecedor</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Suprimentos Recebidos &amp; Liberados</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {shortages.filter((s) => s.status === 'RECEBIDO').length} baixados
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Devolvidos para a separação</span>
        </div>
      </div>

      {/* Tabela de Rupturas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Painel de Itens Faltantes por Pedido ({currentCompany})
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {shortages.length} registros ativos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3"># Pedido Vinculado</th>
                <th className="px-4 py-3">Código Produto</th>
                <th className="px-4 py-3">Descrição da Peça</th>
                <th className="px-4 py-3">Qtd Faltante</th>
                <th className="px-4 py-3">Fornecedor Sugerido</th>
                <th className="px-4 py-3">Status Compra</th>
                <th className="px-4 py-3 text-right">Ação do Comprador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shortages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Nenhum item faltante registrado na empresa atual.
                  </td>
                </tr>
              ) : (
                shortages.map((shortage) => (
                  <tr key={shortage.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      #{shortage.numeroPedido}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                      {shortage.codigoProduto}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[220px] truncate">
                      {shortage.descricaoProduto}
                    </td>
                    <td className="px-4 py-3 font-bold text-rose-600">
                      {shortage.quantidadeFaltante} UN
                    </td>
                    <td className="px-4 py-3 text-slate-600">{shortage.fornecedorSugerido}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                          shortage.status === 'RECEBIDO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : shortage.status === 'COMPRADO'
                            ? 'bg-blue-100 text-blue-800'
                            : shortage.status === 'COTADO'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {shortage.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {shortage.status === 'PENDENTE' && (
                          <button
                            onClick={() => handleUpdateStatus(shortage.id, 'COTADO')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold"
                          >
                            Marcar Cotado
                          </button>
                        )}
                        {shortage.status === 'COTADO' && (
                          <button
                            onClick={() => handleUpdateStatus(shortage.id, 'COMPRADO')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                          >
                            Marcar Comprado
                          </button>
                        )}
                        {shortage.status === 'COMPRADO' && (
                          <button
                            onClick={() => handleReceiveStockAndReleaseOrder(shortage)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Receber Estoque &amp; Retornar à Logística
                          </button>
                        )}
                        {shortage.status === 'RECEBIDO' && (
                          <span className="text-slate-400 text-[11px] italic">Concluído</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
