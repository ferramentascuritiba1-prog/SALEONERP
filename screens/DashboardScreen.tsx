import React, { useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { OrderTrafficLightBadge } from '../components/OrderTrafficLightBadge';
import { STATUS_LABELS } from '../services/orderStateMachine';
import {
  TrendingUp,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Route,
  Landmark,
  BadgeDollarSign,
  RotateCw,
  ArrowRight,
  ExternalLink,
  Palette,
  MoonStar,
  SunMedium,
  Timer,
} from 'lucide-react';
import { OrderStatus } from '../types/erp';

export const DashboardScreen: React.FC = () => {
  const { orders, counts, openOrderDetail, setActiveScreen, refreshOrders, lastHeartbeat, theme, setTheme } = useErp();
  const { currentCompany } = useAuth();

  // Requisito atendido: O polling do Dashboard roda enquanto o componente está montado
  // e é cancelado limpo ao desmontar através do ErpContext!
  useEffect(() => {
    // Ao montar a tela do Dashboard, garante sincronização dos KPIs
    refreshOrders();
  }, [refreshOrders]);

  const faturamentoTotal = orders
    .filter((o) => o.status !== 'cancelado')
    .reduce((acc, o) => acc + o.valorTotal, 0);

  const faturamentoFinalizado = orders
    .filter((o) => o.status === 'finalizado')
    .reduce((acc, o) => acc + o.valorTotal, 0);

  const ticketMedio =
    orders.length > 0 ? faturamentoTotal / Math.max(1, orders.filter((o) => o.status !== 'cancelado').length) : 0;

  // Pipeline funil das 9 etapas sequenciais
  const sequentialPipeline: { status: OrderStatus; count: number }[] = [
    { status: 'conferencia_pagamento', count: counts.conferenciaPagamento },
    { status: 'aprovacao_gerente', count: counts.aprovacaoGerente },
    { status: 'novo', count: counts.novo },
    { status: 'pedido_gerado', count: counts.pedidoGerado },
    { status: 'em_logistica', count: counts.emLogistica },
    { status: 'aguardando_nf', count: counts.aguardandoNf },
    { status: 'aguardando_envio', count: counts.aguardandoEnvio },
    { status: 'coleta_final', count: counts.coletaFinal },
    { status: 'finalizado', count: counts.finalizado },
  ];

  return (
    <div className="space-y-6">
      {/* Topo do Dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Saleon ERP — Dashboard {currentCompany === 'FC' ? 'Ferramentas Curitiba (FC)' : 'Loja do Abastecimento (LA)'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
              Matriz {currentCompany}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visão consolidada do fluxo comercial, esteira de expedição, conferência e semáforos SLA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Campo na Tela Inicial para Alterar a Cor do Sistema para Preto / Claro */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-600 pl-2 pr-1.5 flex items-center gap-1.5 shrink-0">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span>Cor do Sistema:</span>
            </span>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mudar cor do sistema para Claro"
            >
              <SunMedium className="w-3.5 h-3.5 text-amber-500" />
              <span>Claro</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mudar cor do sistema para Preto"
            >
              <MoonStar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preto</span>
            </button>
          </div>

          <div className="text-right text-xs text-slate-500 hidden xl:block font-mono">
            <span>Última sincronização: </span>
            <strong className="text-slate-800">{lastHeartbeat}</strong>
          </div>

          <button
            onClick={() => refreshOrders()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Alerta de Semáforo Crítico (> 9 dias) se houver */}
      {counts.semaforoVermelho > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900">
                Atenção: {counts.semaforoVermelho} {counts.semaforoVermelho === 1 ? 'pedido está' : 'pedidos estão'} com prazo crítico no semáforo vermelho (&gt; 9 dias)!
              </p>
              <p className="text-xs text-rose-700">
                Pedidos com atraso acumulado na separação, falta de mercadoria em compras ou pendência de pagamento da NF.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveScreen('pedidos')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-2xs"
          >
            Ver Pedidos Atrasados
          </button>
        </div>
      )}

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faturamento Operacional</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight">
            R$ {faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold font-mono">
              R$ {faturamentoFinalizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span>já entregues</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pedidos no Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight">{orders.length} pedidos</p>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-blue-600 font-semibold">{counts.emLogistica} em esteira</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600 font-semibold">{counts.aguardandoEnvio} p/ despacho</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">SLA Semáforo Verde (0-4d)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2 font-mono tracking-tight">
            {orders.filter((o) => o.semaforoPrazo === 'verde').length} pedidos
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <span>{counts.total > 0 ? Math.round((orders.filter((o) => o.semaforoPrazo === 'verde').length / counts.total) * 100) : 0}% em conformidade</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ticket Médio</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight">
            R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <span>Média por pedido de venda</span>
          </div>
        </div>
      </div>

      {/* Funil Visual do Pedido de Venda (9 etapas sequenciais) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Funil Operacional do Pedido de Venda</h2>
            <p className="text-xs text-slate-500">As 9 etapas sequenciais da máquina de estados do Saleon ERP</p>
          </div>
          <button
            onClick={() => setActiveScreen('pedidos')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Ver todos no grid <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2 pt-2">
          {sequentialPipeline.map((step, idx) => {
            const labelInfo = STATUS_LABELS[step.status];
            return (
              <div
                key={step.status}
                onClick={() => setActiveScreen('pedidos')}
                className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl p-3 text-center transition-all cursor-pointer group"
              >
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600">
                  Etapa 0{idx + 1}
                </span>
                <p className="text-xl font-extrabold text-slate-800 group-hover:text-blue-700 mt-1">
                  {step.count}
                </p>
                <p className="text-[11px] font-medium text-slate-600 group-hover:text-blue-900 mt-0.5 line-clamp-2 leading-tight">
                  {labelInfo.label.replace(/^\d+\.\s*/, '')}
                </p>
              </div>
            );
          })}
        </div>

        {/* Desvios Mapeados */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
          <span className="text-slate-500 font-medium">Desvios de Fluxo:</span>
          <span
            onClick={() => setActiveScreen('compras')}
            className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
          >
            <strong>{counts.compras}</strong> em Compras (Falta de Estoque)
          </span>
          <span
            onClick={() => setActiveScreen('pedidos')}
            className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
          >
            <strong>{counts.pagamentoNf}</strong> em Pagamento da NF
          </span>
          <span
            onClick={() => setActiveScreen('pedidos')}
            className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
          >
            <strong>{counts.cancelado}</strong> Cancelados
          </span>
        </div>
      </div>

      {/* Lista de Pedidos Recentes com Semáforo de Prazo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pedidos em Andamento no Sistema</h3>
            <p className="text-xs text-slate-500">Monitoramento com prazo semafórico (Verde 0-4d, Amarelo 4-9d, Vermelho &gt;9d)</p>
          </div>
          <button
            onClick={() => setActiveScreen('pedidos')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Abrir listagem completa ({orders.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3"># Pedido</th>
                <th className="px-4 py-3">Prazo (Semáforo)</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">Status Atual</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Nenhum pedido de venda registrado no momento. Clique em{' '}
                    <button
                      onClick={() => setActiveScreen('novo_pedido')}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Novo Pedido
                    </button>{' '}
                    para cadastrar ou importar orçamentos do Bling.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 6).map((order) => {
                  const statusMeta = STATUS_LABELS[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-blue-600 font-mono">
                        #{order.numeroPedido}
                      {order.origem === 'bling' && (
                        <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-indigo-50 text-indigo-700">
                          Bling
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <OrderTrafficLightBadge color={order.semaforoPrazo} days={order.diasCorridos} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 max-w-[200px] truncate">
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Abrir <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
