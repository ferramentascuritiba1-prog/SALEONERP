import React from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { Award, TrendingUp, Users, DollarSign, Target, ChevronRight } from 'lucide-react';

export const SellersScreen: React.FC = () => {
  const { orders } = useErp();
  const { allUsers, currentCompany } = useAuth();

  const sellers = allUsers.filter((u) => u.setor === 'vendedor' && (u.empresa === currentCompany || u.empresa === 'TODAS'));

  // Consolida métricas por vendedor
  const sellerStats = sellers.map((seller) => {
    const sellerOrders = orders.filter((o) => o.vendedorId === seller.id || o.vendedorNome.includes(seller.nome.split(' ')[0]));
    const totalVendas = sellerOrders.reduce((acc, o) => acc + o.valorTotal, 0);
    const totalComissao = sellerOrders.reduce((acc, o) => acc + o.valorComissao, 0);
    const metaMensal = 40000.0;
    const atingimento = metaMensal > 0 ? Math.min(100, Math.round((totalVendas / metaMensal) * 100)) : 0;

    return {
      seller,
      totalVendas,
      totalComissao,
      pedidosCount: sellerOrders.length,
      metaMensal,
      atingimento,
    };
  }).sort((a, b) => b.totalVendas - a.totalVendas);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Vendedores &amp; Metas Comerciais</h1>
          <p className="text-xs text-slate-500">
            Acompanhamento de desempenho da equipe de televendas e representantes ({currentCompany}).
          </p>
        </div>
      </div>

      {sellerStats.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-2xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Nenhum vendedor cadastrado no momento</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cadastre novos colaboradores com o setor "vendedor" e função (ex: Gerente de Vendas ou Consultor Comercial) na tela de Usuários para acompanhar metas e comissões.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sellerStats.map((item, index) => (
          <div key={item.seller.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {index + 1}º
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">{item.seller.nome}</h3>
                  <span className="text-[10px] text-slate-500">{item.seller.email}</span>
                </div>
              </div>
              {index === 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Líder do Mês
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Vendido no Mês:</span>
                <strong className="text-slate-900 font-mono text-sm">
                  R$ {item.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Comissão Acumulada:</span>
                <strong className="text-emerald-700 font-mono">
                  R$ {item.totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Pedidos Fechados:</span>
                <span className="font-bold text-slate-800">{item.pedidosCount}</span>
              </div>
            </div>

            {/* Barra de Progresso da Meta */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-500">Meta: R$ {item.metaMensal.toLocaleString('pt-BR')}</span>
                <span className="text-blue-600">{item.atingimento}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.atingimento}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};
