import React, { useState } from 'react';
import { Layers, Search, Filter, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';

interface ScreenCatalogItem {
  numero: number;
  nome: string;
  tipo: 'Visível no Menu' | 'Oculta / Secundária';
  rotaOuId: string;
  setoresPermitidos: string[];
  descricao: string;
  filtros: string[];
  campos: string[];
  colunas: string[];
  botoes: string[];
}

export const SCREEN_CATALOG_LIST: ScreenCatalogItem[] = [
  {
    numero: 1,
    nome: 'Dashboard FC (Geral & Matriz)',
    tipo: 'Visível no Menu',
    rotaOuId: 'dashboard',
    setoresPermitidos: ['Todos'],
    descricao: 'Painel executivo com funil das 9 etapas sequenciais, faturamento dia/mês, alerta de pedidos no semáforo vermelho (>9 dias) e pedidos recentes.',
    filtros: ['Empresa (FC / LA)', 'Período', 'SLA Semáforo'],
    campos: ['Data Início', 'Data Fim'],
    colunas: ['# Pedido', 'Prazo (Semáforo)', 'Cliente', 'Cidade/UF', 'Vendedor', 'Valor Total', 'Status Atual', 'Ações'],
    botoes: ['Atualizar KPIs', 'Ver Pedidos Atrasados', 'Abrir Detalhe', 'Navegar para Funil'],
  },
  {
    numero: 2,
    nome: 'Pedidos de Venda',
    tipo: 'Visível no Menu',
    rotaOuId: 'pedidos',
    setoresPermitidos: ['Todos (escopo respeitado)'],
    descricao: 'Listagem mestra do pipeline comercial com pílulas para os 9 status e 3 desvios, semáforo SLA verde/amarelo/vermelho e seleção múltipla para ações em lote.',
    filtros: ['Busca por Cliente/CPF/Pedido/NF', 'Status (12 opções)', 'Semáforo Prazo (Verde 0-4d, Amarelo 4-9d, Vermelho >9d)', 'Empresa'],
    campos: ['Barra de busca textual', 'Select de semáforo', 'Checkboxes de seleção'],
    colunas: ['Select', '# Pedido', 'Prazo (SLA)', 'Origem/Bling', 'Cliente', 'Cidade/UF', 'Vendedor', 'Valor Total', 'NF-e', 'Transportadora', 'Status', 'Ação'],
    botoes: ['Novo Pedido', 'Atualizar Lista', 'Enviar Selecionados para Logística', 'Abrir Ficha do Pedido'],
  },
  {
    numero: 3,
    nome: 'Detalhes & Ficha do Pedido',
    tipo: 'Visível no Menu',
    rotaOuId: 'pedido_detalhe',
    setoresPermitidos: ['Todos'],
    descricao: 'Ficha completa com cerca de 110 campos estruturados em 7 abas, disparo silencioso de sincronização com o Bling na primeira abertura, e barra com as 22 ações da máquina de estados.',
    filtros: ['Navegação por Abas (Geral, Itens, NF-e, Medidas, Logística, Financeiro, Auditoria)'],
    campos: ['Dados completos do cliente', 'Medidas (peso, volumes, cubagem)', 'Chave NF-e 44 dígitos', 'Código rastreio', 'Motivo cancelamento'],
    colunas: ['Código SKU', 'Descrição', 'Localização Estoque', 'Quantidade', 'Valor Unitário', 'Valor Total', 'Conferido/Bipado'],
    botoes: ['Bling Sync Silencioso', 'Cobrança WhatsApp', '22 Ações de Transição (Aprovar, Concluir Conferência, Marcar NF, Despachar, Cancelar, etc.)'],
  },
  {
    numero: 4,
    nome: 'Novo Pedido de Venda',
    tipo: 'Visível no Menu',
    rotaOuId: 'novo_pedido',
    setoresPermitidos: ['vendedor', 'financeiro', 'root'],
    descricao: 'Formulário de cadastro rápido de pedido com opção de importação automática de orçamento do Bling API v3 ou inclusão manual multiempresa (FC/LA).',
    filtros: ['Empresa (FC / LA)', 'Origem (Bling vs Manual)'],
    campos: ['# Orçamento Bling', 'Razão Social', 'CPF/CNPJ', 'E-mail', 'Telefone', 'WhatsApp', 'Endereço', 'Forma de Pagamento', 'Frete', 'Desconto'],
    colunas: ['Código SKU', 'Descrição', 'Quantidade', 'Preço Unitário', 'Total', 'Remover'],
    botoes: ['Importar do Bling', 'Adicionar Produto', 'Criar Pedido de Venda', 'Cancelar'],
  },
  {
    numero: 5,
    nome: 'Separação & Conferência Logística',
    tipo: 'Visível no Menu',
    rotaOuId: 'separacao_conferencia',
    setoresPermitidos: ['separador', 'conferente', 'logistica', 'gerente_logistica', 'root'],
    descricao: 'Esteira operacional de bipagem de produtos com leitor de código de barras, checklist físico, validação de medidas/peso e desvio para compras por ruptura.',
    filtros: ['Fila de pedidos em separação', 'Busca por SKU/EAN'],
    campos: ['Campo de entrada do leitor de código de barras', 'Aferição de peso balança'],
    colunas: ['Código SKU', 'Descrição do Item', 'Localização Galpão', 'Qtd Exigida', 'Valor', 'Status Bipagem'],
    botoes: ['Bipar Item', 'Atalhos Rápidos de SKU', 'Concluir Conferência & Liberar NF', 'Sinalizar Falta no Estoque (Desviar p/ Compras)'],
  },
  {
    numero: 6,
    nome: 'Logística & Coletas (Rotas OSRM)',
    tipo: 'Visível no Menu',
    rotaOuId: 'logistica_coletas',
    setoresPermitidos: ['logistica', 'gerente_logistica', 'root'],
    descricao: 'Gestão de expedição de mercadorias com mapa rodoviário PR/SC, cálculo de rotas otimizadas via Open Source Routing Machine e romaneio de coleta.',
    filtros: ['Pedidos prontos para despacho', 'Transportadora selecionada'],
    campos: ['Código de rastreio', 'Identificação do motorista / placa'],
    colunas: ['# Pedido', 'Transportadora', 'Cliente', 'Cidade/UF', 'Valor Carga', 'Ação Despacho'],
    botoes: ['Calcular Rotas OSRM', 'Despachar Coleta', 'Imprimir Romaneio de Carga'],
  },
  {
    numero: 7,
    nome: 'Financeiro & Cobrança',
    tipo: 'Visível no Menu',
    rotaOuId: 'financeiro',
    setoresPermitidos: ['financeiro', 'root'],
    descricao: 'Painel de conciliação de pagamentos PIX/Boleto, liberação de crédito, retenção de carga por pendência de NF e gerador de mensagem personalizada para WhatsApp.',
    filtros: ['Aguardando Conferência Inicial', 'Retidos por Pagamento de NF', 'Forma de Pagamento'],
    campos: ['Comprovante bancário', 'Template dinâmico WhatsApp', 'Chave PIX'],
    colunas: ['# Pedido', 'Prazo Semáforo', 'Cliente', 'Forma/Condição', 'Valor Total', 'Cobrança WhatsApp', 'Ações Financeiras'],
    botoes: ['Aprovar Pagamento', 'Rejeitar Comprovante', 'Cobrar WhatsApp', 'Copiar Link Direto', 'Liberar NF Paga'],
  },
  {
    numero: 8,
    nome: 'Compras & Rupturas de Estoque',
    tipo: 'Visível no Menu',
    rotaOuId: 'compras',
    setoresPermitidos: ['comprador', 'root (403 para outros)'],
    descricao: 'Central de suprimentos para itens faltantes detectados na esteira física, agrupamento por fornecedor homologado e retorno automático à logística após reposição.',
    filtros: ['Status da Compra (Pendente, Cotado, Comprado, Recebido)', 'Fornecedor'],
    campos: ['Fornecedor sugerido', 'Data previsão de chegada', 'Quantidade comprada'],
    colunas: ['# Pedido Vinculado', 'Código Produto', 'Descrição da Peça', 'Qtd Faltante', 'Fornecedor', 'Status Compra', 'Ação'],
    botoes: ['Marcar Cotado', 'Marcar Comprado', 'Receber Estoque & Retornar à Logística', 'Atualizar Faltas'],
  },
  {
    numero: 9,
    nome: 'SAC & Ocorrências Pós-Venda',
    tipo: 'Visível no Menu',
    rotaOuId: 'sac',
    setoresPermitidos: ['sac', 'vendedor', 'root'],
    descricao: 'Registro e tratamento de ocorrências de clientes vinculadas aos pedidos: avarias de transporte, extravios, produtos divergentes e devoluções.',
    filtros: ['Status do Chamado', 'Motivo da Ocorrência', 'Prioridade (Baixa, Média, Alta, Urgente)'],
    campos: ['# Pedido', 'Motivo', 'Prioridade', 'Descrição da Ocorrência', 'Responsável'],
    colunas: ['# Chamado', '# Pedido', 'Cliente', 'Motivo', 'Prioridade', 'Descrição', 'Responsável', 'Status'],
    botoes: ['Abrir Chamado SAC', 'Salvar Chamado', 'Encaminhar p/ Seguro de Carga'],
  },
  {
    numero: 10,
    nome: 'Vendedores & Metas',
    tipo: 'Visível no Menu',
    rotaOuId: 'vendedores',
    setoresPermitidos: ['Todos'],
    descricao: 'Ranking mensal da equipe comercial, faturamento fechado, metas individuais e cálculo automático de comissões por faixa comercial.',
    filtros: ['Empresa (FC / LA)', 'Mês Vigente'],
    campos: ['Meta individual (R$)'],
    colunas: ['Ranking', 'Vendedor', 'E-mail', 'Vendido no Mês', 'Comissão Acumulada', 'Pedidos Fechados', 'Atingimento'],
    botoes: ['Simular Vendedor', 'Exportar Ranking'],
  },
  {
    numero: 11,
    nome: 'Pedidos do Site (E-commerce)',
    tipo: 'Visível no Menu',
    rotaOuId: 'pedidos_site',
    setoresPermitidos: ['vendedor', 'financeiro', 'root (403 para outros)'],
    descricao: 'Fila de pedidos recebidos da loja virtual (Nuvemshop/WooCommerce) com conciliação do gateway de pagamento e importação em 1 clique para o ERP.',
    filtros: ['Status de Integração (Importado vs Pendente)', 'Gateway de Pagamento'],
    campos: ['Identificador do site', 'Webhook payload'],
    colunas: ['# Loja Virtual', 'Data/Hora', 'Cliente Web', 'Município', 'Gateway Pagamento', 'Valor Total', 'Status ERP', 'Ação'],
    botoes: ['Importar para ERP', 'Reconectar Webhook'],
  },
  {
    numero: 12,
    nome: 'Dashboard LA (Loja do Abastecimento)',
    tipo: 'Visível no Menu',
    rotaOuId: 'dashboard_la',
    setoresPermitidos: ['root, usuários com escopo LA (403 para restritos FC)'],
    descricao: 'Visão executiva da filial de insumos agrícolas e suprimentos pesados (lubrificantes industriais, filtros, graxas, correias e frotas agrícolas).',
    filtros: ['Filtro exclusivo root_id: LA'],
    campos: ['Volume lubrificantes (Litros)', 'Pallets pesados'],
    colunas: ['# Pedido LA', 'Prazo SLA', 'Cliente Cooperativa', 'Município', 'Vendedor LA', 'Valor Total', 'Status', 'Ação'],
    botoes: ['Mudar Filtro Global para LA', 'Abrir Ficha', 'Gerar Romaneio Agrícola'],
  },
  {
    numero: 13,
    nome: 'Configurações & Integrações Bling OAuth',
    tipo: 'Oculta / Secundária',
    rotaOuId: 'configuracoes',
    setoresPermitidos: ['root'],
    descricao: 'Parâmetros de conexão Bling API v3 para FC e LA com credenciais e Client Secrets MASCARADOS para segurança contra vazamentos.',
    filtros: ['Nenhum (Tela administrativa)'],
    campos: ['Client ID FC', 'Client Secret FC (Masked)', 'Client ID LA', 'Client Secret LA (Masked)', 'Endpoint WhatsApp', 'Template Cobrança', 'Endpoint OSRM'],
    colunas: ['Serviço', 'Status', 'Último Ping', 'Versão'],
    botoes: ['Revelar Segredos (Root)', 'Salvar Configurações com Segurança', 'Testar Conexão Bling'],
  },
  {
    numero: 14,
    nome: 'Gestão dos 29 Usuários & Setores',
    tipo: 'Oculta / Secundária',
    rotaOuId: 'usuarios',
    setoresPermitidos: ['root'],
    descricao: 'Cadastro e manutenção dos 29 colaboradores em 8 setores, controle de bloqueio por rate-limit e botão de desbloqueio imediato de contas.',
    filtros: ['Busca por Nome/Login/Email', 'Setor (8 opções)', 'Empresa (FC, LA, TODAS)'],
    campos: ['Nome', 'E-mail', 'Username (Case-insensitive)', 'Setor', 'Empresa', 'Escopo'],
    colunas: ['Colaborador', 'Login', 'Setor', 'Empresa', 'Escopo', 'Segurança / Rate-Limit', 'Ação'],
    botoes: ['Cadastrar Usuário', 'Desbloquear Conta', 'Simular Usuário'],
  },
  {
    numero: 15,
    nome: 'Edição Mestre (Bulk Actions)',
    tipo: 'Oculta / Secundária',
    rotaOuId: 'edicao_mestre',
    setoresPermitidos: ['gerente_logistica', 'root'],
    descricao: 'Execução em massa de ações de transição na máquina de estados com geração automática de logs de auditoria para cada pedido afetado.',
    filtros: ['Seleção Múltipla de Pedidos', 'Ação Alvo'],
    campos: ['Select da ação da máquina de estados'],
    colunas: ['Check', '# Pedido', 'Cliente', 'Valor Total', 'Status Atual', 'Transportadora'],
    botoes: ['Selecionar Todos', 'Executar em Massa'],
  },
  {
    numero: 16,
    nome: 'Página Pública de Rastreio',
    tipo: 'Oculta / Secundária',
    rotaOuId: 'rastreio_publico',
    setoresPermitidos: ['Público (Sem autenticação)'],
    descricao: 'Página aberta para o consumidor consultar o andamento da sua compra por número de pedido, CPF/CNPJ ou código de rastreio.',
    filtros: ['Busca por número do pedido, CPF/CNPJ ou código de rastreio'],
    campos: ['Input de busca público'],
    colunas: ['Etapas 1 a 4 da linha do tempo', 'Lista de itens inclusos no pacote'],
    botoes: ['Rastrear', 'Consultar Outro Pedido'],
  },
  {
    numero: 17,
    nome: 'Auditoria & Log das 22 Transições',
    tipo: 'Oculta / Secundária',
    rotaOuId: 'auditoria_transicoes',
    setoresPermitidos: ['Todos'],
    descricao: 'Timeline cronológica detalhada de todas as ações executadas no sistema por usuário, setor, carimbo de data/hora e justificativa.',
    filtros: ['Busca por Pedido, Ação, Colaborador ou Cliente'],
    campos: ['Input de busca textual'],
    colunas: ['Data/Hora', '# Pedido', 'Cliente', 'Ação Executada', 'Transição (De -> Para)', 'Colaborador/Setor', 'Detalhes'],
    botoes: ['Filtrar', 'Exportar Log'],
  },
  {
    numero: 18,
    nome: 'Relatórios Operacionais & DRE',
    tipo: 'Oculta / Secundária',
    rotaOuId: 'relatorios',
    setoresPermitidos: ['gerente_logistica', 'financeiro', 'root'],
    descricao: 'Diagnóstico de lead time entre as etapas do pipeline comercial e esteira de expedição com identificação de gargalos de processo.',
    filtros: ['Período', 'Empresa (FC / LA)'],
    campos: ['Data inicial', 'Data final'],
    colunas: ['Etapa do Pipeline', 'Tempo Médio Estimado', 'Conformidade SLA', 'Diagnóstico Operacional'],
    botoes: ['Atualizar Diagnóstico', 'Exportar DRE'],
  },
  {
    numero: 19,
    nome: 'Catálogo de Transportadoras Homologadas',
    tipo: 'Oculta / Secundária',
    rotaOuId: 'transportadoras',
    setoresPermitidos: ['gerente_logistica', 'logistica', 'root'],
    descricao: 'Tabela normalizada de empresas de frete homologadas com CNPJ, prazos médios e taxa mínima, eliminando texto livre.',
    filtros: ['Tipo de Modal (Rodoviário, Motoboy, Sedex)'],
    campos: ['Razão Social', 'CNPJ', 'Modal', 'Prazo Médio', 'Taxa Mínima', 'Contato Coleta'],
    colunas: ['ID', 'Nome', 'CNPJ', 'Modal', 'Prazo Médio', 'Taxa Mínima', 'Central de Coleta'],
    botoes: ['Cadastrar Transportadora', 'Editar Homologação'],
  },
  {
    numero: 20,
    nome: 'Central de Arquitetura & Entregáveis',
    tipo: 'Visível no Menu',
    rotaOuId: 'arquitetura_docs',
    setoresPermitidos: ['Todos (Documentação viva do sistema)'],
    descricao: 'Central completa com os 7 entregáveis do Saleon ERP: DDL PostgreSQL, Diagrama ER, Catálogo de 104 Rotas, Máquina de Estados, Matriz RBAC, Plano e Dívida Técnica.',
    filtros: ['Abas de Documentos (DDL, ERD, Rotas API, Máquina de Estados, Matriz RBAC, Plano, Dívida Técnica)'],
    campos: ['Códigos SQL', 'Tabelas DDL', 'JSON Schema'],
    colunas: ['Entregáveis 1 a 7'],
    botoes: ['Copiar DDL SQL', 'Exportar Especificação', 'Alternar Visualização'],
  },
];

export const ScreenCatalogScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [expandedScreen, setExpandedScreen] = useState<number | null>(null);

  const filteredScreens = SCREEN_CATALOG_LIST.filter((s) => {
    if (selectedType !== 'todos' && s.tipo !== selectedType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        s.nome.toLowerCase().includes(q) ||
        s.descricao.toLowerCase().includes(q) ||
        s.setoresPermitidos.some((p) => p.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              Dicionário Completo das 20 Telas do Saleon ERP
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              12 Visíveis + 8 Secundárias
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Especificação completa de campos, filtros, colunas e botões de ação para cada tela do sistema.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar tela por nome, setor ou funcionalidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todas as 20 Telas</option>
          <option value="Visível no Menu">12 Telas Visíveis no Menu</option>
          <option value="Oculta / Secundária">8 Telas Ocultas / Secundárias</option>
        </select>
      </div>

      {/* Lista das 20 Telas */}
      <div className="space-y-3">
        {filteredScreens.map((item) => {
          const isExpanded = expandedScreen === item.numero;
          return (
            <div
              key={item.numero}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all text-xs"
            >
              <div
                onClick={() => setExpandedScreen(isExpanded ? null : item.numero)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold font-mono">
                    {item.numero < 10 ? `0${item.numero}` : item.numero}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.nome}</h3>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{item.descricao}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.tipo === 'Visível no Menu'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {item.tipo}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3 animate-in fade-in duration-100">
                  <p className="text-slate-700 text-xs">{item.descricao}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Setores com Permissão:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.setoresPermitidos.map((p, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-mono">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Filtros da Tela:</span>
                      <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                        {item.filtros.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Colunas Principais da Tabela:</span>
                      <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                        {item.colunas.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Botões de Ação:</span>
                      <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                        {item.botoes.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
