/**
 * Saleon ERP - Máquina de Estados do Pedido de Venda
 * 9 Status sequenciais, 3 Desvios e 22 Transições por Ação
 */

import { OrderStatus, OrderAction, UserSector, SalesOrder, TransitionLog } from '../types/erp';

export interface ActionDefinition {
  acao: OrderAction;
  rotulo: string;
  descricao: string;
  setoresPermitidos: UserSector[];
  statusOrigem: OrderStatus[];
  statusDestino: OrderStatus | 'dinamico';
  exigeParametros?: boolean;
  camposExigidos?: string[];
  icone?: string;
  corBotao?: string;
}

export const ORDER_ACTIONS_CATALOG: ActionDefinition[] = [
  {
    acao: 'confirmar_conferencia_pagamento',
    rotulo: 'Confirmar Pagamento',
    descricao: 'Aprova o recebimento do PIX/Boleto e libera o pedido para o fluxo operacional.',
    setoresPermitidos: ['financeiro', 'root'],
    statusOrigem: ['conferencia_pagamento'],
    statusDestino: 'dinamico', // Vai para 'aprovacao_gerente' se houver desconto alto, senão 'novo'
    corBotao: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    acao: 'rejeitar_pagamento',
    rotulo: 'Rejeitar / Solicitar Novo Comprovante',
    descricao: 'Comprovante ilegível ou divergente de valor.',
    setoresPermitidos: ['financeiro', 'root'],
    statusOrigem: ['conferencia_pagamento'],
    statusDestino: 'conferencia_pagamento',
    corBotao: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  {
    acao: 'aprovar_gerente',
    rotulo: 'Aprovar Desconto/Margem',
    descricao: 'Gerente comercial/logística aprova as condições especiais do pedido.',
    setoresPermitidos: ['gerente_logistica', 'root'],
    statusOrigem: ['aprovacao_gerente'],
    statusDestino: 'novo',
    corBotao: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    acao: 'rejeitar_gerente',
    rotulo: 'Rejeitar Pedido (Gerência)',
    descricao: 'Desconto não aprovado pela diretoria/gerência.',
    setoresPermitidos: ['gerente_logistica', 'root'],
    statusOrigem: ['aprovacao_gerente'],
    statusDestino: 'cancelado',
    corBotao: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  {
    acao: 'gerar_pedido_bling',
    rotulo: 'Gerar Pedido no Bling',
    descricao: 'Converte orçamento aprovado em pedido de venda oficial no Bling.',
    setoresPermitidos: ['vendedor', 'financeiro', 'root'],
    statusOrigem: ['novo'],
    statusDestino: 'pedido_gerado',
    corBotao: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  {
    acao: 'enviar_para_logistica',
    rotulo: 'Enviar para Separação',
    descricao: 'Direciona pedido para a fila de separação física no galpão.',
    setoresPermitidos: ['gerente_logistica', 'logistica', 'root'],
    statusOrigem: ['pedido_gerado'],
    statusDestino: 'em_logistica',
    corBotao: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    acao: 'iniciar_separacao',
    rotulo: 'Iniciar Separação',
    descricao: 'Separador assume o pedido e inicia a bipagem/coleta física.',
    setoresPermitidos: ['separador', 'logistica', 'root'],
    statusOrigem: ['em_logistica'],
    statusDestino: 'em_logistica',
    corBotao: 'bg-sky-600 hover:bg-sky-700 text-white',
  },
  {
    acao: 'conferir_logistica',
    rotulo: 'Concluir Conferência',
    descricao: 'Valida checklist de produtos, conferência cega e peso aferido.',
    setoresPermitidos: ['conferente', 'gerente_logistica', 'root'],
    statusOrigem: ['em_logistica'],
    statusDestino: 'aguardando_nf',
    corBotao: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  {
    acao: 'desfazer_conferencia_logistica',
    rotulo: 'Desfazer Conferência',
    descricao: 'Retorna pedido para recontagem física por divergência.',
    setoresPermitidos: ['gerente_logistica', 'root'],
    statusOrigem: ['aguardando_nf'],
    statusDestino: 'em_logistica',
    corBotao: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  {
    acao: 'marcar_nf_gerada',
    rotulo: 'Informar NF Emitida',
    descricao: 'Registra número da NF-e, chave de acesso de 44 dígitos e link do DANFE.',
    setoresPermitidos: ['financeiro', 'root'],
    statusOrigem: ['aguardando_nf'],
    statusDestino: 'aguardando_envio',
    exigeParametros: true,
    camposExigidos: ['numeroNf', 'chaveAcessoNf', 'linkDanfe', 'valorNf'],
    corBotao: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    acao: 'editar_medidas',
    rotulo: 'Editar Medidas e Volumes',
    descricao: 'Atualiza cubagem, peso líquido/bruto e quantidade de volumes.',
    setoresPermitidos: ['separador', 'conferente', 'logistica', 'gerente_logistica', 'root'],
    statusOrigem: ['em_logistica', 'aguardando_nf', 'aguardando_envio'],
    statusDestino: 'dinamico',
    exigeParametros: true,
    camposExigidos: ['volumes', 'pesoBrutoKg', 'comprimentoCm', 'larguraCm', 'alturaCm'],
    corBotao: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
  {
    acao: 'solicitar_pagamento_nf',
    rotulo: 'Reter para Pagamento de NF',
    descricao: 'Desvio: cliente só pode receber mercadoria mediante liquidação do boleto da NF.',
    setoresPermitidos: ['financeiro', 'root'],
    statusOrigem: ['aguardando_envio'],
    statusDestino: 'pagamento_nf',
    corBotao: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
  {
    acao: 'confirmar_pagamento_nf',
    rotulo: 'Liberar NF Paga para Envio',
    descricao: 'Boleto/PIX da NF compensado, retoma expedição.',
    setoresPermitidos: ['financeiro', 'root'],
    statusOrigem: ['pagamento_nf'],
    statusDestino: 'aguardando_envio',
    corBotao: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    acao: 'despachar_coleta',
    rotulo: 'Despachar para Coleta',
    descricao: 'Mercadoria entregue à transportadora ou motoboy com emissão de romaneio.',
    setoresPermitidos: ['logistica', 'gerente_logistica', 'root'],
    statusOrigem: ['aguardando_envio'],
    statusDestino: 'coleta_final',
    exigeParametros: true,
    camposExigidos: ['transportadoraId', 'codigoRastreio', 'coletaRealizadaPor'],
    corBotao: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
  {
    acao: 'confirmar_entrega',
    rotulo: 'Confirmar Entrega ao Destinatário',
    descricao: 'Canhoto assinado ou comprovante eletrônico de entrega da transportadora.',
    setoresPermitidos: ['logistica', 'gerente_logistica', 'sac', 'root'],
    statusOrigem: ['coleta_final'],
    statusDestino: 'finalizado',
    corBotao: 'bg-green-700 hover:bg-green-800 text-white',
  },
  {
    acao: 'enviar_compras',
    rotulo: 'Desviar para Compras (Falta de Estoque)',
    descricao: 'Ruptura de estoque identificada na separação física.',
    setoresPermitidos: ['separador', 'conferente', 'logistica', 'comprador', 'root'],
    statusOrigem: ['em_logistica', 'novo', 'pedido_gerado'],
    statusDestino: 'compras',
    corBotao: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  {
    acao: 'retornar_compras',
    rotulo: 'Estoque Suprido (Retornar à Logística)',
    descricao: 'Mercadoria recebida da fábrica/distribuidor, liberando o pedido.',
    setoresPermitidos: ['comprador', 'gerente_logistica', 'root'],
    statusOrigem: ['compras'],
    statusDestino: 'em_logistica',
    corBotao: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    acao: 'cancelar_pedido',
    rotulo: 'Cancelar Pedido',
    descricao: 'Cancelamento comercial, operacional ou a pedido do cliente.',
    setoresPermitidos: ['vendedor', 'gerente_logistica', 'financeiro', 'root'],
    statusOrigem: ['conferencia_pagamento', 'aprovacao_gerente', 'novo', 'pedido_gerado', 'em_logistica', 'aguardando_nf', 'aguardando_envio', 'compras', 'pagamento_nf'],
    statusDestino: 'cancelado',
    exigeParametros: true,
    camposExigidos: ['motivoCancelamento'],
    corBotao: 'bg-red-600 hover:bg-red-700 text-white',
  },
  {
    acao: 'reativar_pedido',
    rotulo: 'Reativar Pedido Cancelado',
    descricao: 'Restaura pedido cancelado para a etapa inicial.',
    setoresPermitidos: ['gerente_logistica', 'root'],
    statusOrigem: ['cancelado'],
    statusDestino: 'novo',
    corBotao: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
  {
    acao: 'cancelado_bling',
    rotulo: 'Sinalizar Cancelado no Bling',
    descricao: 'Webhook de sincronização externa recebido do Bling indicando cancelamento.',
    setoresPermitidos: ['root'],
    statusOrigem: ['novo', 'pedido_gerado', 'em_logistica', 'aguardando_nf'],
    statusDestino: 'cancelado',
    corBotao: 'bg-red-700 hover:bg-red-800 text-white',
  },
  {
    acao: 'religou_bling',
    rotulo: 'Religou no Bling',
    descricao: 'Reativação de pedido desfeito no Bling.',
    setoresPermitidos: ['root'],
    statusOrigem: ['cancelado'],
    statusDestino: 'novo',
    corBotao: 'bg-emerald-700 hover:bg-emerald-800 text-white',
  },
  {
    acao: 'sincronizar_bling',
    rotulo: 'Sincronizar com Bling',
    descricao: 'Executa atualização silenciosa com a API v3 do Bling (atualizar-bling?silent=1).',
    setoresPermitidos: ['vendedor', 'financeiro', 'separador', 'logistica', 'gerente_logistica', 'comprador', 'conferente', 'sac', 'root'],
    statusOrigem: ['conferencia_pagamento', 'aprovacao_gerente', 'novo', 'pedido_gerado', 'em_logistica', 'aguardando_nf', 'aguardando_envio', 'coleta_final', 'finalizado', 'compras', 'pagamento_nf', 'cancelado'],
    statusDestino: 'dinamico',
    corBotao: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
];

export const STATUS_LABELS: Record<OrderStatus, { label: string; badgeClass: string; stepIndex: number }> = {
  conferencia_pagamento: {
    label: '1. Conferência de Pagamento',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    stepIndex: 1,
  },
  aprovacao_gerente: {
    label: '2. Aprovação do Gerente',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    stepIndex: 2,
  },
  novo: {
    label: '3. Novo',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    stepIndex: 3,
  },
  pedido_gerado: {
    label: '4. Pedido Gerado',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    stepIndex: 4,
  },
  em_logistica: {
    label: '5. Em Logística',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    stepIndex: 5,
  },
  aguardando_nf: {
    label: '6. Aguardando NF',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
    stepIndex: 6,
  },
  aguardando_envio: {
    label: '7. Aguardando Envio',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    stepIndex: 7,
  },
  coleta_final: {
    label: '8. Coleta Final',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    stepIndex: 8,
  },
  finalizado: {
    label: '9. Finalizado',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    stepIndex: 9,
  },
  compras: {
    label: 'Desvio: Compras (Falta)',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    stepIndex: -1,
  },
  pagamento_nf: {
    label: 'Desvio: Pagamento da NF',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    stepIndex: -2,
  },
  cancelado: {
    label: 'Desvio: Cancelado',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    stepIndex: -3,
  },
};

/**
 * Avalia o semáforo de prazo conforme regra:
 * - Verde: 0 a 4 dias
 * - Amarelo: 4 a 9 dias
 * - Vermelho: acima de 9 dias
 */
export function calculateTrafficLight(diasCorridos: number): 'verde' | 'amarelo' | 'vermelho' {
  if (diasCorridos <= 4) return 'verde';
  if (diasCorridos <= 9) return 'amarelo';
  return 'vermelho';
}

/**
 * Retorna as ações disponíveis para um pedido considerando o status atual e o perfil do usuário
 */
export function getAvailableActions(order: SalesOrder, userSector: UserSector, isRoot: boolean): ActionDefinition[] {
  return ORDER_ACTIONS_CATALOG.filter((actionDef) => {
    // 1. Verifica se o status de origem é compatível
    const statusCompativel = actionDef.statusOrigem.includes(order.status);
    if (!statusCompativel) return false;

    // 2. Verifica se o setor tem permissão (Root tem acesso total)
    if (isRoot) return true;
    return actionDef.setoresPermitidos.includes(userSector);
  });
}
