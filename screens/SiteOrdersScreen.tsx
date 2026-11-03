import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { AccessDenied403 } from '../components/AccessDenied403';
import { Globe, RefreshCw, CheckCircle, ExternalLink, ShoppingBag } from 'lucide-react';

export const SiteOrdersScreen: React.FC = () => {
  const { currentUser, currentCompany } = useAuth();
  const { addToast } = useErp();

  // Validação 403: apenas vendedor, financeiro ou root
  const isAuthorized =
    currentUser.isRoot || currentUser.setor === 'vendedor' || currentUser.setor === 'financeiro';

  if (!isAuthorized) {
    return (
      <AccessDenied403
        telaNome="Pedidos do Site (E-commerce B2B/B2C)"
        setoresPermitidos={['vendedor', 'financeiro', 'root']}
        sugestaoUsuarioSetor="vendedor"
      />
    );
  }

  const [siteOrders, setSiteOrders] = useState([
    {
      id: 'site_9901',
      numeroSite: 'LOJA-44120',
      cliente: 'Engenharia Civil Guaratuba Ltda',
      cidade: 'Guaratuba/PR',
      valor: 3450.0,
      data: '2026-11-03 06:15',
      statusIntegracao: 'IMPORTADO_ERP',
      gatewayPagamento: 'MercadoPago PIX (Aprovado)',
    },
    {
      id: 'site_9902',
      numeroSite: 'LOJA-44121',
      cliente: 'Marcenaria Pinheiro & Filhos',
      cidade: 'São José dos Pinhais/PR',
      valor: 1890.0,
      data: '2026-11-03 07:05',
      statusIntegracao: 'PENDENTE',
      gatewayPagamento: 'Boleto Bancário (Aguardando)',
    },
    {
      id: 'site_9903',
      numeroSite: 'LOJA-44122',
      cliente: 'Marmoraria & Granitos Colombo',
      cidade: 'Colombo/PR',
      valor: 5200.0,
      data: '2026-11-03 07:25',
      statusIntegracao: 'PENDENTE',
      gatewayPagamento: 'Cartão de Crédito 3x (Aprovado)',
    },
  ]);

  const handleImportToErp = (siteId: string) => {
    setSiteOrders((prev) =>
      prev.map((o) => (o.id === siteId ? { ...o, statusIntegracao: 'IMPORTADO_ERP' } : o))
    );
    addToast({
      tipo: 'sucesso',
      titulo: 'Pedido do Site Importado',
      descricao: `Pedido sincronizado com sucesso e injetado na fila de pedidos do Saleon ERP.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Pedidos do Site (E-commerce)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Webhooks Ativos
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Fila de vendas recebidas via loja virtual (Nuvemshop / WooCommerce) e reconciliação com o Bling.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Pedidos Recebidos da Loja Virtual</h2>
          <span className="text-xs font-semibold text-slate-500">{siteOrders.length} pedidos hoje</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3"># Loja Virtual</th>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Cliente Web</th>
                <th className="px-4 py-3">Município</th>
                <th className="px-4 py-3">Gateway Pagamento</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">Status ERP</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {siteOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">{order.numeroSite}</td>
                  <td className="px-4 py-3 text-slate-600">{order.data}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{order.cliente}</td>
                  <td className="px-4 py-3 text-slate-600">{order.cidade}</td>
                  <td className="px-4 py-3 text-slate-600">{order.gatewayPagamento}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    R$ {order.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        order.statusIntegracao === 'IMPORTADO_ERP'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.statusIntegracao === 'IMPORTADO_ERP' ? 'Sincronizado' : 'Aguardando'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {order.statusIntegracao === 'PENDENTE' ? (
                      <button
                        onClick={() => handleImportToErp(order.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs transition-colors"
                      >
                        Importar para ERP
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Já importado</span>
                    )}
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
