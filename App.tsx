/**
 * Saleon ERP - Aplicação Principal
 * Multiempresa (Ferramentas Curitiba e Loja do Abastecimento)
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErpProvider, useErp } from './context/ErpContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';

// Telas do Sistema
import { DashboardScreen } from './screens/DashboardScreen';
import { DashboardLaScreen } from './screens/DashboardLaScreen';
import { OrdersListScreen } from './screens/OrdersListScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { NewOrderScreen } from './screens/NewOrderScreen';
import { LogisticsScreen } from './screens/LogisticsScreen';
import { LogisticsMapScreen } from './screens/LogisticsMapScreen';
import { FinancialScreen } from './screens/FinancialScreen';
import { PurchasesScreen } from './screens/PurchasesScreen';
import { SacScreen } from './screens/SacScreen';
import { SellersScreen } from './screens/SellersScreen';
import { SiteOrdersScreen } from './screens/SiteOrdersScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { UsersScreen } from './screens/UsersScreen';
import { BulkEditorScreen } from './screens/BulkEditorScreen';
import { PublicTrackingScreen } from './screens/PublicTrackingScreen';
import { AuditLogScreen } from './screens/AuditLogScreen';
import { CarriersScreen } from './screens/CarriersScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { ScreenCatalogScreen } from './screens/ScreenCatalogScreen';
import { ArchitectureDocsScreen } from './screens/ArchitectureDocsScreen';
import { LoginScreen } from './components/LoginScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeScreen, selectedOrder } = useErp();
  const { isAuthenticated, lockoutTimer, currentUser } = useAuth();

  // Se não autenticado, renderiza a tela de login
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  const renderActiveScreen = () => {
    // Se estiver na tela de pedidos e tiver um pedido selecionado, abre a ficha detalhada
    if (activeScreen === 'pedidos' && selectedOrder) {
      return <OrderDetailScreen order={selectedOrder} />;
    }

    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'dashboard_la':
        return <DashboardLaScreen />;
      case 'pedidos':
        return <OrdersListScreen />;
      case 'novo_pedido':
        return <NewOrderScreen />;
      case 'separacao_conferencia':
        return <LogisticsScreen />;
      case 'logistica_coletas':
        return <LogisticsMapScreen />;
      case 'financeiro':
        return <FinancialScreen />;
      case 'compras':
        return <PurchasesScreen />;
      case 'sac':
        return <SacScreen />;
      case 'vendedores':
        return <SellersScreen />;
      case 'pedidos_site':
        return <SiteOrdersScreen />;
      case 'configuracoes':
        return <SettingsScreen />;
      case 'usuarios':
        return <UsersScreen />;
      case 'edicao_mestre':
        return <BulkEditorScreen />;
      case 'rastreio_publico':
        return <PublicTrackingScreen />;
      case 'auditoria_transicoes':
        return <AuditLogScreen />;
      case 'relatorios':
        return <ReportsScreen />;
      case 'transportadoras':
        return <CarriersScreen />;
      case 'catalogo_20_telas':
        return <ScreenCatalogScreen />;
      case 'arquitetura_docs':
        return <ArchitectureDocsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Modal Obrigatório de Alteração de Senha no Primeiro Login */}
      {currentUser.precisaAlterarSenha && <ChangePasswordModal />}

      {/* Banner de Rate-Limit Lockout se ativo */}
      {lockoutTimer > 0 && (
        <div className="bg-rose-600 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 animate-pulse">
          <Lock className="w-4 h-4" />
          <span>
            Segurança Ativada: Tentativas excessivas de login detectadas. Rate-limit ativo por {lockoutTimer}s.
          </span>
        </div>
      )}

      {/* Cabeçalho */}
      <Header />

      {/* Estrutura Principal */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Notificações Flutuantes */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ErpProvider>
        <AppContent />
      </ErpProvider>
    </AuthProvider>
  );
}
