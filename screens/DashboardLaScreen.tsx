import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useErp } from '../context/ErpContext';
import { AccessDenied403 } from '../components/AccessDenied403';
import { OrderTrafficLightBadge } from '../components/OrderTrafficLightBadge';
import { STATUS_LABELS } from '../services/orderStateMachine';
import {
  TrendingUp,
  Package,
  Layers,
  Fuel,
  Droplets,
  DollarSign,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const DashboardLaScreen: React.FC = () => {
  const { currentUser, currentCompany, switchCompany } = useAuth();
  const { orders, openOrderDetail } = useErp();

  // Validação de permissão: Root ou usuários com escopo LA / TODAS
  const isAuthorized =
    currentUser.isRoot ||
    currentUser.setor === 'root' ||
    currentUser.empresa === 'LA' ||
    currentUser.empresa === 'TODAS';

  if (!isAuthorized) {
    return (
      <AccessDenied403
        telaNome="Dashboard LA (Loja do Abastecimento)"
        setoresPermitidos={['root', 'gerente_logistica', 'vendedor']}
        sugestaoUsuarioSetor="gerente_logistica"
      />
    );
  }

  const laOrders = orders.filter((o) => o.rootId === 'LA');
  const laFaturamento = laOrders.reduce((acc, o) => acc + o.valorTotal, 0);

  return (
    <div className="space-y-6">
      {/* Banner Superior LA */}
      <div className="bg-emerald-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-700 text-emerald-100">
              Filial Agrícola &amp; Suprimentos
            </span>
            <span className="text-xs text-emerald-200">root_id: LA</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">Dashboard Loja do Abastecimento (LA)</h1>
          <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
            Gestão dedicada à distribuição de insumos pesados, lubrificantes industriais, filtros, graxas e correias para cooperativas e frotas agrícolas do Paraná.
          </p>
        </div>

        {currentCompany !== 'LA' && (
          <button
            onClick={() => switchCompany('LA')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs self-start"
          >
            Mudar Filtro Global para LA
          </button>
        )}
      </div>

      {/* Cards de Métricas LA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faturamento da Unidade LA</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            R$ {laFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
            {laOrders.length} pedidos sob gestão LA
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Volume Lubrificantes / Graxas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">4.850 Litros</p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Baldes Mobil e Ipiranga</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Correias &amp; Rolamentos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">124 Peças</p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">SKF e Goodyear</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Controle de Paletes Pesados</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">14 Pallets</p>
          <span className="text-[11px] text-purple-600 font-semibold mt-1 inline-block">
            Expedição com plataforma
          </span>
        </div>
      </div>

      {/* Tabela de Pedidos Específicos da Loja do Abastecimento */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Carteira de Pedidos LA (Insumos Agrícolas)</h3>
            <p className="text-xs text-slate-500">Filtrados exclusivamente por root_id: LA</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3"># Pedido</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Cliente Cooperativa</th>
                <th className="px-4 py-3">Município</th>
                <th className="px-4 py-3">Vendedor LA</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {laOrders.map((order) => {
                const statusMeta = STATUS_LABELS[order.status];
                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-emerald-700 font-mono">
                      #{order.numeroPedido}
                    </td>
                    <td className="px-4 py-3">
                      <OrderTrafficLightBadge color={order.semaforoPrazo} days={order.diasCorridos} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {order.clienteNome}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {order.clienteCidade}/{order.clienteUf}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.vendedorNome}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      R$ {order.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openOrderDetail(order.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        Abrir <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
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
