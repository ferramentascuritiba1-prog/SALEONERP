/**
 * Saleon ERP - Camada de Serviços da API
 * Implementação cliente-servidor com armazenamento persistente em localStorage,
 * controle de permissões por setor, bloqueio contra brute-force,
 * e mascaramento de credenciais.
 */

import {
  User,
  SalesOrder,
  Carrier,
  InventoryShortage,
  SACTicket,
  IntegrationSettings,
  CompanyId,
  OrderAction,
  OrderStatus,
  TransitionLog,
} from '../types/erp';
import {
  INITIAL_USERS,
  INITIAL_CARRIERS,
  INITIAL_ORDERS,
  INITIAL_SHORTAGES,
  INITIAL_SAC_TICKETS,
  INITIAL_SETTINGS,
} from '../data/mockDatabase';
import { calculateTrafficLight } from './orderStateMachine';

const STORAGE_KEYS = {
  USERS: 'saleon_users_v3',
  PASSWORDS: 'saleon_passwords_v3',
  ORDERS: 'saleon_orders_v3',
  CARRIERS: 'saleon_carriers_v3',
  SHORTAGES: 'saleon_shortages_v3',
  SAC: 'saleon_sac_v3',
  SETTINGS: 'saleon_settings_v3',
  CURRENT_USER_ID: 'saleon_curr_user_id',
  CURRENT_COMPANY: 'saleon_curr_company',
  BLING_FIRST_OPEN_SEEN: 'saleon_bling_opened_orders_v3',
};

class ErpApiService {
  private users: User[] = [];
  private userPasswords: Record<string, string> = { usr_admin: '123456' };
  private orders: SalesOrder[] = [];
  private carriers: Carrier[] = [];
  private shortages: InventoryShortage[] = [];
  private sacTickets: SACTicket[] = [];
  private settings: IntegrationSettings = INITIAL_SETTINGS;
  private openedOrdersForBlingSync: Set<string> = new Set();

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    try {
      // Limpeza de chaves legadas com dados fictícios anteriores
      const legacyKeys = [
        'nexgestor_users_v2',
        'nexgestor_orders_v2',
        'nexgestor_carriers_v2',
        'nexgestor_shortages_v2',
        'nexgestor_sac_v2',
        'nexgestor_settings_v2',
        'nexgestor_curr_user_id',
        'nexgestor_curr_company',
        'nexgestor_bling_opened_orders',
      ];
      legacyKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      });

      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : [...INITIAL_USERS];

      const storedPasswords = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      this.userPasswords = storedPasswords ? JSON.parse(storedPasswords) : { usr_admin: '123456' };

      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      this.orders = storedOrders ? JSON.parse(storedOrders) : [...INITIAL_ORDERS];

      const storedCarriers = localStorage.getItem(STORAGE_KEYS.CARRIERS);
      this.carriers = storedCarriers ? JSON.parse(storedCarriers) : [...INITIAL_CARRIERS];

      const storedShortages = localStorage.getItem(STORAGE_KEYS.SHORTAGES);
      this.shortages = storedShortages ? JSON.parse(storedShortages) : [...INITIAL_SHORTAGES];

      const storedSac = localStorage.getItem(STORAGE_KEYS.SAC);
      this.sacTickets = storedSac ? JSON.parse(storedSac) : [...INITIAL_SAC_TICKETS];

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.settings = storedSettings ? JSON.parse(storedSettings) : { ...INITIAL_SETTINGS };

      const storedBlingSeen = localStorage.getItem(STORAGE_KEYS.BLING_FIRST_OPEN_SEEN);
      if (storedBlingSeen) {
        this.openedOrdersForBlingSync = new Set(JSON.parse(storedBlingSeen));
      }
    } catch {
      this.users = [...INITIAL_USERS];
      this.userPasswords = { usr_admin: '123456' };
      this.orders = [...INITIAL_ORDERS];
      this.carriers = [...INITIAL_CARRIERS];
      this.shortages = [...INITIAL_SHORTAGES];
      this.sacTickets = [...INITIAL_SAC_TICKETS];
      this.settings = { ...INITIAL_SETTINGS };
    }
    this.persistAll();
  }

  private persistAll() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(this.userPasswords));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_KEYS.CARRIERS, JSON.stringify(this.carriers));
      localStorage.setItem(STORAGE_KEYS.SHORTAGES, JSON.stringify(this.shortages));
      localStorage.setItem(STORAGE_KEYS.SAC, JSON.stringify(this.sacTickets));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(
        STORAGE_KEYS.BLING_FIRST_OPEN_SEEN,
        JSON.stringify(Array.from(this.openedOrdersForBlingSync))
      );
    } catch (e) {
      console.warn('Erro ao persistir no localStorage:', e);
    }
  }

  // --- Autenticação Case-Insensitive, Senha Real, Rate-Limit & Primeiro Acesso ---
  public login(
    rawUsername: string,
    rawPassword: string
  ): {
    success: boolean;
    user?: User;
    error?: string;
    lockedSeconds?: number;
    precisaAlterarSenha?: boolean;
  } {
    const cleanUsername = rawUsername.trim().toLowerCase();

    // Localiza usuário independente de maiúsculas/minúsculas
    const userIndex = this.users.findIndex(
      (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanUsername
    );

    if (userIndex === -1) {
      return { success: false, error: 'Usuário não localizado no sistema.' };
    }

    const user = this.users[userIndex];

    // Checa se usuário está bloqueado por rate limit
    const now = Date.now();
    if (user.bloqueadoAte && user.bloqueadoAte > now) {
      const remainingSeconds = Math.ceil((user.bloqueadoAte - now) / 1000);
      return {
        success: false,
        error: `Acesso temporariamente bloqueado por segurança. Aguarde ${remainingSeconds}s ou contate o administrador.`,
        lockedSeconds: remainingSeconds,
      };
    }

    // Validação da senha armazenada (padrão '123456')
    const expectedPassword = this.userPasswords[user.id] || '123456';
    if (rawPassword !== expectedPassword) {
      const falhas = (user.tentativasFalhas || 0) + 1;
      let bloqueadoAte = null;
      if (falhas >= 3) {
        bloqueadoAte = now + 30 * 1000; // 30 segundos de penalidade
      }
      this.users[userIndex] = {
        ...user,
        tentativasFalhas: falhas,
        bloqueadoAte,
      };
      this.persistAll();

      if (falhas >= 3) {
        return {
          success: false,
          error: 'Conta temporariamente bloqueada por 30 segundos devido a 3 tentativas incorretas.',
          lockedSeconds: 30,
        };
      }
      return {
        success: false,
        error: `Senha incorreta. Tentativa ${falhas} de 3 antes do bloqueio de segurança.`,
      };
    }

    // Sucesso: reseta tentativas falhas
    this.users[userIndex] = {
      ...user,
      tentativasFalhas: 0,
      bloqueadoAte: null,
    };
    this.persistAll();

    return {
      success: true,
      user: this.users[userIndex],
      precisaAlterarSenha: Boolean(this.users[userIndex].precisaAlterarSenha),
    };
  }

  // Alteração obrigatória de senha no primeiro login ou por redefinição
  public changeUserPassword(
    userId: string,
    newPassword: string
  ): { success: boolean; error?: string } {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não localizado.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova senha deve possuir no mínimo 6 caracteres.' };
    }

    if (newPassword === '123456') {
      return {
        success: false,
        error: 'A nova senha não pode ser igual à senha padrão provisória (123456). Escolha uma senha segura.',
      };
    }

    this.userPasswords[userId] = newPassword;
    this.users[userIndex] = {
      ...this.users[userIndex],
      precisaAlterarSenha: false,
      primeiroLoginRealizado: true,
      tentativasFalhas: 0,
      bloqueadoAte: null,
    };
    this.persistAll();

    return { success: true };
  }

  // Reset de senha administrativo para o padrão 123456 (forçando nova troca)
  public resetUserPasswordToDefault(userId: string): boolean {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return false;

    this.userPasswords[userId] = '123456';
    this.users[userIndex] = {
      ...this.users[userIndex],
      precisaAlterarSenha: true,
      primeiroLoginRealizado: false,
      tentativasFalhas: 0,
      bloqueadoAte: null,
    };
    this.persistAll();
    return true;
  }

  public unlockUser(userId: string): boolean {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      this.users[idx].tentativasFalhas = 0;
      this.users[idx].bloqueadoAte = null;
      this.persistAll();
      return true;
    }
    return false;
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public saveUser(user: Partial<User> & { id?: string; initialPassword?: string }): User {
    if (user.id) {
      const idx = this.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        this.users[idx] = { ...this.users[idx], ...user } as User;
        this.persistAll();
        return this.users[idx];
      }
    }
    const newUserId = `usr_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      nome: user.nome || 'Novo Colaborador',
      email: user.email || '',
      username: (user.username || 'usuario').toLowerCase().trim(),
      funcao: user.funcao || 'Colaborador Operacional',
      setor: user.setor || 'vendedor',
      empresa: user.empresa || 'FC',
      escopo: user.escopo || 'restrito',
      isRoot: user.setor === 'root',
      ativo: true,
      // Requisito: para todos após o primeiro login precisar alterar a senha!
      precisaAlterarSenha: true,
      primeiroLoginRealizado: false,
      tentativasFalhas: 0,
      bloqueadoAte: null,
      criadoEm: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.userPasswords[newUserId] = user.initialPassword?.trim() || '123456';
    this.persistAll();
    return newUser;
  }

  // --- Pedidos de Venda ---
  public getOrders(company?: CompanyId): SalesOrder[] {
    let result = [...this.orders];
    if (company) {
      result = result.filter((o) => o.rootId === company);
    }
    // Atualiza dinamicamente o semáforo de prazo
    return result.map((order) => {
      const diffMs = Date.now() - new Date(order.dataCriacao).getTime();
      const dias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return {
        ...order,
        diasCorridos: dias,
        semaforoPrazo: calculateTrafficLight(dias),
      };
    });
  }

  public getOrderById(
    id: string,
    onFirstOpen?: () => void
  ): { order: SalesOrder | null; syncedWithBlingFirstOpen: boolean } {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return { order: null, syncedWithBlingFirstOpen: false };

    let synced = false;
    // Requisito: Abrir um pedido dispara sincronização com o Bling, mas apenas na primeira abertura (atualizar-bling?silent=1)
    if (!this.openedOrdersForBlingSync.has(id)) {
      this.openedOrdersForBlingSync.add(id);
      order.blingSincronizado = true;
      order.blingUltimaSincronizacao = new Date().toISOString();
      synced = true;
      this.persistAll();
      if (onFirstOpen) onFirstOpen();
    }

    return { order: { ...order }, syncedWithBlingFirstOpen: synced };
  }

  public createOrder(orderData: Partial<SalesOrder>): SalesOrder {
    const nextNumber = Math.max(...this.orders.map((o) => o.numeroPedido), 10452) + 1;
    const newId = `ped_${orderData.rootId?.toLowerCase() || 'fc'}_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newOrder: SalesOrder = {
      id: newId,
      numeroPedido: nextNumber,
      rootId: orderData.rootId || 'FC',
      origem: orderData.origem || 'manual',
      canalVenda: orderData.canalVenda || 'Venda Direta',
      status: 'conferencia_pagamento',
      blingSincronizado: false,
      desvioCompras: false,
      desvioPagamentoNf: false,
      bloqueadoBling: false,
      dataCriacao: nowIso,
      diasCorridos: 0,
      semaforoPrazo: 'verde',
      clienteNome: orderData.clienteNome || 'Cliente Não Informado',
      clienteTipoPessoa: orderData.clienteTipoPessoa || 'J',
      clienteCpfCnpj: orderData.clienteCpfCnpj || '00.000.000/0001-00',
      clienteEmail: orderData.clienteEmail || '',
      clienteTelefone: orderData.clienteTelefone || '',
      clienteWhatsApp: orderData.clienteWhatsApp || '',
      clienteCep: orderData.clienteCep || '80000-000',
      clienteEndereco: orderData.clienteEndereco || 'Rua Principal',
      clienteNumero: orderData.clienteNumero || '100',
      clienteBairro: orderData.clienteBairro || 'Centro',
      clienteCidade: orderData.clienteCidade || 'Curitiba',
      clienteUf: orderData.clienteUf || 'PR',
      vendedorId: orderData.vendedorId || 'usr_vend_01',
      vendedorNome: orderData.vendedorNome || 'Carlos Eduardo Silva',
      percentualComissao: 3.0,
      valorComissao: ((orderData.valorTotal || 0) * 0.03),
      valorSubtotal: orderData.valorSubtotal || orderData.valorTotal || 0,
      valorDesconto: orderData.valorDesconto || 0,
      valorFrete: orderData.valorFrete || 0,
      valorOutrasDespesas: 0,
      valorTotal: orderData.valorTotal || 0,
      formaPagamento: orderData.formaPagamento || 'PIX',
      condicaoPagamento: orderData.condicaoPagamento || 'À vista',
      pagamentoConfirmado: false,
      cobrancaEnviadaWhatsApp: false,
      transportadoraId: orderData.transportadoraId || 'transp_01',
      transportadoraNome: orderData.transportadoraNome || 'Braspress Transportes Urgentes',
      servicoTransporte: orderData.servicoTransporte || 'Padrão',
      tipoFrete: orderData.tipoFrete || 'CIF',
      conferenciaRealizada: false,
      medidas: orderData.medidas || {
        volumes: 1,
        pesoBrutoKg: 5,
        pesoLiquidoKg: 4.5,
        comprimentoCm: 30,
        larguraCm: 25,
        alturaCm: 20,
        cubagemM3: 0.015,
        tipoEmbalagem: 'Caixa Padrão',
      },
      itens: orderData.itens || [],
      quantidadeTotalItens: orderData.itens?.reduce((acc, i) => acc + i.quantidade, 0) || 0,
      observacoesInternas: orderData.observacoesInternas || '',
      historicoTransicoes: [
        {
          id: `tr_${Date.now()}`,
          pedidoId: newId,
          acao: 'gerar_pedido_bling',
          statusAnterior: 'novo',
          statusNovo: 'conferencia_pagamento',
          usuarioId: orderData.vendedorId || 'usr_vend_01',
          usuarioNome: orderData.vendedorNome || 'Vendedor',
          setorUsuario: 'vendedor',
          dataHora: nowIso,
          detalhes: 'Pedido criado no sistema e aguardando conferência financeira.',
        },
      ],
      ...orderData,
    };

    this.orders.unshift(newOrder);
    this.persistAll();
    return newOrder;
  }

  /**
   * Executa uma das 22 ações da máquina de estados do pedido de venda
   */
  public executeOrderAction(
    orderId: string,
    action: OrderAction,
    currentUser: User,
    params?: Record<string, any>
  ): { success: boolean; order?: SalesOrder; error?: string } {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, error: 'Pedido não localizado.' };
    }

    const order = this.orders[orderIndex];
    const prevStatus = order.status;
    let nextStatus: OrderStatus = order.status;
    let transitionDetails = '';

    switch (action) {
      case 'confirmar_conferencia_pagamento':
        // Se houver desconto superior a R$ 1.000 ou > 5%, requer aprovação de gerente
        if (order.valorDesconto > 800) {
          nextStatus = 'aprovacao_gerente';
          transitionDetails = `Pagamento aprovado. Desconto elevado (R$ ${order.valorDesconto.toFixed(2)}) exige aprovação de margem pela gerência.`;
        } else {
          nextStatus = 'novo';
          transitionDetails = 'Pagamento verificado com sucesso pelo financeiro. Liberado para pedido gerado.';
        }
        order.pagamentoConfirmado = true;
        order.dataConfirmacaoPagamento = new Date().toISOString();
        break;

      case 'rejeitar_pagamento':
        nextStatus = 'conferencia_pagamento';
        transitionDetails = `Comprovante rejeitado pelo financeiro: ${params?.motivo || 'Divergência de valor/identificação'}.`;
        break;

      case 'aprovar_gerente':
        nextStatus = 'novo';
        transitionDetails = 'Desconto e condições comerciais aprovadas pela gerência.';
        order.dataAprovacao = new Date().toISOString();
        break;

      case 'rejeitar_gerente':
        nextStatus = 'cancelado';
        transitionDetails = `Pedido rejeitado pela gerência: ${params?.motivo || 'Margem incompatível com política comercial'}.`;
        order.motivoCancelamento = params?.motivo || 'Rejeição de margem pela gerência.';
        break;

      case 'gerar_pedido_bling':
        nextStatus = 'pedido_gerado';
        order.blingId = `bl_${Math.floor(Math.random() * 90000 + 10000)}`;
        order.blingNumero = `ORC-${Math.floor(Math.random() * 9000 + 1000)}`;
        order.blingSincronizado = true;
        order.blingUltimaSincronizacao = new Date().toISOString();
        transitionDetails = `Integrado e gerado no Bling com ID ${order.blingId}.`;
        break;

      case 'enviar_para_logistica':
        nextStatus = 'em_logistica';
        transitionDetails = 'Enviado para a esteira e bancada de separação física.';
        break;

      case 'iniciar_separacao':
        nextStatus = 'em_logistica';
        order.separadorId = currentUser.id;
        order.separadorNome = currentUser.nome;
        order.inicioSeparacao = new Date().toISOString();
        transitionDetails = `Separador ${currentUser.nome} iniciou a coleta física dos itens.`;
        break;

      case 'conferir_logistica':
        nextStatus = 'aguardando_nf';
        order.conferenteId = currentUser.id;
        order.conferenteNome = currentUser.nome;
        order.conferenciaRealizada = true;
        order.conferenciaDataHora = new Date().toISOString();
        // Marca todos os itens como conferidos
        order.itens = order.itens.map((it) => ({ ...it, conferido: true, bipadoEm: new Date().toISOString() }));
        transitionDetails = 'Conferência cega e checagem dimensional concluída. Pronto para faturamento.';
        break;

      case 'desfazer_conferencia_logistica':
        nextStatus = 'em_logistica';
        order.conferenciaRealizada = false;
        order.conferenciaDataHora = undefined;
        order.itens = order.itens.map((it) => ({ ...it, conferido: false }));
        transitionDetails = `Conferência desfeita por ${currentUser.nome}. Motivo: ${params?.motivo || 'Recontagem necessária'}.`;
        break;

      case 'marcar_nf_gerada':
        nextStatus = 'aguardando_envio';
        order.numeroNf = params?.numeroNf || `${Math.floor(Math.random() * 90000 + 10000)}`;
        order.serieNf = params?.serieNf || '1';
        order.chaveAcessoNf = params?.chaveAcessoNf || `412611${Math.random().toString().slice(2, 16)}550010000${order.numeroNf}1998822110`;
        order.linkDanfe = params?.linkDanfe || `https://nfe.fazenda.pr.gov.br/danfe/${order.chaveAcessoNf}.pdf`;
        order.valorNf = Number(params?.valorNf || order.valorTotal);
        order.nfGeradaEm = new Date().toISOString();
        order.nfGeradaPor = currentUser.nome;
        transitionDetails = `NF-e ${order.numeroNf} autorizada pela SEFAZ. Aguardando agendamento de coleta.`;
        break;

      case 'editar_medidas':
        if (params) {
          order.medidas = {
            ...order.medidas,
            volumes: Number(params.volumes) || order.medidas.volumes,
            pesoBrutoKg: Number(params.pesoBrutoKg) || order.medidas.pesoBrutoKg,
            pesoLiquidoKg: Number(params.pesoLiquidoKg) || order.medidas.pesoLiquidoKg,
            comprimentoCm: Number(params.comprimentoCm) || order.medidas.comprimentoCm,
            larguraCm: Number(params.larguraCm) || order.medidas.larguraCm,
            alturaCm: Number(params.alturaCm) || order.medidas.alturaCm,
            cubagemM3:
              ((Number(params.comprimentoCm) || order.medidas.comprimentoCm) *
                (Number(params.larguraCm) || order.medidas.larguraCm) *
                (Number(params.alturaCm) || order.medidas.alturaCm)) /
              1000000,
            tipoEmbalagem: params.tipoEmbalagem || order.medidas.tipoEmbalagem,
          };
        }
        transitionDetails = `Medidas físicas atualizadas: ${order.medidas.volumes} vol, ${order.medidas.pesoBrutoKg} kg, ${order.medidas.cubagemM3.toFixed(3)} m³.`;
        break;

      case 'solicitar_pagamento_nf':
        nextStatus = 'pagamento_nf';
        order.desvioPagamentoNf = true;
        transitionDetails = 'Desvio de fluxo: mercadoria retida no galpão até compensação bancária do boleto da NF.';
        break;

      case 'confirmar_pagamento_nf':
        nextStatus = 'aguardando_envio';
        order.desvioPagamentoNf = false;
        transitionDetails = 'Boleto/PIX da NF-e quitado pelo cliente. Carga liberada para despacho.';
        break;

      case 'despachar_coleta':
        nextStatus = 'coleta_final';
        order.despachadoEm = new Date().toISOString();
        order.coletaRealizadaPor = params?.coletaRealizadaPor || 'Motorista Transportadora';
        order.codigoRastreio = params?.codigoRastreio || `BP-${Math.floor(Math.random() * 90000000 + 10000000)}-BR`;
        order.urlRastreio = `https://rastreio.nexgestor.local/track/${order.codigoRastreio}`;
        order.romaneioId = `ROM-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
        transitionDetails = `Coleta concluída pela transportadora ${order.transportadoraNome}. Rastreio: ${order.codigoRastreio}. Romaneio: ${order.romaneioId}.`;
        break;

      case 'confirmar_entrega':
        nextStatus = 'finalizado';
        order.dataEntregaEfetiva = new Date().toISOString();
        transitionDetails = `Comprovante de recebimento registrado. Pedido finalizado com sucesso.`;
        break;

      case 'enviar_compras':
        nextStatus = 'compras';
        order.desvioCompras = true;
        // Adiciona à lista de itens faltantes
        order.itens.forEach((it) => {
          if (it.faltante || params?.itemCodigo === it.codigo) {
            it.faltante = true;
            this.shortages.push({
              id: `falt_${Date.now()}_${it.id}`,
              rootId: order.rootId,
              pedidoId: order.id,
              numeroPedido: order.numeroPedido,
              codigoProduto: it.codigo,
              descricaoProduto: it.descricao,
              quantidadeFaltante: it.quantidade,
              fornecedorSugerido: params?.fornecedor || 'Fornecedor Homologado',
              status: 'PENDENTE',
              criadoEm: new Date().toISOString(),
            });
          }
        });
        transitionDetails = `Desvio para setor de Compras por falta de estoque: ${params?.motivo || 'Ruptura física identificada'}.`;
        break;

      case 'retornar_compras':
        nextStatus = 'em_logistica';
        order.desvioCompras = false;
        order.itens = order.itens.map((it) => ({ ...it, faltante: false }));
        transitionDetails = 'Reposição de estoque concluída pelo comprador. Retornado para a esteira de separação.';
        break;

      case 'cancelar_pedido':
        nextStatus = 'cancelado';
        order.motivoCancelamento = params?.motivoCancelamento || 'Cancelado pela operação.';
        transitionDetails = `Pedido cancelado. Motivo: ${order.motivoCancelamento}`;
        break;

      case 'reativar_pedido':
        nextStatus = 'novo';
        order.motivoCancelamento = undefined;
        transitionDetails = 'Pedido reativado pelo gestor. Retornado ao início da operação.';
        break;

      case 'cancelado_bling':
        nextStatus = 'cancelado';
        order.bloqueadoBling = true;
        order.motivoCancelamento = 'Cancelado externamente no Bling (sincronização via webhook).';
        transitionDetails = 'Sinalização automática: Pedido cancelado no Bling.';
        break;

      case 'religou_bling':
        nextStatus = 'novo';
        order.bloqueadoBling = false;
        transitionDetails = 'Sinalização automática: Pedido reativado no Bling.';
        break;

      case 'sincronizar_bling':
        order.blingSincronizado = true;
        order.blingUltimaSincronizacao = new Date().toISOString();
        transitionDetails = 'Sincronização manual com a API v3 do Bling concluída (atualizar-bling?silent=1).';
        break;
    }

    order.status = nextStatus;

    // Registra log de transição
    const newLog: TransitionLog = {
      id: `tr_${Date.now()}`,
      pedidoId: order.id,
      acao: action,
      statusAnterior: prevStatus,
      statusNovo: nextStatus,
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      setorUsuario: currentUser.setor,
      dataHora: new Date().toISOString(),
      detalhes: transitionDetails,
      metadata: params,
    };

    order.historicoTransicoes.unshift(newLog);
    this.orders[orderIndex] = order;
    this.persistAll();

    return { success: true, order: { ...order } };
  }

  // --- Disparo WhatsApp de Cobrança ---
  public generateWhatsAppBilling(
    orderId: string
  ): { link: string; message: string; success: boolean } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { link: '', message: '', success: false };

    const cleanPhone = (order.clienteWhatsApp || order.clienteTelefone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const template = this.settings.whatsappTemplateCobranca ||
      'Olá {{CLIENTE}}, informamos que o pedido #{{NUMERO_PEDIDO}} no valor de R$ {{VALOR}} está disponível para pagamento.';

    const message = template
      .replace('{{CLIENTE}}', order.clienteNome)
      .replace('{{NUMERO_PEDIDO}}', String(order.numeroPedido))
      .replace('{{VALOR}}', order.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
      .replace('{{LINK}}', `https://rastreio.nexgestor.local/pedidos/${order.id}`);

    const link = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;

    // Registra envio
    order.cobrancaEnviadaWhatsApp = true;
    order.cobrancaUltimoEnvio = new Date().toISOString();
    order.linkCobrancaWhatsApp = link;
    this.persistAll();

    return { link, message, success: true };
  }

  // --- Transportadoras Homologadas (Sem texto livre) ---
  public getCarriers(): Carrier[] {
    return [...this.carriers];
  }

  public saveCarrier(carrier: Partial<Carrier> & { id?: string }): Carrier {
    if (carrier.id) {
      const idx = this.carriers.findIndex((c) => c.id === carrier.id);
      if (idx !== -1) {
        this.carriers[idx] = { ...this.carriers[idx], ...carrier } as Carrier;
        this.persistAll();
        return this.carriers[idx];
      }
    }
    const newCarrier: Carrier = {
      id: `transp_${Date.now()}`,
      nome: carrier.nome || 'Nova Transportadora',
      cnpj: carrier.cnpj || '00.000.000/0001-00',
      tipo: carrier.tipo || 'RODOVIARIO',
      prazoMedioDias: carrier.prazoMedioDias || 3,
      ativo: true,
      contatoColeta: carrier.contatoColeta || 'Central de Coletas',
      telefone: carrier.telefone || '',
      taxaMinima: carrier.taxaMinima || 30.0,
      rastreioUrlTemplate: carrier.rastreioUrlTemplate || 'https://rastreio.nexgestor.local/{TRACKING}',
    };
    this.carriers.push(newCarrier);
    this.persistAll();
    return newCarrier;
  }

  // --- Compras & Rupturas ---
  public getShortages(company?: CompanyId): InventoryShortage[] {
    if (company) {
      return this.shortages.filter((s) => s.rootId === company);
    }
    return [...this.shortages];
  }

  public updateShortageStatus(shortageId: string, status: InventoryShortage['status']): boolean {
    const idx = this.shortages.findIndex((s) => s.id === shortageId);
    if (idx !== -1) {
      this.shortages[idx].status = status;
      this.persistAll();
      return true;
    }
    return false;
  }

  // --- SAC & Ocorrências ---
  public getSacTickets(company?: CompanyId): SACTicket[] {
    if (company) {
      return this.sacTickets.filter((t) => t.rootId === company);
    }
    return [...this.sacTickets];
  }

  public createSacTicket(ticket: Partial<SACTicket>): SACTicket {
    const newTicket: SACTicket = {
      id: `sac_${Date.now()}`,
      rootId: ticket.rootId || 'FC',
      pedidoId: ticket.pedidoId || '',
      numeroPedido: ticket.numeroPedido || 0,
      clienteNome: ticket.clienteNome || 'Cliente',
      motivo: ticket.motivo || 'DUVIDA',
      status: 'ABERTO',
      prioridade: ticket.prioridade || 'MEDIA',
      descricao: ticket.descricao || '',
      responsavelNome: ticket.responsavelNome || 'Equipe SAC',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    this.sacTickets.unshift(newTicket);
    this.persistAll();
    return newTicket;
  }

  // --- Configurações & Segredos Mascarados (GET /api/admin/settings) ---
  public getSettings(): IntegrationSettings {
    // Retorna sempre com credenciais mascaradas para não vazar secrets na UI!
    return {
      ...this.settings,
      blingFcClientSecretMasked: '••••••••••••••••••••••••••••••••',
      blingFcApiKeyMasked: '••••••••••••••••••••••••••••••••',
      blingFcRefreshTokenMasked: '••••••••••••••••••••••••••••••••',
      blingLaClientSecretMasked: '••••••••••••••••••••••••••••••••',
      blingLaApiKeyMasked: '••••••••••••••••••••••••••••••••',
      blingLaRefreshTokenMasked: '••••••••••••••••••••••••••••••••',
      whatsappApiKeyMasked: '••••••••••••••••••••••••••••••••',
    };
  }

  public saveSettings(newSettings: Partial<IntegrationSettings>): IntegrationSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.persistAll();
    return this.getSettings();
  }

  // --- Rastreio Público (Sem Autenticação) ---
  public trackOrderPublic(query: string): SalesOrder | null {
    const clean = query.trim().toLowerCase().replace(/\D/g, '');
    const cleanText = query.trim().toLowerCase();

    return (
      this.orders.find((o) => {
        if (String(o.numeroPedido) === query.trim()) return true;
        if (o.codigoRastreio && o.codigoRastreio.toLowerCase() === cleanText) return true;
        if (clean.length >= 6 && o.clienteCpfCnpj.replace(/\D/g, '').includes(clean)) return true;
        return false;
      }) || null
    );
  }
}

export const api = new ErpApiService();
