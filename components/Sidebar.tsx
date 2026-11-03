import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import {
  Gauge,
  ReceiptText,
  FilePlus2,
  ScanBarcode,
  Route,
  Landmark,
  Boxes,
  LifeBuoy,
  Target,
  Store,
  Layers3,
  ScrollText,
  SlidersHorizontal,
  UserCog,
  TableProperties,
  ScanLine,
  Scroll,
  PieChart,
  Forklift,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeScreen, setActiveScreen, counts } = useErp();
  const { currentUser, currentCompany } = useAuth();
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  // 12 Telas Visíveis no Menu Principal (Ícones Modernizados com alta precisão semântica)
  const primaryMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard FC',
      icon: Gauge,
      badge: counts.semaforoVermelho > 0 ? `${counts.semaforoVermelho} SLA` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'pedidos',
      label: 'Pedidos de Venda',
      icon: ReceiptText,
      badge: counts.total > 0 ? String(counts.total) : undefined,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'novo_pedido',
      label: 'Novo Pedido',
      icon: FilePlus2,
    },
    {
      id: 'separacao_conferencia',
      label: 'Separação & Conf.',
      icon: ScanBarcode,
      badge: counts.emLogistica > 0 ? String(counts.emLogistica) : undefined,
      badgeColor: 'bg-cyan-100 text-cyan-700',
    },
    {
      id: 'logistica_coletas',
      label: 'Logística & Coletas',
      icon: Route,
      badge: counts.aguardandoEnvio > 0 ? String(counts.aguardandoEnvio) : undefined,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'financeiro',
      label: 'Financeiro & Cobrança',
      icon: Landmark,
      badge: counts.conferenciaPagamento + counts.pagamentoNf > 0
        ? String(counts.conferenciaPagamento + counts.pagamentoNf)
        : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'compras',
      label: 'Compras & Rupturas',
      icon: Boxes,
      restricted: !currentUser.isRoot && currentUser.setor !== 'comprador',
      badge: counts.compras > 0 ? String(counts.compras) : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'sac',
      label: 'SAC & Ocorrências',
      icon: LifeBuoy,
    },
    {
      id: 'vendedores',
      label: 'Vendedores & Metas',
      icon: Target,
    },
    {
      id: 'pedidos_site',
      label: 'Pedidos do Site',
      icon: Store,
      restricted: !currentUser.isRoot && !['vendedor', 'financeiro'].includes(currentUser.setor),
    },
    {
      id: 'dashboard_la',
      label: 'Dashboard LA',
      icon: Layers3,
      restricted: !currentUser.isRoot && currentUser.empresa !== 'LA' && currentUser.empresa !== 'TODAS',
      badge: 'LA',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'arquitetura_docs',
      label: 'Entregáveis & DDL',
      icon: ScrollText,
      badge: '7 Docs',
      badgeColor: 'bg-purple-100 text-purple-700 font-bold',
    },
  ];

  // 8 Telas Secundárias / Ocultas / Administrativas
  const secondaryMenuItems = [
    { id: 'configuracoes', label: '13. Configurações & Bling', icon: SlidersHorizontal },
    { id: 'usuarios', label: '14. 29 Usuários & Setores', icon: UserCog },
    { id: 'edicao_mestre', label: '15. Edição Mestre (Bulk)', icon: TableProperties },
    { id: 'rastreio_publico', label: '16. Rastreio Público', icon: ScanLine },
    { id: 'auditoria_transicoes', label: '17. Auditoria das 22 Ações', icon: Scroll },
    { id: 'relatorios', label: '18. Relatórios Operacionais', icon: PieChart },
    { id: 'transportadoras', label: '19. Transportadoras', icon: Forklift },
    { id: 'catalogo_20_telas', label: '20. Dicionário das 20 Telas', icon: ChevronRight },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Indicador de Tenant Ativo */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                currentCompany === 'FC' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
            />
            {currentCompany === 'FC' ? 'Ferramentas Curitiba' : 'Loja do Abastecimento'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">root_id: {currentCompany}</span>
        </div>
      </div>

      {/* 12 Telas Visíveis */}
      <div className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Principal (12 Telas)
        </div>

        {primaryMenuItems.map((item) => {
          const isActive = activeScreen === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.restricted && (
                  <span
                    title="Acesso restrito por perfil (retornará 403 se seu usuário não tiver permissão)"
                    className="text-[10px] text-amber-500"
                  >
                    🔒
                  </span>
                )}
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Separador e Toggle para as 8 Telas Secundárias */}
        <div className="pt-4 pb-1">
          <button
            onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span>Telas Secundárias (8 Telas)</span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showSecondaryMenu ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>

        {showSecondaryMenu && (
          <div className="space-y-0.5 pl-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {secondaryMenuItems.map((item) => {
              const isActive = activeScreen === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Rodapé com Informações da Sessão */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Setor:</span>
          <span className="font-semibold text-slate-700 capitalize">{currentUser.setor}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Escopo:</span>
          <span className="font-semibold text-slate-700 uppercase">{currentUser.escopo}</span>
        </div>
      </div>
    </aside>
  );
};
