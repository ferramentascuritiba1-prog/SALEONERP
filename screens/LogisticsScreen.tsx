import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { OrderTrafficLightBadge } from '../components/OrderTrafficLightBadge';
import { Barcode, CheckCircle2, AlertTriangle, Scale, Box, ArrowRight, PackageX } from 'lucide-react';
import { SalesOrder } from '../types/erp';

export const LogisticsScreen: React.FC = () => {
  const { orders, executeAction, addToast, refreshOrders, openOrderDetail } = useErp();
  const { currentUser } = useAuth();

  // Pedidos na esteira de separação e conferência
  const logisticsOrders = orders.filter((o) => o.status === 'em_logistica' || o.status === 'aguardando_nf');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(logisticsOrders[0] || null);
  const [scannedCode, setScannedCode] = useState('');

  const handleScanBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !scannedCode.trim()) return;

    const code = scannedCode.trim().toUpperCase();
    const itemIndex = selectedOrder.itens.findIndex((i) => i.codigo === code || i.id === code);

    if (itemIndex === -1) {
      addToast({
        tipo: 'erro',
        titulo: 'Código EAN / SKU Divergente',
        descricao: `O item ${code} não pertence a este pedido de venda!`,
      });
      setScannedCode('');
      return;
    }

    selectedOrder.itens[itemIndex].conferido = true;
    selectedOrder.itens[itemIndex].bipadoEm = new Date().toISOString();
    refreshOrders();

    addToast({
      tipo: 'sucesso',
      titulo: 'Item Bipado com Sucesso',
      descricao: `${selectedOrder.itens[itemIndex].descricao} validado na esteira.`,
    });
    setScannedCode('');
  };

  const handleFinalizeConference = () => {
    if (!selectedOrder) return;
    executeAction(selectedOrder.id, 'conferir_logistica');
    addToast({
      tipo: 'sucesso',
      titulo: 'Conferência Concluída',
      descricao: `Pedido #${selectedOrder.numeroPedido} conferido e enviado para faturamento (Aguardando NF).`,
    });
  };

  const handleSendToShortages = (itemCodigo: string) => {
    if (!selectedOrder) return;
    executeAction(selectedOrder.id, 'enviar_compras', {
      itemCodigo,
      motivo: 'Ruptura física na prateleira durante separação',
    });
  };

  return (
    <div className="space-y-4">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Separação &amp; Conferência Logística</h1>
          <p className="text-xs text-slate-500">
            Esteira operacional de bipagem, aferição de peso, cubagem e checklist de produtos.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">
          {logisticsOrders.length} pedidos na fila de separação
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna 1: Fila de Pedidos para Bipagem */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Fila de Separação (Esteira)
          </h2>

          <div className="space-y-2 max-h-[580px] overflow-y-auto">
            {logisticsOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Nenhum pedido em logística no momento.</p>
            ) : (
              logisticsOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const conferidos = order.itens.filter((i) => i.conferido).length;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-blue-700 font-mono">#{order.numeroPedido}</strong>
                      <OrderTrafficLightBadge color={order.semaforoPrazo} days={order.diasCorridos} showDetails={false} />
                    </div>
                    <p className="font-semibold text-slate-800 truncate">{order.clienteNome}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>{order.itens.length} itens</span>
                      <span className="font-bold text-slate-700">
                        {conferidos}/{order.itens.length} conferidos
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 2 e 3: Bancada de Conferência do Pedido Selecionado */}
        {selectedOrder ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Simulador de Leitor de Código de Barras */}
            <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-bold text-slate-100">
                    Bipador de Código de Barras / SKU (Pedido #{selectedOrder.numeroPedido})
                  </span>
                </div>
                <button
                  onClick={() => openOrderDetail(selectedOrder.id)}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Abrir Ficha
                </button>
              </div>

              <form onSubmit={handleScanBarcode} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite ou bipe o SKU (ex: FER-MAK-001)..."
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-colors"
                >
                  Bipar Item
                </button>
              </form>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Atalho rápido para teste:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedOrder.itens.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setScannedCode(it.codigo)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[10px]"
                    >
                      {it.codigo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist de Itens da Bancada */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-sm">Checklist Físico dos Itens</h3>
                <span className="text-slate-500">
                  Separador:{' '}
                  <strong>{selectedOrder.separadorNome || currentUser.nome}</strong>
                </span>
              </div>

              <div className="space-y-2">
                {selectedOrder.itens.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      item.conferido
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          item.conferido ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-slate-800">{item.codigo}</strong>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 rounded font-mono">
                            {item.localizacaoEstoque || 'RUA-A-01'}
                          </span>
                        </div>
                        <p className="font-medium text-slate-700">{item.descricao}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="block font-bold text-slate-900">
                          {item.quantidade} {item.unidade}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          R$ {item.valorTotal.toFixed(2)}
                        </span>
                      </div>

                      {!item.conferido && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              item.conferido = true;
                              refreshOrders();
                            }}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded text-[11px] font-semibold hover:bg-blue-700"
                          >
                            Bipar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendToShortages(item.codigo)}
                            title="Sinalizar falta física no estoque (desviar para compras)"
                            className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[11px] font-semibold flex items-center gap-1"
                          >
                            <PackageX className="w-3 h-3" /> Falta
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão de Finalização da Conferência */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  <span>Conferente: </span>
                  <strong className="text-slate-800">{currentUser.nome}</strong>
                </div>

                <button
                  onClick={handleFinalizeConference}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir Conferência &amp; Liberar NF</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            Selecione um pedido da esteira à esquerda para iniciar a bipagem física.
          </div>
        )}
      </div>
    </div>
  );
};
