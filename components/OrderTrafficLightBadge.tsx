import React from 'react';
import { TrafficLightColor } from '../types/erp';
import { Timer, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  color: TrafficLightColor;
  days: number;
  showDetails?: boolean;
}

export const OrderTrafficLightBadge: React.FC<Props> = ({ color, days, showDetails = true }) => {
  if (color === 'verde') {
    return (
      <span
        title={`Prazo operacional dentro do padrão: ${days} dias (limite 4 dias)`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Timer className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-mono">{days} {days === 1 ? 'dia' : 'dias'}</span>
        {showDetails && <span className="text-[10px] text-emerald-600/80 font-normal">(Prazo OK)</span>}
      </span>
    );
  }

  if (color === 'amarelo') {
    return (
      <span
        title={`Atenção operacional: ${days} dias corridos (faixa de atenção 4 a 9 dias)`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300"
      >
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span className="font-mono font-bold">{days} dias</span>
        {showDetails && <span className="text-[10px] text-amber-700/80 font-normal">(Atenção)</span>}
      </span>
    );
  }

  return (
    <span
      title={`Prazo crítico estourado: ${days} dias corridos (acima de 9 dias)`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs"
    >
      <span className="w-2 h-2 rounded-full bg-rose-600 animate-bounce" />
      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
      <span className="font-bold font-mono">{days} dias</span>
      {showDetails && <span className="text-[10px] text-rose-700/90 font-medium">(Crítico &gt;9d)</span>}
    </span>
  );
};
