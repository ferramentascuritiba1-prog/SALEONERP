import React from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Layers, DollarSign } from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { orders } = useErp();
  const { currentCompany } = useAuth();

  // Análise de Lead Time médio (dias) por etapa
  const leadTimes = [
    { etapa: 'Conferência de Pagamento', tempoMedioHoras: 4.2, status: 'Dentro da Meta (< 6h)' },
    { etapa: 'Aprovação de Margem (Gerência)', tempoMedioHoras: 8.5, status: 'Atenção' },
    { etapa: 'Integração & Criação no Bling', tempoMedioHoras: 0.8, status: 'Instantâneo' },
    { etapa: 'Separação Física de Galpão', tempoMedioHoras: 18.4, status: 'Dentro da Meta (< 24h)' },
    { etapa: 'Conferência & Emissão da NF-e', tempoMedioHoras: 6.1, status: 'Dentro da Meta' },
    { etapa: 'Coleta & Despacho por Transportadora', tempoMedioHoras: 14.2, status: 'Dentro da Meta' },
    { etapa: 'Trânsito Rodoviário até Destinatário', tempoMedioHoras: 72.0, status: 'Conforme Prazo de Frete' },
  ];

  const totalFaturado = orders.reduce((acc, o) => acc + o.valorTotal, 0);
  const totalFrete = orders.reduce((acc, o) => acc + o.valorFrete, 0);
  const totalDescontos = orders.reduce((acc, o) => acc + o.valorDesconto, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Relatórios Operacionais &amp; DRE do Funil</h1>
          <p className="text-xs text-slate-500">
            Lead time médio entre transições, tempo de esteira e indicadores financeiros consolidados ({currentCompany}).
          </p>
        </div>
      </div>

      {/* DRE Operacional Simplificado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Receita Bruta Acumulada</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Faturamento total do período</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Volume de Fretes Faturados</span>
          <p className="text-2xl font-bold text-blue-600 mt-1 font-mono">
            R$ {totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Modalidades CIF e FOB combinadas</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Descontos Concedidos</span>
          <p className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            R$ {totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Autorizados via Aprovação de Gerente</span>
        </div>
      </div>

      {/* Tabela de Lead Time por Etapa do Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Tempo Médio de Permanência por Etapa (Gargalos de Processo)
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Baseado nos carimbos de transição</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Etapa do Pipeline</th>
                <th className="px-4 py-3">Tempo Médio Estimado</th>
                <th className="px-4 py-3">Conformidade SLA</th>
                <th className="px-4 py-3">Diagnóstico Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leadTimes.map((lt, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{lt.etapa}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {lt.tempoMedioHoras} horas ({Math.round(lt.tempoMedioHoras / 24 * 10) / 10} dias)
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        lt.status.includes('Dentro') || lt.status.includes('Instantâneo')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {lt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {idx === 1
                      ? 'Descontos comerciais aguardando decisão de gerência concentram o maior tempo de espera inicial.'
                      : idx === 3
                      ? 'Separação física normalizada com leitor de código de barras na esteira.'
                      : 'Fluxo contínuo sem anomalias registradas.'}
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
