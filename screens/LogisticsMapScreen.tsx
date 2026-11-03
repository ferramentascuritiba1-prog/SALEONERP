import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, Navigation, Truck, Route, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const LogisticsMapScreen: React.FC = () => {
  const { orders, executeAction, addToast, refreshOrders } = useErp();
  const { currentUser } = useAuth();

  // Pedidos prontos para expedição e coleta
  const dispatchOrders = orders.filter(
    (o) => o.status === 'aguardando_envio' || o.status === 'coleta_final'
  );

  const [selectedOrder, setSelectedOrder] = useState(dispatchOrders[0] || null);
  const [activeRouteCalculated, setActiveRouteCalculated] = useState(false);

  // Cidades mapeadas e coordenadas aproximadas para visualização
  const deliveryPoints = [
    { cidade: 'Curitiba (Matriz CIC)', x: 48, y: 52, isHub: true },
    { cidade: 'Pinhais', x: 55, y: 49 },
    { cidade: 'São José dos Pinhais', x: 54, y: 60 },
    { cidade: 'Araucária', x: 42, y: 62 },
    { cidade: 'Ponta Grossa', x: 30, y: 38 },
    { cidade: 'Joinville', x: 62, y: 78 },
    { cidade: 'Londrina', x: 22, y: 20 },
    { cidade: 'Maringá', x: 15, y: 22 },
  ];

  const handleCalculateOsrmRoute = () => {
    setActiveRouteCalculated(true);
    addToast({
      tipo: 'sucesso',
      titulo: 'Rota OSRM Calculada',
      descricao: 'Trajeto otimizado via Open Source Routing Machine: 48.2 km • 54 min estimados.',
    });
  };

  const handleDispatchCollection = (orderId: string) => {
    executeAction(orderId, 'despachar_coleta', {
      codigoRastreio: `BP-${Math.floor(Math.random() * 90000000 + 10000000)}-BR`,
      coletaRealizadaPor: 'Motorista Coleta Diária',
    });
    addToast({
      tipo: 'sucesso',
      titulo: 'Mercadoria Despachada',
      descricao: 'Romaneio de carga gerado e associado à transportadora.',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Logística &amp; Rotas de Coleta (OSRM)</h1>
          <p className="text-xs text-slate-500">
            Roteirização integrada via OpenStreetMap/Carto e cálculo de distância OSRM.
          </p>
        </div>

        <button
          onClick={handleCalculateOsrmRoute}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors self-start"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Calcular Rotas OSRM</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mapa Interativo de Entregas */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-5 text-white shadow-sm flex flex-col justify-between min-h-[460px] relative overflow-hidden">
          {/* Topo do Mapa */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-200">
                Malha Rodoviária PR/SC • Hub Ferramentas Curitiba CIC
              </span>
            </div>
            <span className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 font-mono">
              OSRM Engine: Online
            </span>
          </div>

          {/* Gráfico do Mapa Vetorial com Pontos de Entrega */}
          <div className="relative w-full h-80 my-4 bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Grid de Coordenadas */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #60a5fa 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Linhas de Rota Simuladas OSRM */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {activeRouteCalculated && (
                <>
                  <line x1="48%" y1="52%" x2="55%" y2="49%" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                  <line x1="48%" y1="52%" x2="54%" y2="60%" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                  <line x1="48%" y1="52%" x2="42%" y2="62%" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                  <line x1="48%" y1="52%" x2="30%" y2="38%" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                </>
              )}
            </svg>

            {/* Pins no Mapa */}
            {deliveryPoints.map((pt) => (
              <div
                key={pt.cidade}
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
                    pt.isHub
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/30'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {pt.isHub ? <Truck className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-semibold bg-slate-900/90 text-slate-200 px-1.5 py-0.5 rounded mt-1 border border-slate-700 whitespace-nowrap shadow-sm">
                  {pt.cidade}
                </span>
              </div>
            ))}
          </div>

          {/* Rodapé do Mapa com Telemetria OSRM */}
          <div className="z-10 bg-slate-950/90 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
            <div>
              <span className="text-slate-500 block text-[10px]">Ponto de Partida:</span>
              <strong className="text-white">CD Central FC (Rua João Bettega, CIC - Curitiba)</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Cálculo OSRM:</span>
              <span className="text-cyan-400 font-mono font-bold">4 Cargas Agrupadas (Rota Sul)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Distância Total:</span>
              <span className="text-emerald-400 font-mono font-bold">148.5 km</span>
            </div>
          </div>
        </div>

        {/* Coluna Lateral: Pedidos Prontos para Despacho */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-bold text-slate-900 text-sm">Prontos para Coleta</h2>
            <span className="font-semibold text-slate-500">{dispatchOrders.length} cargas</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto">
            {dispatchOrders.length === 0 ? (
              <p className="text-slate-400 py-8 text-center">Nenhum pedido aguardando despacho no momento.</p>
            ) : (
              dispatchOrders.map((order) => (
                <div key={order.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <strong className="font-mono text-blue-700">#{order.numeroPedido}</strong>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {order.transportadoraNome}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 truncate">{order.clienteNome}</p>
                  <p className="text-[11px] text-slate-500">
                    {order.clienteCidade}/{order.clienteUf} • NF: {order.numeroNf || 'Emitida'}
                  </p>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">
                      R$ {order.valorTotal.toFixed(2)}
                    </span>
                    {order.status === 'aguardando_envio' ? (
                      <button
                        onClick={() => handleDispatchCollection(order.id)}
                        className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded font-semibold text-[11px] transition-colors"
                      >
                        Despachar Coleta
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                        Coletado ({order.codigoRastreio})
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
