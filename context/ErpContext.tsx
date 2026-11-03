/**
 * NexGestor ERP - Contexto Principal da Aplicação
 * Gerenciamento de telas (12 principais + 8 secundárias),
 * ciclo de vida dos pedidos, transições, e polling com cleanup ao sair da tela.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SalesOrder, OrderAction } from '../types/erp';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface ToastMessage {
  id: string;
  tipo: 'sucesso' | 'info' | 'alerta' | 'erro';
  titulo: string;
  descricao?: string;
}

interface ErpContextType {
  orders: SalesOrder[];
  selectedOrderId: string | null;
  selectedOrder: SalesOrder | null;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  openOrderDetail: (id: string) => void;
  closeOrderDetail: () => void;
  refreshOrders: () => void;
  executeAction: (orderId: string, action: OrderAction, params?: Record<string, any>) => boolean;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  lastHeartbeat: string;
  isPollingActive: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  counts: {
    total: number;
    conferenciaPagamento: number;
    aprovacaoGerente: number;
    novo: number;
    pedidoGerado: number;
    emLogistica: number;
    aguardandoNf: number;
    aguardandoEnvio: number;
    coletaFinal: number;
    finalizado: number;
    compras: number;
    pagamentoNf: number;
    cancelado: number;
    semaforoVermelho: number;
  };
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentCompany, currentUser } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>(() => api.getOrders(currentCompany));
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeScreen, setActiveScreenState] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>(new Date().toLocaleTimeString('pt-BR'));
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('saleon_theme') === 'dark' ? 'dark' : 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('saleon_theme', newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('theme-black');
    } else {
      document.body.classList.remove('theme-black');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('theme-black');
    } else {
      document.body.classList.remove('theme-black');
    }
  }, [theme]);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString().slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshOrders = useCallback(() => {
    const freshOrders = api.getOrders(currentCompany);
    setOrders(freshOrders);
    setLastHeartbeat(new Date().toLocaleTimeString('pt-BR'));
  }, [currentCompany]);

  // Recarrega sempre que mudar de empresa (FC <-> LA)
  useEffect(() => {
    refreshOrders();
  }, [currentCompany, refreshOrders]);

  // Polling em tempo real com controle de ciclo de vida e cleanup:
  // - Contadores e menu a cada 30 s
  // - Notificações a cada 60 s
  // - Status Bling a cada 5 min (300 s)
  // Requisito específico atendido: O polling do Dashboard NÃO deve continuar rodando se sair da tela!
  useEffect(() => {
    setIsPollingActive(true);

    // 1. Polling de contadores gerais (30s)
    const countersTimer = setInterval(() => {
      refreshOrders();
    }, 30000);

    // 2. Polling específico de Dashboard (ativo SOMENTE quando na tela 'dashboard' ou 'dashboard_la')
    let dashboardTimer: NodeJS.Timeout | null = null;
    if (activeScreen === 'dashboard' || activeScreen === 'dashboard_la') {
      dashboardTimer = setInterval(() => {
        refreshOrders();
      }, 15000); // Atualização mais frequente de KPIs apenas na tela do Dashboard
    }

    // 3. Polling de status Bling (5 minutos)
    const blingTimer = setInterval(() => {
      // Simula sincronização periódica de lote com o Bling
      addToast({
        tipo: 'info',
        titulo: 'Sincronização Periódica Bling',
        descricao: 'Verificação periódica de pedidos concluída (a cada 5 min).',
      });
      refreshOrders();
    }, 300000);

    return () => {
      clearInterval(countersTimer);
      if (dashboardTimer) {
        clearInterval(dashboardTimer); // Limpeza correta ao sair da tela do Dashboard!
      }
      clearInterval(blingTimer);
      setIsPollingActive(false);
    };
  }, [activeScreen, refreshOrders, addToast]);

  const setActiveScreen = (screen: string) => {
    setActiveScreenState(screen);
    // Se mudar de tela, fecha o detalhe de pedido aberto
    setSelectedOrderId(null);
  };

  const openOrderDetail = (id: string) => {
    setSelectedOrderId(id);
    // Dispara a sincronização de 1ª abertura com o Bling (?silent=1)
    const { syncedWithBlingFirstOpen } = api.getOrderById(id, () => {
      addToast({
        tipo: 'info',
        titulo: 'Bling API v3 Sincronizada',
        descricao: 'Pedido sincronizado silenciosamente na primeira abertura (?silent=1).',
      });
    });
    if (syncedWithBlingFirstOpen) {
      refreshOrders();
    }
  };

  const closeOrderDetail = () => {
    setSelectedOrderId(null);
  };

  const executeAction = (orderId: string, action: OrderAction, params?: Record<string, any>): boolean => {
    const result = api.executeOrderAction(orderId, action, currentUser, params);
    if (result.success) {
      refreshOrders();
      addToast({
        tipo: 'sucesso',
        titulo: 'Ação executada com sucesso',
        descricao: `Pedido #${result.order?.numeroPedido}: ${action.replace(/_/g, ' ')}.`,
      });
      return true;
    } else {
      addToast({
        tipo: 'erro',
        titulo: 'Falha na transição',
        descricao: result.error || 'Não foi possível executar a ação no pedido.',
      });
      return false;
    }
  };

  const selectedOrder = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) || null : null;

  // Contadores por status para badges do menu e dashboard
  const counts = {
    total: orders.length,
    conferenciaPagamento: orders.filter((o) => o.status === 'conferencia_pagamento').length,
    aprovacaoGerente: orders.filter((o) => o.status === 'aprovacao_gerente').length,
    novo: orders.filter((o) => o.status === 'novo').length,
    pedidoGerado: orders.filter((o) => o.status === 'pedido_gerado').length,
    emLogistica: orders.filter((o) => o.status === 'em_logistica').length,
    aguardandoNf: orders.filter((o) => o.status === 'aguardando_nf').length,
    aguardandoEnvio: orders.filter((o) => o.status === 'aguardando_envio').length,
    coletaFinal: orders.filter((o) => o.status === 'coleta_final').length,
    finalizado: orders.filter((o) => o.status === 'finalizado').length,
    compras: orders.filter((o) => o.status === 'compras').length,
    pagamentoNf: orders.filter((o) => o.status === 'pagamento_nf').length,
    cancelado: orders.filter((o) => o.status === 'cancelado').length,
    semaforoVermelho: orders.filter((o) => o.semaforoPrazo === 'vermelho' && o.status !== 'finalizado' && o.status !== 'cancelado').length,
  };

  return (
    <ErpContext.Provider
      value={{
        orders,
        selectedOrderId,
        selectedOrder,
        activeScreen,
        setActiveScreen,
        openOrderDetail,
        closeOrderDetail,
        refreshOrders,
        executeAction,
        toasts,
        addToast,
        removeToast,
        lastHeartbeat,
        isPollingActive,
        theme,
        setTheme,
        toggleTheme,
        counts,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
};

export const useErp = () => {
  const context = useContext(ErpContext);
  if (!context) {
    throw new Error('useErp deve ser utilizado dentro de ErpProvider');
  }
  return context;
};
