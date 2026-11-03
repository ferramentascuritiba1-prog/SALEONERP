import React, { useState } from 'react';
import { api } from '../services/api';
import { SalesOrder } from '../types/erp';
import { STATUS_LABELS } from '../services/orderStateMachine';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export const PublicTrackingScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('10410');
  const [trackedOrder, setTrackedOrder] = useState<SalesOrder | null>(() =>
    api.trackOrderPublic('10410')
  );
  const [hasSearched, setHasSearched] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const res = api.trackOrderPublic(searchQuery);
    setTrackedOrder(res);
    setHasSearched(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Cabeçalho da Página Pública */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Portal Oficial de Rastreamento Saleon ERP</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Acompanhe seu Pedido de Venda
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Saleon ERP — Ferramentas Curitiba &amp; Loja do Abastecimento. Consulte em tempo real a situação de transporte da sua encomenda.
        </p>
      </div>

      {/* Caixa de Busca Pública */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite o número do pedido, CPF/CNPJ ou código de rastreio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
          >
            Rastrear
          </button>
        </form>
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 px-1">
          <span>Exemplos para teste: 10452, 10410, 10390 ou 10440</span>
          <span>Atualizado a cada 30 segundos</span>
        </div>
      </div>

      {/* Resultado do Rastreamento */}
      {hasSearched && trackedOrder ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-6 p-6 animate-in fade-in duration-150">
          {/* Header do Pedido */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  Pedido #{trackedOrder.numeroPedido}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                  {trackedOrder.rootId === 'FC' ? 'Ferramentas Curitiba' : 'Loja do Abastecimento'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Destinatário: <strong className="text-slate-800">{trackedOrder.clienteNome}</strong> • {trackedOrder.clienteCidade}/{trackedOrder.clienteUf}
              </p>
            </div>

            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">Status Operacional:</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-800 inline-block mt-0.5">
                {STATUS_LABELS[trackedOrder.status].label}
              </span>
            </div>
          </div>

          {/* Linha do Tempo Visual das Etapas */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-xs">Etapas da sua Encomenda:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className={`p-3 rounded-lg border text-center ${trackedOrder.dataCriacao ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50'}`}>
                <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                <span className="font-bold block text-slate-800">1. Pedido Confirmado</span>
                <span className="text-[10px] text-slate-500">Pagamento aprovado</span>
              </div>

              <div className={`p-3 rounded-lg border text-center ${trackedOrder.conferenciaRealizada ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50'}`}>
                <Package className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <span className="font-bold block text-slate-800">2. Separado &amp; Embalado</span>
                <span className="text-[10px] text-slate-500">{trackedOrder.medidas.volumes} volumes ({trackedOrder.medidas.pesoBrutoKg} kg)</span>
              </div>

              <div className={`p-3 rounded-lg border text-center ${trackedOrder.numeroNf ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50'}`}>
                <Truck className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                <span className="font-bold block text-slate-800">3. Coletado p/ Envio</span>
                <span className="text-[10px] text-slate-500">{trackedOrder.transportadoraNome}</span>
              </div>

              <div className={`p-3 rounded-lg border text-center ${trackedOrder.status === 'finalizado' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50'}`}>
                <MapPin className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                <span className="font-bold block text-slate-800">4. Entregue</span>
                <span className="text-[10px] text-slate-500">{trackedOrder.status === 'finalizado' ? 'Concluído' : 'Em trânsito'}</span>
              </div>
            </div>
          </div>

          {/* Dados de Envio e Transportadora */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-500 block text-[11px]">Transportadora:</span>
              <strong className="text-slate-900">{trackedOrder.transportadoraNome}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Código de Rastreamento:</span>
              <strong className="text-blue-700 font-mono">
                {trackedOrder.codigoRastreio || 'Em processamento pelo CD'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Nota Fiscal Eletrônica:</span>
              <span className="text-slate-800 font-mono font-semibold">
                {trackedOrder.numeroNf ? `NF-e ${trackedOrder.numeroNf}` : 'Em emissão'}
              </span>
            </div>
          </div>

          {/* Itens do Pacote */}
          <div>
            <h3 className="font-bold text-slate-800 mb-2">Itens Inclusos no Envio:</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {trackedOrder.itens.map((it) => (
                <div key={it.id} className="p-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] mr-2">{it.codigo}</span>
                    <strong className="text-slate-800">{it.descricao}</strong>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">
                    {it.quantidade} {it.unidade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : hasSearched ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2 max-w-lg mx-auto">
          <p className="text-slate-700 font-bold">Nenhum pedido localizado com o termo informado.</p>
          <p className="text-xs text-slate-500">
            Verifique o número do pedido ou CPF/CNPJ digitado e tente novamente.
          </p>
        </div>
      ) : null}
    </div>
  );
};
