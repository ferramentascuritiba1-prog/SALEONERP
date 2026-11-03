/**
 * Saleon ERP - Base de Dados Operacional Limpa
 * Apenas usuário administrador inicial ativo (admin / 123456)
 * Todos os dados fictícios foram removidos.
 * Requisito: primeiro login requer alteração obrigatória de senha.
 */

import { User, SalesOrder, Carrier, InventoryShortage, SACTicket, IntegrationSettings } from '../types/erp';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    nome: 'Administrador Geral',
    email: 'admin@saleon.com.br',
    username: 'admin',
    funcao: 'Administrador do Sistema / Root',
    setor: 'root',
    empresa: 'TODAS',
    escopo: 'todas',
    isRoot: true,
    ativo: true,
    precisaAlterarSenha: true, // Requisito: após o primeiro login precisar alterar a senha
    primeiroLoginRealizado: false,
    tentativasFalhas: 0,
    bloqueadoAte: null,
    criadoEm: '2025-01-01T08:00:00Z',
  },
];

export const INITIAL_CARRIERS: Carrier[] = [
  {
    id: 'transp_01',
    nome: 'Braspress Transportes Urgentes',
    cnpj: '48.460.985/0001-08',
    tipo: 'RODOVIARIO',
    prazoMedioDias: 3,
    ativo: true,
    contatoColeta: 'Central de Cargas Curitiba - (41) 3219-5000',
    telefone: '(41) 3219-5000',
    taxaMinima: 45.0,
    rastreioUrlTemplate: 'https://www.braspress.com.br/rastreamento?doc={TRACKING}',
  },
  {
    id: 'transp_02',
    nome: 'Jadlog Logística S/A',
    cnpj: '04.884.082/0001-35',
    tipo: 'RODOVIARIO',
    prazoMedioDias: 2,
    ativo: true,
    contatoColeta: 'Depósito CIC - (41) 3348-1122',
    telefone: '(41) 3348-1122',
    taxaMinima: 35.0,
    rastreioUrlTemplate: 'https://www.jadlog.com.br/tracking?cte={TRACKING}',
  },
  {
    id: 'transp_03',
    nome: 'Total Express',
    cnpj: '73.939.449/0001-56',
    tipo: 'RODOVIARIO',
    prazoMedioDias: 4,
    ativo: true,
    contatoColeta: 'Hub Pinhais - (41) 3668-9900',
    telefone: '(41) 3668-9900',
    taxaMinima: 28.5,
    rastreioUrlTemplate: 'https://tracking.totalexpress.com.br/track/{TRACKING}',
  },
  {
    id: 'transp_04',
    nome: 'Expresso São Miguel / Rodonaves',
    cnpj: '44.914.992/0001-85',
    tipo: 'RODOVIARIO',
    prazoMedioDias: 3,
    ativo: true,
    contatoColeta: 'Filial Curitiba - (41) 3012-7700',
    telefone: '(41) 3012-7700',
    taxaMinima: 52.0,
    rastreioUrlTemplate: 'https://www.rodonaves.com.br/rastreamento?cte={TRACKING}',
  },
  {
    id: 'transp_05',
    nome: 'Motoboy Express Grande Curitiba',
    cnpj: '28.112.334/0001-90',
    tipo: 'MOTOBOY',
    prazoMedioDias: 1,
    ativo: true,
    contatoColeta: 'Despacho Direto WhatsApp - (41) 99881-2233',
    telefone: '(41) 99881-2233',
    taxaMinima: 25.0,
    rastreioUrlTemplate: 'https://rastreio.saleon.local/moto/{TRACKING}',
  },
  {
    id: 'transp_06',
    nome: 'Correios (Sedex / PAC)',
    cnpj: '34.028.316/0001-03',
    tipo: 'CORREIOS',
    prazoMedioDias: 2,
    ativo: true,
    contatoColeta: 'Agência Central CEE Curitiba',
    telefone: '0800 725 0100',
    taxaMinima: 22.0,
    rastreioUrlTemplate: 'https://rastreamento.correios.com.br/app/index.php?codigo={TRACKING}',
  },
];

// Sem pedidos fictícios
export const INITIAL_ORDERS: SalesOrder[] = [];

// Sem itens faltantes fictícios
export const INITIAL_SHORTAGES: InventoryShortage[] = [];

// Sem chamados SAC fictícios
export const INITIAL_SAC_TICKETS: SACTicket[] = [];

export const INITIAL_SETTINGS: IntegrationSettings = {
  // Configurações com segredos mascarados
  blingFcClientId: 'fc_bling_app_client_prod_44810',
  blingFcClientSecretMasked: '••••••••••••••••••••••••••••••••',
  blingFcApiKeyMasked: '••••••••••••••••••••••••••••••••',
  blingFcRefreshTokenMasked: '••••••••••••••••••••••••••••••••',
  blingFcStatus: 'CONECTADO',

  blingLaClientId: 'la_bling_app_client_prod_99211',
  blingLaClientSecretMasked: '••••••••••••••••••••••••••••••••',
  blingLaApiKeyMasked: '••••••••••••••••••••••••••••••••',
  blingLaRefreshTokenMasked: '••••••••••••••••••••••••••••••••',
  blingLaStatus: 'CONECTADO',

  whatsappApiUrl: 'https://api.saleon.local/v1/whatsapp-gw',
  whatsappApiKeyMasked: '••••••••••••••••••••••••••••••••',
  whatsappStatus: 'CONECTADO',
  whatsappTemplateCobranca:
    'Olá *{{CLIENTE}}*, informamos que o pedido *#{{NUMERO_PEDIDO}}* no valor de *{{VALOR}}* está aguardando confirmação. Chave PIX: financeiro@ferramentascuritiba.com.br. Link: {{LINK}}',

  osrmEndpointUrl: 'https://router.project-osrm.org',
  osrmStatus: 'OPERACIONAL',
};
