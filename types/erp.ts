/**
 * Saleon ERP - Tipos de Domínio e Arquitetura de Dados
 * Multiempresa (FC - Ferramentas Curitiba e LA - Loja do Abastecimento)
 */

export type CompanyId = 'FC' | 'LA';

export type UserSector =
  | 'vendedor'
  | 'financeiro'
  | 'separador'
  | 'logistica'
  | 'gerente_logistica'
  | 'comprador'
  | 'conferente'
  | 'sac'
  | 'root';

export type PermissionScope = 'todas' | 'restrito';

export interface User {
  id: string;
  nome: string;
  email: string;
  username: string; // Case-insensitive check
  funcao?: string; // Cargo ou função personalizada (ex: Gerente de Vendas, Operador, etc.)
  setor: UserSector;
  empresa: CompanyId | 'TODAS';
  escopo: PermissionScope;
  isRoot: boolean;
  avatarUrl?: string;
  ativo: boolean;
  precisaAlterarSenha?: boolean; // Requisito: obrigatoriedade de redefinir senha no primeiro login
  primeiroLoginRealizado?: boolean;
  tentativasFalhas?: number;
  bloqueadoAte?: number | null; // Timestamp de bloqueio por rate limit
  criadoEm: string;
}

export type OrderStatus =
  | 'conferencia_pagamento' // 1. conferência de pagamento
  | 'aprovacao_gerente'      // 2. aprovação do gerente
  | 'novo'                   // 3. novo
  | 'pedido_gerado'          // 4. pedido gerado
  | 'em_logistica'           // 5. em logística
  | 'aguardando_nf'          // 6. aguardando NF
  | 'aguardando_envio'       // 7. aguardando envio
  | 'coleta_final'           // 8. coleta final
  | 'finalizado'             // 9. finalizado
  | 'compras'                // Desvio 1: compras (itens faltantes)
  | 'pagamento_nf'           // Desvio 2: pagamento da NF
  | 'cancelado';             // Desvio 3: cancelado

export type OrderAction =
  | 'confirmar_conferencia_pagamento'
  | 'rejeitar_pagamento'
  | 'aprovar_gerente'
  | 'rejeitar_gerente'
  | 'gerar_pedido_bling'
  | 'enviar_para_logistica'
  | 'iniciar_separacao'
  | 'conferir_logistica'
  | 'desfazer_conferencia_logistica'
  | 'marcar_nf_gerada'
  | 'editar_medidas'
  | 'solicitar_pagamento_nf'
  | 'confirmar_pagamento_nf'
  | 'despachar_coleta'
  | 'confirmar_entrega'
  | 'enviar_compras'
  | 'retornar_compras'
  | 'cancelar_pedido'
  | 'reativar_pedido'
  | 'cancelado_bling'
  | 'religou_bling'
  | 'sincronizar_bling';

export type TrafficLightColor = 'verde' | 'amarelo' | 'vermelho';

export interface OrderItem {
  id: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  conferido?: boolean;
  bipadoEm?: string;
  faltante?: boolean;
  localizacaoEstoque?: string;
}

export interface OrderMeasures {
  volumes: number;
  pesoBrutoKg: number;
  pesoLiquidoKg: number;
  comprimentoCm: number;
  larguraCm: number;
  alturaCm: number;
  cubagemM3: number;
  tipoEmbalagem: string;
}

export interface TransitionLog {
  id: string;
  pedidoId: string;
  acao: OrderAction;
  statusAnterior: OrderStatus;
  statusNovo: OrderStatus;
  usuarioId: string;
  usuarioNome: string;
  setorUsuario: UserSector;
  dataHora: string;
  detalhes?: string;
  metadata?: Record<string, any>;
}

/**
 * Tabela principal: pedidos_vendas
 * Contém cerca de 110 campos estruturados para atender os requisitos fiscais,
 * logísticos, comerciais, Bling e multi-tenant.
 */
export interface SalesOrder {
  // Identificação e Tenant
  id: string; // nanoid
  numeroPedido: number;
  rootId: CompanyId; // Multi-tenant (FC ou LA)
  blingId?: string;
  blingNumero?: string;
  numeroOrcamentoBling?: string;
  origem: 'bling' | 'site' | 'manual' | 'televendas';
  canalVenda: string;

  // Status e Workflow
  status: OrderStatus;
  statusAnterior?: OrderStatus;
  statusBlingOriginal?: string;
  blingSincronizado: boolean;
  blingUltimaSincronizacao?: string;
  desvioCompras: boolean;
  desvioPagamentoNf: boolean;
  bloqueadoBling: boolean;
  motivoCancelamento?: string;

  // Datas e Semáforo SLA
  dataCriacao: string;
  dataAprovacao?: string;
  dataEmissaoNf?: string;
  dataDespacho?: string;
  dataPrevisaoEntrega?: string;
  dataEntregaEfetiva?: string;
  diasCorridos: number;
  semaforoPrazo: TrafficLightColor; // verde: 0-4d, amarelo: 4-9d, vermelho: >9d

  // Cliente (Dados Fiscais e Cadastrais)
  clienteNome: string;
  clienteTipoPessoa: 'F' | 'J';
  clienteCpfCnpj: string;
  clienteRgIe?: string;
  clienteEmail: string;
  clienteTelefone: string;
  clienteWhatsApp: string;
  clienteCep: string;
  clienteEndereco: string;
  clienteNumero: string;
  clienteComplemento?: string;
  clienteBairro: string;
  clienteCidade: string;
  clienteUf: string;
  clienteIbgeCidade?: string;

  // Vendedor e Comissões
  vendedorId: string;
  vendedorNome: string;
  percentualComissao: number;
  valorComissao: number;

  // Valores Financeiros
  valorSubtotal: number;
  valorDesconto: number;
  valorFrete: number;
  valorOutrasDespesas: number;
  valorTotal: number;
  formaPagamento: 'PIX' | 'BOLETO' | 'CARTAO_CREDITO' | 'FATURADO' | 'TRANSFERENCIA';
  condicaoPagamento: string;
  pagamentoConfirmado: boolean;
  dataConfirmacaoPagamento?: string;
  comprovantePagamentoUrl?: string;
  linkCobrancaWhatsApp?: string;
  cobrancaEnviadaWhatsApp?: boolean;
  cobrancaUltimoEnvio?: string;

  // Faturamento e Nota Fiscal
  numeroNf?: string;
  serieNf?: string;
  chaveAcessoNf?: string;
  linkDanfe?: string;
  linkXmlNf?: string;
  nfGeradaEm?: string;
  nfGeradaPor?: string;
  valorNf?: number;

  // Logística e Expedição
  transportadoraId: string;
  transportadoraNome: string;
  servicoTransporte: string;
  tipoFrete: 'CIF' | 'FOB';
  codigoRastreio?: string;
  urlRastreio?: string;
  conferenteId?: string;
  conferenteNome?: string;
  separadorId?: string;
  separadorNome?: string;
  inicioSeparacao?: string;
  fimSeparacao?: string;
  conferenciaRealizada: boolean;
  conferenciaDataHora?: string;
  despachadoEm?: string;
  coletaRealizadaPor?: string;
  romaneioId?: string;
  latitudeEntrega?: number;
  longitudeEntrega?: number;

  // Medidas e Embalagem
  medidas: OrderMeasures;

  // Itens
  itens: OrderItem[];
  quantidadeTotalItens: number;

  // Observações
  observacoesInternas?: string;
  observacoesCliente?: string;

  // Histórico
  historicoTransicoes: TransitionLog[];
}

export interface Carrier {
  id: string;
  nome: string;
  cnpj: string;
  tipo: 'RODOVIARIO' | 'AEREO' | 'MOTOBOY' | 'CORREIOS';
  prazoMedioDias: number;
  ativo: boolean;
  contatoColeta: string;
  telefone: string;
  taxaMinima: number;
  rastreioUrlTemplate: string;
}

export interface InventoryShortage {
  id: string;
  rootId: CompanyId;
  pedidoId: string;
  numeroPedido: number;
  codigoProduto: string;
  descricaoProduto: string;
  quantidadeFaltante: number;
  fornecedorSugerido: string;
  status: 'PENDENTE' | 'COTADO' | 'COMPRADO' | 'RECEBIDO';
  criadoEm: string;
  dataPrevisaoChegada?: string;
}

export interface SACTicket {
  id: string;
  rootId: CompanyId;
  pedidoId: string;
  numeroPedido: number;
  clienteNome: string;
  motivo: 'AVARIA' | 'EXTRAVIO' | 'PRODUTO_ERRADO' | 'ATRASO' | 'DUVIDA' | 'DEVOLUCAO';
  status: 'ABERTO' | 'EM_ANALISE' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDO' | 'CANCELADO';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  descricao: string;
  responsavelNome: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface IntegrationSettings {
  blingFcClientId: string;
  blingFcClientSecretMasked: string;
  blingFcApiKeyMasked: string;
  blingFcRefreshTokenMasked: string;
  blingFcStatus: 'CONECTADO' | 'DESCONECTADO' | 'ERRO';

  blingLaClientId: string;
  blingLaClientSecretMasked: string;
  blingLaApiKeyMasked: string;
  blingLaRefreshTokenMasked: string;
  blingLaStatus: 'CONECTADO' | 'DESCONECTADO' | 'ERRO';

  whatsappApiUrl: string;
  whatsappApiKeyMasked: string;
  whatsappStatus: 'CONECTADO' | 'DESCONECTADO';
  whatsappTemplateCobranca: string;

  osrmEndpointUrl: string;
  osrmStatus: 'OPERACIONAL' | 'DEGRADADO';
}
