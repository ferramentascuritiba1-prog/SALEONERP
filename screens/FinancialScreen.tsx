import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { OrderTrafficLightBadge } from '../components/OrderTrafficLightBadge';
import { api } from '../services/api';
import {
  DollarSign,
  CheckCircle,
  MessageCircle,
  AlertTriangle,
  Receipt,
  ExternalLink,
  Copy,
  Clock,
} from 'lucide-react';
import { SalesOrder } from '../types/erp';

export const FinancialScreen: React.FC = () => {
  const { orders, executeAction, addToast, refreshOrders, openOrderDetail } = useErp();
  const { currentUser } = useAuth();

  // Pedidos sob alçada financeira
  const pendingPaymentOrders = orders.filter((o) => o.status === 'conferencia_pagamento');
  const nfRetentionOrders = orders.filter((o) => o.status === 'pagamento_nf');

  const [selectedOrderForBilling, setSelectedOrderForBilling] = useState<SalesOrder | null>(null);
  const [billingPreview, setBillingPreview] = useState<{ link: string; message: string } | null>(null);

  const handleOpenBillingModal = (order: SalesOrder) => {
    setSelectedOrderForBilling(order);
    const res = api.generateWhatsAppBilling(order.id);
    setBillingPreview({ link: res.link, message: res.message });
  };

  const handleConfirmPayment = (orderId: string) => {
    executeAction(orderId, 'confirmar_conferencia_pagamento');
  };

  const handleConfirmNfPayment = (orderId: string) => {
    executeAction(orderId, 'confirmar_pagamento_nf');
  };

  const handleCopyLink = () => {
    if (billingPreview?.link) {
      navigator.clipboard.writeText(billingPreview.link);
      addToast({
        tipo: 'sucesso',
        titulo: 'Link Copiado',
        descricao: 'Link direto do WhatsApp copiado para a área de transferência.',
      });
    }
  };

  const handleSendWhatsAppNow = () => {
    if (billingPreview?.link) {
      window.open(billingPreview.link, '_blank');
      addToast({
        tipo: 'sucesso',
        titulo: 'WhatsApp Aberto',
        descricao: 'Disparo de mensagem de cobrança enviado.',
      });
      setSelectedOrderForBilling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Financeiro &amp; Cobrança WhatsApp</h1>
          <p className="text-xs text-slate-500">
            Acompanhamento de liquidações PIX/Boleto, liberação de crédito e cobrança automatizada.
          </p>
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Aguardando Conferência de PIX/Boleto</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {pendingPaymentOrders.length} {pendingPaymentOrders.length === 1 ? 'pedido' : 'pedidos'}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            R${' '}
            {pendingPaymentOrders
              .reduce((acc, o) => acc + o.valorTotal, 0)
              .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Retenção: Pagamento da NF Emitida</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {nfRetentionOrders.length} {nfRetentionOrders.length === 1 ? 'pedido' : 'pedidos'}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            R${' '}
            {nfRetentionOrders
              .reduce((acc, o) => acc + o.valorTotal, 0)
              .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Disparos de Cobrança Realizados</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {orders.filter((o) => o.cobrancaEnviadaWhatsApp).length} mensagens
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Via gateway WhatsApp oficial</span>
        </div>
      </div>

      {/* Seção 1: Conferência de Pagamento Inicial */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Fila de Conferência Inicial (Status: conferência_pagamento)
            </h2>
            <p className="text-xs text-slate-500">
              Valide o comprovante antes de liberar para aprovação do gerente ou pedido gerado
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            {pendingPaymentOrders.length} pendentes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3"># Pedido</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Forma / Condição</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">WhatsApp Cobrança</th>
                <th className="px-4 py-3 text-right">Ações Financeiras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingPaymentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Nenhum pedido aguardando conferência financeira no momento.
                  </td>
                </tr>
              ) : (
                pendingPaymentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      #{order.numeroPedido}
                    </td>
                    <td className="px-4 py-3">
                      <OrderTrafficLightBadge color={order.semaforoPrazo} days={order.diasCorridos} showDetails={false} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {order.clienteNome}
                      <span className="block text-[10px] text-slate-500 font-mono font-normal">
                        {order.clienteCpfCnpj}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700">{order.formaPagamento}</span>
                      <span className="block text-[10px] text-slate-500">{order.condicaoPagamento}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      R$ {order.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenBillingModal(order)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {order.cobrancaEnviadaWhatsApp ? 'Reenviar' : 'Cobrar WhatsApp'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openOrderDetail(order.id)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs"
                        >
                          Detalhes
                        </button>
                        <button
                          onClick={() => handleConfirmPayment(order.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        >
                          Aprovar Pagamento
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção 2: Desvio Pagamento da NF (Mercadoria Retida no Galpão) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-amber-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-amber-900">
              Desvio: Retenção para Pagamento da NF (Status: pagamento_nf)
            </h2>
            <p className="text-xs text-amber-700">
              Carga fisicamente separada aguardando quitação do boleto da NF antes de carregar o caminhão
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
            {nfRetentionOrders.length} cargas retidas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3"># Pedido</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">NF Emitida</th>
                <th className="px-4 py-3">Valor da NF</th>
                <th className="px-4 py-3">WhatsApp Cobrança</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nfRetentionOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Nenhum pedido retido por pagamento de NF no momento.
                  </td>
                </tr>
              ) : (
                nfRetentionOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      #{order.numeroPedido}
                    </td>
                    <td className="px-4 py-3">
                      <OrderTrafficLightBadge color={order.semaforoPrazo} days={order.diasCorridos} showDetails={false} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{order.clienteNome}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-emerald-700">
                      NF-e {order.numeroNf}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      R$ {order.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenBillingModal(order)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Cobrar NF
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleConfirmNfPayment(order.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                      >
                        Liberar para Envio
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Disparo de Cobrança por WhatsApp */}
      {selectedOrderForBilling && billingPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>Cobrança Automatizada via WhatsApp</span>
              </div>
              <button
                onClick={() => setSelectedOrderForBilling(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Destinatário:</span>
                <strong className="text-slate-800">{selectedOrderForBilling.clienteNome}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Número WhatsApp:</span>
                <strong className="text-slate-800">{selectedOrderForBilling.clienteWhatsApp}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor a Liquidar:</span>
                <strong className="text-emerald-700 font-mono">
                  R$ {selectedOrderForBilling.valorTotal.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="block text-[11px] font-bold text-slate-500 mb-1">
                Preview da Mensagem Gerada:
              </span>
              <p className="font-mono text-slate-800 bg-white p-2.5 rounded border border-slate-200 whitespace-pre-wrap">
                {billingPreview.message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar Link
              </button>
              <button
                onClick={handleSendWhatsAppNow}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Abrir &amp; Enviar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
